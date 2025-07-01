'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from './LoadingSpinner'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...')
        console.log('Current URL:', window.location.href)
        console.log('Search params:', searchParams.toString())
        
        // Lấy các parameters từ URL
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        console.log('Token hash:', token_hash)
        console.log('Type:', type)
        
        // Nếu có token_hash trong URL, đây là email confirmation callback
        if (token_hash && type) {
          console.log('Processing email confirmation with token...')
          
          // Xác minh session với token từ URL
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'email'
          })
          
          if (error) {
            console.error('Email confirmation error:', error)
            setError(`Xác thực email thất bại: ${error.message}`)
            setLoading(false)
            setTimeout(() => {
              router.replace(process.env.NEXT_PUBLIC_AUTH_ERROR_URL || '/login?error=auth_failed')
            }, 3000)
            return
          }

          if (data.session) {
            console.log('Email confirmation successful:', data.session.user.email)
            console.log('User confirmed at:', data.session.user.email_confirmed_at)
            
            // Hiển thị thông báo thành công
            setLoading(false)
            
            // Chờ 3 giây để user đọc thông báo thành công trước khi redirect
            setTimeout(() => {
              router.replace('/') // Redirect về trang chính
            }, 3000)
            return
          }
        }
        
        // Fallback: Kiểm tra session hiện tại
        const { data: currentSession } = await supabase.auth.getSession()
        
        if (currentSession.session) {
          console.log('Found existing session:', currentSession.session.user.email)
          setLoading(false)
          setTimeout(() => {
            router.replace('/')
          }, 2000)
        } else {
          console.log('No session found, redirecting to login')
          setError('Không tìm thấy phiên đăng nhập. Vui lòng thử lại.')
          setLoading(false)
          setTimeout(() => {
            router.replace('/login')
          }, 3000)
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err)
        setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.')
        setLoading(false)
        setTimeout(() => {
          router.replace(process.env.NEXT_PUBLIC_AUTH_ERROR_URL || '/login?error=auth_failed')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-16 w-auto flex items-center justify-center mb-6">
            <span className="text-4xl font-bold">
              <span className="text-orange-500">Easy</span>
              <span className="text-red-600">Fox</span>
            </span>
          </div>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Đang xác thực email...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-16 w-auto flex items-center justify-center mb-6">
            <span className="text-4xl font-bold">
              <span className="text-orange-500">Easy</span>
              <span className="text-red-600">Fox</span>
            </span>
          </div>
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thất bại</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    )
  }

  // Hiển thị thông báo thành công
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mx-auto h-16 w-auto flex items-center justify-center mb-6">
          <span className="text-4xl font-bold">
            <span className="text-orange-500">Easy</span>
            <span className="text-red-600">Fox</span>
          </span>
        </div>
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Xác thực email thành công!</h2>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200 mb-6">
          <p className="text-gray-700 mb-2">
            🎉 Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công.
          </p>
          <p className="text-gray-600 text-sm">
            Bạn sẽ được chuyển hướng về trang chính trong 3 giây...
          </p>
        </div>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-gray-500 text-sm">Đang chuyển hướng...</span>
        </div>
      </div>
    </div>
  )

  return null
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
