'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.push(error ? '/auth?error=oauth' : '/')
      })
    } else {
      router.push('/auth?error=oauth')
    }
  }, [router, searchParams])

  return <p>Completing authentication...</p>
}
