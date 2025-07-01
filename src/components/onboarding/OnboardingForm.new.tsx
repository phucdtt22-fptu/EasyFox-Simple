'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OnboardingFormData } from '@/types'

interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => void
  onSkip: () => void
}

export function OnboardingForm({ onSubmit, onSkip }: OnboardingFormProps) {
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
  })

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.businessType)
      case 2:
        return !!(formData.mainProducts && formData.targetCustomers)
      case 3:
        return !!formData.businessGoals
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-200 max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🦊</span>
            <h2 className="text-xl font-bold text-gray-800">Thiết lập hồ sơ doanh nghiệp</h2>
          </div>
          <Button 
            variant="ghost" 
            onClick={onSkip}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            Bỏ qua
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-orange-100 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <p className="text-sm text-orange-600 font-medium">
          Bước {currentStep} / {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Step 1: Basic Business Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin cơ bản về doanh nghiệp
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Ví dụ: Nail Studio Hoa Mai"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                placeholder="Ví dụ: Tiệm nail, Spa, Nhà hàng, Café, Cửa hàng..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Đã bỏ trường Ngành nghề */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả doanh nghiệp
              </label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                placeholder="Mô tả ngắn gọn về doanh nghiệp của bạn..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vị trí
                </label>
                <input
                  type="text"
                  value={formData.businessLocation}
                  onChange={(e) => handleInputChange('businessLocation', e.target.value)}
                  placeholder="Ví dụ: Quận 1, TP.HCM"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quy mô
                </label>
                <input
                  type="text"
                  value={formData.businessSize}
                  onChange={(e) => handleInputChange('businessSize', e.target.value)}
                  placeholder="Ví dụ: 2-5 nhân viên"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian hoạt động
                </label>
                <input
                  type="text"
                  value={formData.yearsInBusiness}
                  onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
                  placeholder="Ví dụ: 3 năm"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Products & Customers */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sản phẩm & Khách hàng
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sản phẩm/Dịch vụ chính <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.mainProducts}
                onChange={(e) => handleInputChange('mainProducts', e.target.value)}
                placeholder="Mô tả các sản phẩm hoặc dịch vụ chính mà doanh nghiệp của bạn cung cấp..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đối tượng khách hàng mục tiêu <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.targetCustomers}
                onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                placeholder="Mô tả khách hàng mục tiêu của bạn: độ tuổi, giới tính, sở thích, nhu cầu..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Mục tiêu kinh doanh
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mục tiêu kinh doanh của bạn <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessGoals}
                onChange={(e) => handleInputChange('businessGoals', e.target.value)}
                placeholder="Bạn muốn đạt được điều gì với doanh nghiệp này? Tăng khách hàng, tăng doanh thu, mở rộng..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
              type="button" 
              onClick={handleSubmit}
              disabled={!validateStep(currentStep)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Hoàn thành
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
