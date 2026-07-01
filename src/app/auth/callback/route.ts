import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('[CALLBACK] Full URL received:', request.url)
  console.log('[CALLBACK] All search params:', Object.fromEntries(new URL(request.url).searchParams))

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/feed'

  const supabase = await createClient()

  // On PKCE-flow projects, `token_hash` can arrive as a `pkce_`-prefixed value —
  // that's an authorization code, not a real OTP hash, so it must go through
  // exchangeCodeForSession(), not verifyOtp() (which always rejects it).
  const exchangeCode = code ?? (token_hash?.startsWith('pkce_') ? token_hash : null)

  if (exchangeCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(exchangeCode)

    if (!error) {
      return NextResponse.redirect(`${origin}${type === 'recovery' ? '/update-password' : next}`)
    }

    console.log('[CALLBACK] exchangeCodeForSession error:', error)
    return NextResponse.redirect(`${origin}/login?error=link_invalid`)
  }

  // Genuine (non-PKCE) OTP token_hash flow, kept for other email templates.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (!error) {
      return NextResponse.redirect(`${origin}${type === 'recovery' ? '/update-password' : next}`)
    }

    console.log('[CALLBACK] verifyOtp error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalid`)
}
