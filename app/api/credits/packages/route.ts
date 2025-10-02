import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin.instance) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get all active credit packages
    const { data: packages, error } = await supabaseAdmin.instance
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true })

    if (error) {
      console.error('Error fetching credit packages:', error)
      return NextResponse.json({ error: 'Failed to fetch credit packages' }, { status: 500 })
    }

    // Format packages for frontend
    const formattedPackages = packages?.map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price_cents / 100, // Convert cents to dollars
      priceCents: pkg.price_cents,
      description: pkg.description,
      pricePerCredit: (pkg.price_cents / pkg.credits / 100).toFixed(2), // Price per credit in dollars
      savings: pkg.credits >= 50 ? Math.round(((1000 - (pkg.price_cents / pkg.credits)) / 1000) * 100) : 0 // Savings percentage compared to $0.10 per credit
    })) || []

    return NextResponse.json({ packages: formattedPackages })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
