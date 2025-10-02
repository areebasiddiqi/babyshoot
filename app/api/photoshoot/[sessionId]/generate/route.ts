import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session: authSession } } = await supabase.auth.getSession()
    
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authSession.user

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get session details with theme and prompts
    const { data: session, error: sessionError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .select(`
        *,
        themes!inner (
          id,
          name,
          image_count,
          theme_prompts!inner (
            id,
            prompt_text,
            prompt_order,
            is_active
          )
        )
      `)
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .eq('themes.theme_prompts.is_active', true)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'ready') {
      return NextResponse.json({ 
        error: 'Session is not ready for generation' 
      }, { status: 400 })
    }

    if (!session.model_id) {
      return NextResponse.json({ 
        error: 'No trained model available' 
      }, { status: 400 })
    }

    try {
      // Update session status to generating
      await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .update({ status: 'generating' })
        .eq('id', params.sessionId)

      // Get theme prompts and image count
      const theme = session.themes
      const themePrompts = theme.theme_prompts || []
      const imageCount = theme.image_count || 10

      // Sort prompts by order and take only the number needed
      const sortedPrompts = themePrompts
        .sort((a: any, b: any) => a.prompt_order - b.prompt_order)
        .slice(0, imageCount)

      // Fallback to single image generation if no theme prompts exist (backward compatibility)
      if (sortedPrompts.length === 0) {
        console.log('No theme prompts found, falling back to single image generation')
        
        // Create the prompt text with the ohwx token
        const promptText = `ohwx person ${session.enhanced_prompt}`
        console.log('Generating single image with fallback prompt:', promptText)

        // Generate single image using the trained model
        const generationJob = await AstriaAPI.generateImages(
          session.model_id,
          promptText,
          1
        )

        // Store the generation job details in the session
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({ 
            generation_job_id: generationJob.id.toString(),
            generation_prompt: promptText
          })
          .eq('id', params.sessionId)

        // Create single image record
        const imageRecords = [{
          session_id: params.sessionId,
          image_url: '',
          prompt: promptText,
          status: 'generating' as const,
          astria_prompt_id: generationJob.id.toString(),
          seed: null
        }]

        const { data: images, error: imagesError } = await supabaseAdmin.instance
          .from('generated_images')
          .insert(imageRecords)
          .select()

        if (imagesError) {
          console.error('Failed to create image records:', imagesError)
          throw new Error('Failed to create image records')
        }

        return NextResponse.json({
          message: 'Image generation started (fallback mode)',
          promptIds: [generationJob.id],
          tuneId: session.model_id,
          imageCount: 1,
          imageIds: images.map((img: any) => img.id)
        })
      }

      console.log(`Generating ${sortedPrompts.length} images with individual prompts for theme: ${theme.name}`)

      // Generate images for each prompt
      const generationJobs = []
      const imageRecords = []

      for (let i = 0; i < sortedPrompts.length; i++) {
        const themePrompt = sortedPrompts[i]
        
        // Create the full prompt with the ohwx token, base prompt, and individual theme prompt
        const fullPrompt = `ohwx person ${session.base_prompt}, ${themePrompt.prompt_text}`
        
        console.log(`Generating image ${i + 1}/${sortedPrompts.length} with prompt:`, fullPrompt)

        // Generate single image for this specific prompt
        const generationJob = await AstriaAPI.generateImages(
          session.model_id,
          fullPrompt,
          1 // Generate 1 image per prompt
        )

        generationJobs.push(generationJob)

        // Create image record for this specific prompt
        imageRecords.push({
          session_id: params.sessionId,
          image_url: '', // Will be updated when generation completes
          prompt: fullPrompt,
          status: 'generating' as const,
          astria_prompt_id: generationJob.id.toString(),
          seed: null, // Will be updated from Astria response
          theme_prompt_id: themePrompt.id // Link to specific theme prompt
        })
      }

      // Store the generation job details in the session (use first job ID as primary)
      await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .update({ 
          generation_job_id: generationJobs[0].id.toString(),
          generation_prompt: `Generated ${sortedPrompts.length} images with individual prompts`
        })
        .eq('id', params.sessionId)

      const { data: images, error: imagesError } = await supabaseAdmin.instance
        .from('generated_images')
        .insert(imageRecords)
        .select()

      if (imagesError) {
        console.error('Failed to create image records:', imagesError)
        throw new Error('Failed to create image records')
      }

      return NextResponse.json({
        message: 'Image generation started',
        promptIds: generationJobs.map(job => job.id),
        tuneId: session.model_id,
        imageCount: sortedPrompts.length,
        imageIds: images.map((img: any) => img.id)
      })

    } catch (astriaError) {
      console.error('Astria generation error:', astriaError)
      
      // Update session status back to ready
      await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .update({ status: 'ready' })
        .eq('id', params.sessionId)

      return NextResponse.json({ 
        error: 'Failed to start image generation' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
