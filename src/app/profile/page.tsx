'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, User, Mail, Calendar, AlertTriangle } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: ''
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
      setFormData({
        name: data.name || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      // NOTES: Removed ability to edit notes - only AI can update via onboarding
      // Update name directly via Supabase
      const { error: nameError } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
        })
        .eq('id', user.id);

      if (nameError) {
        console.error('Error updating name:', nameError);
        alert('Có lỗi xảy ra khi cập nhật tên!');
        return;
      }

      // Update local state (notes unchanged)
      setProfile({
        ...profile,
        name: formData.name.trim()
      });

      alert('Cập nhật thành công! Tên hiển thị đã được lưu.');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      // Call Next.js API route to delete user account
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete account';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Account deletion result:', result);

      // If successful, sign out and redirect
      await signOut();
      router.push('/login?message=account_deleted');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Có lỗi xảy ra khi xóa tài khoản!');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Đang tải thông tin..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không thể tải thông tin người dùng</p>
          <Button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-600">
            Quay về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/')}
                className="border-orange-200 hover:bg-orange-50"
              >
                <ArrowLeft size={16} className="mr-2" />
                Quay về
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.name || 'Chưa có tên'}</h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  <Calendar size={16} />
                  <span>Tham gia từ {new Date(profile.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nhập tên của bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thông tin doanh nghiệp (Chỉ xem)
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  Thông tin này được thu thập qua quá trình onboarding với AI và không thể chỉnh sửa trực tiếp
                </div>
                {profile.notes ? (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    {profile.notes}
                  </div>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
                    Chưa có thông tin doanh nghiệp. Hãy chat với AI để hoàn thành quá trình onboarding.
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  💡 Để cập nhật thông tin này, hãy chat với AI assistant và yêu cầu cập nhật thông tin doanh nghiệp
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="text-lg font-semibold text-red-700">Vùng nguy hiểm</h3>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">
                <strong>Cảnh báo:</strong> Việc xóa tài khoản sẽ không thể hoàn tác. 
                Tất cả dữ liệu của bạn bao gồm lịch sử chat và thông tin cá nhân sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 size={16} className="mr-2" />
              Xóa tài khoản
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Xác nhận xóa tài khoản"
        description="Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn."
        confirmText={deleting ? "Đang xóa..." : "Xóa tài khoản"}
        cancelText="Hủy"
        variant="destructive"
        disabled={deleting}
      />
    </div>
  );
}
