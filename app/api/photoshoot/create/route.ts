import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AstriaAPI } from '@/lib/astria'
import { generateBasePrompt, generateFamilyPrompt, generateFamilyFingerprint, enhancePromptWithTheme } from '@/lib/utils'
import { ensureUserExists } from '@/lib/auth-utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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

    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Ensure user exists in database (sync if needed)
    await ensureUserExists(user)

    // Check if user has enough credits (1 credit per photoshoot) - moved up before processing
    const requiredCredits = 1
    const { data: currentBalance, error: balanceError } = await supabaseAdmin.instance.rpc('get_user_credit_balance', {
      user_uuid: user.id
    })

    if (balanceError) {
      console.error('Error checking credit balance:', balanceError)
      return NextResponse.json({ error: 'Failed to check credit balance' }, { status: 500 })
    }

    if (currentBalance < requiredCredits) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        message: `You need ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} to create a photoshoot. You currently have ${currentBalance} credit${currentBalance !== 1 ? 's' : ''}.`,
        currentBalance,
        requiredCredits
      }, { status: 402 }) // 402 Payment Required
    }

    const formData = await request.formData()
    
    // Extract session type
    const sessionType = formData.get('sessionType') as string
    
    // Extract data based on session type
    let childData = null
    let familyData = null
    
    if (sessionType === 'child') {
      childData = {
        name: formData.get('childName') as string,
        ageInMonths: parseInt(formData.get('ageInMonths') as string),
        gender: formData.get('gender') as string,
        hairColor: formData.get('hairColor') as string,
        hairStyle: formData.get('hairStyle') as string,
        eyeColor: formData.get('eyeColor') as string,
        skinTone: formData.get('skinTone') as string,
        uniqueFeatures: formData.get('uniqueFeatures') as string || undefined
      }
    } else if (sessionType === 'family') {
      const familyMembersJson = formData.get('familyMembers') as string
      familyData = JSON.parse(familyMembersJson)
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

    // Handle existing photos for session reuse
    const existingPhotosJson = formData.get('existingPhotos') as string
    const existingPhotos: string[] = existingPhotosJson ? JSON.parse(existingPhotosJson) : []
    const reuseSessionId = formData.get('reuseSessionId') as string
    const reuseChildId = formData.get('reuseChildId') as string

    // Total photo count includes new files + existing photos
    const totalPhotoCount = photoFiles.length + existingPhotos.length

    if (totalPhotoCount < 3) {
      return NextResponse.json({ 
        error: 'At least 3 photos are required' 
      }, { status: 400 })
    }

    // If reusing session with only existing photos (no new uploads), we should reuse the model
    const isExactReuse = (reuseSessionId || reuseChildId) && photoFiles.length === 0 && existingPhotos.length >= 3

    // Handle child profile creation for child sessions
    let childId: string | null = null
    let basePrompt: string
    
    // Check for existing models to reuse (within 30 days)
    let reusingModel = false
    let modelId = null
    let trainingJobId = null
    let uploadedPhotos: string[] = []
    let familyFingerprint = null
    let enhancedPrompt: string

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    if (sessionType === 'child' && childData) {
      const { data: existingChild } = await supabaseAdmin.instance
        .from('children')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', childData.name)
        .single()

      if (existingChild) {
        childId = existingChild.id
      } else {
        const { data: newChild, error: childError } = await supabaseAdmin.instance
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
      
      // Generate prompts for child session
      basePrompt = generateBasePrompt(childData)
    } else if (sessionType === 'family' && familyData) {
      // Generate prompts for family session
      basePrompt = generateFamilyPrompt(familyData)
    } else {
      return NextResponse.json({ error: 'Invalid session type or missing data' }, { status: 400 })
    }

    // Generate enhanced prompt
    enhancedPrompt = enhancePromptWithTheme(basePrompt, themePrompt)

    // If exact reuse, get model from the specific session or child
    if (isExactReuse && reuseSessionId) {
      const { data: reuseSession } = await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('model_id, training_job_id, uploaded_photos, child_id, family_fingerprint')
        .eq('id', reuseSessionId)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('model_id', 'is', null)
        .single()

      if (reuseSession) {
        console.log(`🔄 Exact reuse of session ${reuseSessionId} with model ${reuseSession.model_id}`)
        reusingModel = true
        modelId = reuseSession.model_id
        trainingJobId = reuseSession.training_job_id
        uploadedPhotos = existingPhotos // Use the existing photos from the session
        
        // Set child_id or family_fingerprint from the reused session
        if (reuseSession.child_id) {
          childId = reuseSession.child_id
        } else if (reuseSession.family_fingerprint) {
          familyFingerprint = reuseSession.family_fingerprint
        }
      }
    } else if (isExactReuse && reuseChildId) {
      // Child reuse via ?child= parameter
      const { data: reuseSession } = await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('model_id, training_job_id, uploaded_photos')
        .eq('child_id', reuseChildId)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('model_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (reuseSession) {
        console.log(`🔄 Child reuse for child ${reuseChildId} with model ${reuseSession.model_id}`)
        reusingModel = true
        modelId = reuseSession.model_id
        trainingJobId = reuseSession.training_job_id
        uploadedPhotos = existingPhotos // Use the existing photos from the session
        childId = reuseChildId
      }
    } else if (sessionType === 'child' && childId) {
      // Child session model reuse
      const { data: existingModel } = await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('model_id, training_job_id, uploaded_photos')
        .eq('user_id', user.id)
        .eq('child_id', childId)
        .eq('status', 'completed')
        .not('model_id', 'is', null)
        .gte('updated_at', thirtyDaysAgo)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (existingModel) {
        console.log(`🔄 Reusing existing child model ${existingModel.model_id} for child ${childId}`)
        reusingModel = true
        modelId = existingModel.model_id
        trainingJobId = existingModel.training_job_id
        uploadedPhotos = existingModel.uploaded_photos || []
      }
    } else if (sessionType === 'family' && familyData) {
      // Family session model reuse
      familyFingerprint = generateFamilyFingerprint(familyData)
      console.log(`🔍 Looking for existing family model with fingerprint: ${familyFingerprint}`)

      const { data: existingModel } = await supabaseAdmin.instance
        .from('photoshoot_sessions')
        .select('model_id, training_job_id, uploaded_photos, family_fingerprint')
        .eq('user_id', user.id)
        .eq('family_fingerprint', familyFingerprint)
        .eq('status', 'completed')
        .not('model_id', 'is', null)
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (existingModel) {
        console.log(`🔄 Reusing existing family model ${existingModel.model_id} for fingerprint ${familyFingerprint}`)
        reusingModel = true
        modelId = existingModel.model_id
        trainingJobId = existingModel.training_job_id
        uploadedPhotos = existingModel.uploaded_photos || []
      }
    }

    // Create photoshoot session (let database generate UUID)
    const sessionData: any = {
      user_id: user.id,
      child_id: childId,
      status: reusingModel ? 'ready' : 'pending',
      selected_theme_id: themeId,
      base_prompt: reusingModel ? `[MODEL_REUSED] ${basePrompt}` : basePrompt,
      enhanced_prompt: enhancedPrompt,
      uploaded_photos: uploadedPhotos,
      model_id: modelId,
      training_job_id: trainingJobId
    }

    // Add family fingerprint for family sessions
    if (sessionType === 'family' && familyFingerprint) {
      sessionData.family_fingerprint = familyFingerprint
    }

    const { data: session, error: sessionError } = await supabaseAdmin.instance
      .from('photoshoot_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (sessionError || !session) {
      console.error('Failed to create session:', sessionError)
      return NextResponse.json({ error: 'Failed to create photoshoot session' }, { status: 500 })
    }

    console.log(`✅ Created photoshoot session: ${session.id}`)

    // Deduct credits for the photoshoot
    const { error: creditError } = await supabaseAdmin.instance.rpc('modify_user_credits', {
      user_uuid: user.id,
      credit_amount: -requiredCredits, // Negative amount to deduct credits
      transaction_type: 'usage',
      transaction_description: `Photoshoot created - ${sessionType === 'child' ? 'Child' : 'Family'} session`,
      session_id: session.id
    })

    if (creditError) {
      console.error('Error deducting credits:', creditError)
      // Don't fail the request, but log the error for manual resolution
      console.error(`CRITICAL: Failed to deduct ${requiredCredits} credits for user ${user.id}, session ${session.id}`)
    } else {
      console.log(`✅ Deducted ${requiredCredits} credit(s) from user ${user.id}`)
    }

    // Upload photos and start training (only if not reusing model)
    if (!reusingModel) {
      try {
        const uploadedUrls: string[] = []
        
        // Start with existing photos if reusing session
        if (existingPhotos.length > 0) {
          console.log(`Using ${existingPhotos.length} existing photos from previous session`)
          uploadedUrls.push(...existingPhotos)
        }
        
        // Upload any new photos
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i]
          console.log(`Uploading new file ${i + 1}/${photoFiles.length}: ${file.name} (${file.size} bytes)`)
          
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

        console.log(`Total photos for training: ${uploadedUrls.length} (${existingPhotos.length} existing + ${photoFiles.length} new)`)

        // Update session with all photo URLs (existing + new)
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({ uploaded_photos: uploadedUrls })
          .eq('id', session.id)

        // Start fine-tuning with data URLs
        console.log('Starting Astria fine-tuning with', uploadedUrls.length, 'images')
        
        const trainingJob = await AstriaAPI.createFineTuning(uploadedUrls, basePrompt)
        
        // Update session with training job info
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({
            status: 'training',
            training_job_id: trainingJob.id
          })
          .eq('id', session.id)
      } catch (error: any) {
        console.error('Training setup error:', error)
        
        // Update session status to failed
        await supabaseAdmin.instance
          .from('photoshoot_sessions')
          .update({ status: 'failed' })
          .eq('id', session.id)
        
        return NextResponse.json({ 
          error: 'Failed to start training',
          details: error.message 
        }, { status: 500 })
      }
    } else {
      console.log('✅ Skipping training - reusing existing model')
    }

    // Note: Credit deduction already handled above

    return NextResponse.json({ 
      sessionId: session.id,
      status: reusingModel ? 'ready' : 'training',
      modelReused: reusingModel,
      message: reusingModel 
        ? 'Photoshoot created successfully. Model ready for generation!' 
        : 'Photoshoot created successfully. Training AI model...' 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
