"use client";

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { OnboardingFormData } from '@/types';

interface InlineOnboardingFormProps {
  onComplete?: (success: boolean) => void;
  onSendMessage?: (message: string) => Promise<{ success: boolean; error?: string }>;
}

export function InlineOnboardingForm({ onComplete, onSendMessage }: InlineOnboardingFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<OnboardingFormData>({
    businessName: '',
    businessType: '',
    businessDescription: '',
    businessLocation: '',
    businessSize: '',
    yearsInBusiness: '',
    mainProducts: '',
    targetCustomers: '',
    businessGoals: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.businessType && formData.businessLocation);
      case 2:
        return !!(formData.businessSize && formData.mainProducts && formData.targetCustomers);
      case 3:
        return !!(formData.businessGoals);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    // Ẩn form ngay lập tức khi user bấm submit
    setIsSubmitted(true);
    
    try {
      // Tạo business description từ form data
      const businessDescription = `Tên doanh nghiệp: ${formData.businessName}. Loại hình: ${formData.businessType}. Mô tả: ${formData.businessDescription}. Địa điểm: ${formData.businessLocation}. Quy mô: ${formData.businessSize}. Số năm hoạt động: ${formData.yearsInBusiness}. Sản phẩm/dịch vụ chính: ${formData.mainProducts}. Khách hàng mục tiêu: ${formData.targetCustomers}. Mục tiêu kinh doanh: ${formData.businessGoals}.`;

      // Sử dụng onSendMessage để gửi qua chat interface thay vì gọi API trực tiếp
      if (onSendMessage) {
        const result = await onSendMessage(`Tôi đã điền xong form và đây là các thông tin về doanh nghiệp: ${businessDescription}`);
        
        if (result.success) {
          console.log('✅ Onboarding data submitted successfully');
          
          // Tự động ẩn form sau 2 giây
          setTimeout(() => {
            onComplete?.(true);
          }, 2000);
        } else {
          throw new Error(result.error || 'Failed to process onboarding data');
        }
      } else {
        // Fallback: gọi API trực tiếp như trước (deprecated)
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: `Tôi đã điền xong form và đây là các thông tin về doanh nghiệp: ${businessDescription}`,
            user_id: user?.id,
            user_info: {
              id: user?.id,
              email: user?.email,
              name: user?.user_metadata?.name || user?.email || 'User'
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit onboarding data');
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Onboarding data submitted successfully');
          onComplete?.(true);
        } else {
          throw new Error(data.error || 'Failed to process onboarding data');
        }
      }
      
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      onComplete?.(false);
    }
  };

  // Nếu đã submit thì ẩn form
  if (isSubmitted) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-6 w-full max-w-2xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-lg -m-6 mb-6">
        <h3 className="text-lg font-bold text-center mb-2">
          Thiết lập thông tin doanh nghiệp
        </h3>
        <div className="flex justify-center items-center space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                step <= currentStep
                  ? 'bg-white text-orange-500 border-white'
                  : 'bg-transparent text-white border-white/50'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <p className="text-center text-orange-100 mt-2 text-sm">
          Bước {currentStep} / {totalSteps}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 text-center">
              Thông tin cơ bản
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Ví dụ: Nail Studio Hoa Mai"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại hình kinh doanh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                placeholder="Ví dụ: Tiệm nail, Spa, Nhà hàng, Café..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa điểm kinh doanh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessLocation}
                onChange={(e) => handleInputChange('businessLocation', e.target.value)}
                placeholder="Ví dụ: Quận 1, TP.HCM"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả ngắn về doanh nghiệp
              </label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                placeholder="Mô tả ngắn gọn về doanh nghiệp của bạn..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
              />
            </div>
          </div>
        )}

        {/* Step 2: Business Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 text-center">
              Chi tiết doanh nghiệp
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quy mô doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.businessSize}
                onChange={(e) => handleInputChange('businessSize', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
                required
              >
                <option value="">Chọn quy mô</option>
                <option value="1 nhân viên">1 nhân viên</option>
                <option value="2-5 nhân viên">2-5 nhân viên</option>
                <option value="6-10 nhân viên">6-10 nhân viên</option>
                <option value="11-20 nhân viên">11-20 nhân viên</option>
                <option value="Trên 20 nhân viên">Trên 20 nhân viên</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số năm hoạt động
              </label>
              <select
                value={formData.yearsInBusiness}
                onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
              >
                <option value="">Chọn số năm</option>
                <option value="Dưới 1 năm">Dưới 1 năm</option>
                <option value="1 năm">1 năm</option>
                <option value="2 năm">2 năm</option>
                <option value="3 năm">3 năm</option>
                <option value="4-5 năm">4-5 năm</option>
                <option value="Trên 5 năm">Trên 5 năm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sản phẩm/dịch vụ chính <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.mainProducts}
                onChange={(e) => handleInputChange('mainProducts', e.target.value)}
                placeholder="Ví dụ: Nail, gel, mi, tóc, bánh mì, cà phê..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khách hàng mục tiêu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.targetCustomers}
                onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                placeholder="Ví dụ: Phụ nữ 18-35 tuổi, Gen Z, dân văn phòng..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 text-center">
              Mục tiêu và ghi chú
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mục tiêu kinh doanh <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessGoals}
                onChange={(e) => handleInputChange('businessGoals', e.target.value)}
                placeholder="Ví dụ: Tăng doanh thu, mở rộng cửa hàng, xây dựng thương hiệu..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
                required
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            ← Quay lại
          </Button>
          
          {currentStep < totalSteps ? (
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Tiếp tục →
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!validateStep(currentStep)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Hoàn thành
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
