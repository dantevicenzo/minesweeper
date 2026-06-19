import { Suspense } from 'react'
import AuthForm from './AuthForm'

export default function AuthPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AuthForm />
    </Suspense>
  )
}
