import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'
import { generateBasePrompt, enhancePromptWithTheme } from '@/lib/utils'
import { ensureUserExists } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session: authSession } } = await supabase.auth.getSession()
    
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authSession.user

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Ensure user exists in database (sync if needed)
    await ensureUserExists(user)

    // Check user's subscription and usage
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      // Create free subscription for new user
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'free',
          status: 'active',
          photoshoots_used: 0,
          photoshoots_limit: 1,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })
    } else if (subscription.photoshoots_used >= subscription.photoshoots_limit) {
      return NextResponse.json({ 
        error: 'Photoshoot limit reached. Please upgrade your plan.' 
      }, { status: 403 })
    }

    const formData = await request.formData()
    
    // Extract child data
    const childData = {
      name: formData.get('childName') as string,
      ageInMonths: parseInt(formData.get('ageInMonths') as string),
      gender: formData.get('gender') as string,
      hairColor: formData.get('hairColor') as string,
      hairStyle: formData.get('hairStyle') as string,
      eyeColor: formData.get('eyeColor') as string,
      skinTone: formData.get('skinTone') as string,
      uniqueFeatures: formData.get('uniqueFeatures') as string || undefined
    }

    // Extract theme data
    const themeId = formData.get('themeId') as string
    const themeName = formData.get('themeName') as string
    const themePrompt = formData.get('themePrompt') as string

    // Extract and process photos
    const photoFiles: File[] = []
    for (let i = 0; i < 10; i++) {
      const file = formData.get(`photo_${i}`) as File
      if (file) {
        photoFiles.push(file)
      }
    }

    if (photoFiles.length < 3) {
      return NextResponse.json({ 
        error: 'At least 3 photos are required' 
      }, { status: 400 })
    }

    // Create or get child profile
    let childId: string
    const { data: existingChild } = await supabaseAdmin
      .from('children')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', childData.name)
      .single()

    if (existingChild) {
      childId = existingChild.id
    } else {
      const { data: newChild, error: childError } = await supabaseAdmin
        .from('children')
        .insert({
          user_id: user.id,
          name: childData.name,
          age_in_months: childData.ageInMonths,
          gender: childData.gender,
          hair_color: childData.hairColor,
          hair_style: childData.hairStyle,
          eye_color: childData.eyeColor,
          skin_tone: childData.skinTone,
          unique_features: childData.uniqueFeatures
        })
        .select('id')
        .single()

      if (childError || !newChild) {
        console.error('Failed to create child:', childError)
        return NextResponse.json({ error: 'Failed to create child profile' }, { status: 500 })
      }

      childId = newChild.id
    }

    // Generate prompts
    const basePrompt = generateBasePrompt(childData)
    const enhancedPrompt = enhancePromptWithTheme(basePrompt, themePrompt)

    // Create photoshoot session (let database generate UUID)
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('photoshoot_sessions')
      .insert({
        user_id: user.id,
        child_id: childId,
        status: 'pending',
        selected_theme_id: themeId,
        base_prompt: basePrompt,
        enhanced_prompt: enhancedPrompt,
        uploaded_photos: [] // Will be updated after upload
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('Failed to create session:', sessionError)
      return NextResponse.json({ error: 'Failed to create photoshoot session' }, { status: 500 })
    }

    // Upload photos to Astria and start training
    try {
      const uploadedUrls: string[] = []
      
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i]
        console.log(`Uploading file ${i + 1}/${photoFiles.length}: ${file.name} (${file.size} bytes)`)
        
        try {
          const buffer = Buffer.from(await file.arrayBuffer())
          
          // Convert image to data URL for Astria API
          const dataUrl = await AstriaAPI.uploadImage(buffer, file.name)
          
          if (!dataUrl) {
            throw new Error(`Failed to process ${file.name}`)
          }
          
          console.log(`Successfully processed ${file.name}`)
          uploadedUrls.push(dataUrl)
        } catch (uploadError: any) {
          console.error(`Failed to process file ${file.name}:`, uploadError)
          throw new Error(`Failed to process file ${file.name}: ${uploadError.message}`)
        }
      }

      // Update session with uploaded photo URLs
      await supabaseAdmin
        .from('photoshoot_sessions')
        .update({ uploaded_photos: uploadedUrls })
        .eq('id', session.id)

      // Start fine-tuning with data URLs
      console.log('Starting Astria fine-tuning with', uploadedUrls.length, 'images')
      
      const trainingJob = await AstriaAPI.createFineTuning(uploadedUrls, basePrompt)
      
      // Update session with training job info
      await supabaseAdmin
        .from('photoshoot_sessions')
        .update({
          status: 'training',
          training_job_id: trainingJob.id
        })
        .eq('id', session.id)

      // Update subscription usage
      if (subscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            photoshoots_used: subscription.photoshoots_used + 1 
          })
          .eq('user_id', user.id)
      }

      return NextResponse.json({ 
        sessionId: session.id,
        status: 'training',
        message: 'Photoshoot created successfully. Training AI model...' 
      })

    } catch (astriaError) {
      console.error('Astria API error:', astriaError)
      
      // Update session status to failed
      await supabaseAdmin
        .from('photoshoot_sessions')
        .update({ status: 'failed' })
        .eq('id', session.id)

      return NextResponse.json({ 
        error: 'Failed to start AI training. Please try again.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
