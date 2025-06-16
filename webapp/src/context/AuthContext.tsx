'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signUp: (email: string, password: string, name: string) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signIn: (email: string, password: string) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signInWithMagicLink: (email: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        // Cấu hình redirect URL cho email confirmation
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}${process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL || '/'}`,
      },
    })

    if (!error && data.user) {
      // Create user record in our custom users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email!,
            name,
            notes: null,
          },
        ])

      if (userError) {
        console.error('Error creating user record:', userError)
      }
    }

    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  // Thêm phương thức đăng nhập bằng magic link
  const signInWithMagicLink = async (email: string) => {
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        // Cấu hình redirect URL cho magic link
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}${process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL || '/'}`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
