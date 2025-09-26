import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureUserExists } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Ensure user exists in database (sync if needed)
    await ensureUserExists(user)

    const { data: children, error } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
    }

    return NextResponse.json(children)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers')
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Ensure user exists in database (sync if needed)
    await ensureUserExists(user)

    const body = await request.json()
    const {
      name,
      ageInMonths,
      gender,
      hairColor,
      hairStyle,
      eyeColor,
      skinTone,
      uniqueFeatures
    } = body

    // Validate required fields
    if (!name || !ageInMonths || !gender || !hairColor || !eyeColor || !skinTone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { data: child, error } = await supabaseAdmin
      .from('children')
      .insert({
        user_id: user.id,
        name,
        age_in_months: parseInt(ageInMonths),
        gender,
        hair_color: hairColor,
        hair_style: hairStyle || 'straight',
        eye_color: eyeColor,
        skin_tone: skinTone,
        unique_features: uniqueFeatures || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create child profile' }, { status: 500 })
    }

    return NextResponse.json(child)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
