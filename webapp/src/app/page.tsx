'use client';

import { useAuth } from '@/context/AuthContext';
import { ModernChatLayout } from '@/components/ui/modern-chat-layout';
import LoginForm from '@/components/LoginForm';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <LoadingSpinner size="lg" text="Đang tải..." />
      </div>
    );
  }

  return user ? <ModernChatLayout /> : <LoginForm />;
}
