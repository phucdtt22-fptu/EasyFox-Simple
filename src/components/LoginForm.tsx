'use client'

import { Suspense } from 'react'
import LoginFormContent from './LoginFormContent'
import LoadingSpinner from './LoadingSpinner'

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <LoadingSpinner size="lg" text="Đang tải..." />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
