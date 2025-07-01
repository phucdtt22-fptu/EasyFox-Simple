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
  const totalSteps = 4

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.businessType)
      case 2:
        return !!(formData.businessDescription && formData.businessLocation)
      case 3:
        return !!(formData.businessSize && formData.yearsInBusiness && formData.mainProducts)
      case 4:
        return !!(formData.targetCustomers && formData.businessGoals)
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
        <h2 className="text-2xl font-bold text-center mb-2">
          Thiết lập thông tin doanh nghiệp
        </h2>
        <div className="flex justify-center items-center space-x-2">
          {[1, 2, 3, 4].map((step) => (
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

      {/* Content */}
      <div className="p-6">
        {/* Step 1: Basic Business Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              Thông tin cơ bản doanh nghiệp
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
              />
            </div>
          </div>
        )}

        {/* Step 2: Description & Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              Mô tả và địa điểm
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                placeholder="Mô tả ngắn gọn về doanh nghiệp của bạn..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
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
              />
            </div>
          </div>
        )}

        {/* Step 3: Scale & Products */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              Quy mô và sản phẩm
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quy mô doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.businessSize}
                onChange={(e) => handleInputChange('businessSize', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
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
                Số năm hoạt động <span className="text-red-500">*</span>
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
              />
            </div>
          </div>
        )}

        {/* Step 4: Customers & Goals */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              Khách hàng và mục tiêu
            </h3>

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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mục tiêu kinh doanh <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessGoals}
                onChange={(e) => handleInputChange('businessGoals', e.target.value)}
                placeholder="Ví dụ: Tăng doanh thu, mở rộng cửa hàng, xây dựng thương hiệu..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-gray-900"
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

      {/* Skip option */}
      <div className="px-6 pb-4 text-center">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Bỏ qua và sử dụng sau
        </button>
      </div>
    </div>
  )
}
