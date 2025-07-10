"use client";

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Target,
  DollarSign,
  Users,
  CheckCircle,
  Calendar,
  Flag
} from 'lucide-react'

interface FormData {
  name: string
  budget: string
  target_audience: string
  goals: string
  custom_goal: string
  start_date: string
  end_date: string
  notes: string
}

interface InlineCampaignFormProps {
  onComplete?: (success: boolean) => void;
  onSendMessage?: (message: string) => Promise<{ success: boolean; error?: string }>;
}

export function InlineCampaignForm({ onComplete, onSendMessage }: InlineCampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentSection, setCurrentSection] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    budget: '',
    target_audience: '',
    goals: '',
    custom_goal: '',
    start_date: '',
    end_date: '',
    notes: ''
  })

  const goalOptions = [
    'Tăng nhận diện thương hiệu',
    'Tăng doanh số bán hàng',
    'Thu hút khách hàng mới',
    'Giữ chân khách hàng cũ',
    'Tăng lượng truy cập website',
    'Tăng tương tác trên social media',
    'Quảng bá sản phẩm mới',
    'Khác'
  ]

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Gửi thông tin campaign qua chat như user input
      const campaignInfo = `Tôi đã điền xong form và đây là các thông tin về chiến dịch:
- Tên chiến dịch: ${formData.name}
- Ngân sách: ${formData.budget} VNĐ
- Đối tượng mục tiêu: ${formData.target_audience}
- Mục tiêu chiến dịch: ${formData.goals === 'Khác' ? formData.custom_goal : formData.goals}
- Ngày bắt đầu: ${formData.start_date}
- Ngày kết thúc: ${formData.end_date}
- Ghi chú thêm: ${formData.notes}

Hãy giúp tôi phân tích và đề xuất chiến lược marketing chi tiết cho chiến dịch này. Vui lòng trả lời bằng tiếng Việt.`

      // Sử dụng onSendMessage để gửi qua chat interface
      if (onSendMessage) {
        const result = await onSendMessage(campaignInfo)
        
        if (result.success) {
          console.log('✅ Campaign data submitted successfully')
          setIsSubmitted(true) // Ẩn form
          
          // Tự động ẩn form sau 2 giây
          setTimeout(() => {
            onComplete?.(true)
          }, 2000)
        } else {
          throw new Error(result.error || 'Failed to process campaign data')
        }
      } else {
        console.warn('⚠️ No onSendMessage prop provided to InlineCampaignForm')
        onComplete?.(false)
      }
    } catch (error) {
      console.error('Error submitting campaign:', error)
      onComplete?.(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    if (currentSection === 1) {
      return formData.name.trim() && formData.budget.trim() && formData.target_audience.trim()
    }
    // Section 2: mục tiêu, ngày, ghi chú
    const hasGoal = formData.goals.trim() && (formData.goals !== 'Khác' || formData.custom_goal.trim())
    return formData.name.trim() && formData.budget.trim() && formData.target_audience.trim() &&
           hasGoal && formData.start_date.trim() && formData.end_date.trim()
  }

  const handleNext = () => {
    if (currentSection === 1 && isFormValid()) {
      setCurrentSection(2)
    }
  }

  const handleBack = () => {
    if (currentSection === 2) {
      setCurrentSection(1)
    }
  }

  return (
    <div className="max-w-md">
      {isSubmitted ? (
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Đã gửi thành công!</h3>
            <p className="text-sm text-gray-600">
              Thông tin chiến dịch đã được gửi. AI đang phân tích và sẽ đưa ra đề xuất chi tiết cho bạn.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            {currentSection === 1 ? (
              <>
                <Target className="h-5 w-5" />
                Thông tin cơ bản
              </>
            ) : (
              <>
                <Flag className="h-5 w-5" />
                Chi tiết chiến dịch
              </>
            )}
          </CardTitle>
          <p className="text-orange-100 text-sm">
            {currentSection === 1 
              ? "Hãy cho chúng tôi biết về chiến dịch của bạn"
              : "Mục tiêu và thời gian thực hiện"
            }</p>
        </CardHeader>
        <CardContent className="p-4">
          {currentSection === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Tên chiến dịch
                </label>
                <Input
                  placeholder="VD: Chiến dịch thu hút khách hàng mới"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  Ngân sách (VNĐ)
                </label>
                <Input
                  placeholder="VD: 5,000,000"
                  value={formData.budget}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('budget', e.target.value)}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  Đối tượng mục tiêu
                </label>
                <Textarea
                  placeholder="VD: Phụ nữ 25-35 tuổi quan tâm đến làm đẹp"
                  value={formData.target_audience}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('target_audience', e.target.value)}
                  rows={2}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Mục tiêu chiến dịch
                </label>
                <select 
                  value={formData.goals} 
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="" disabled>Chọn mục tiêu chính của chiến dịch</option>
                  {goalOptions.map((goal) => (
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
                
                {formData.goals === 'Khác' && (
                  <Input
                    placeholder="Nhập mục tiêu khác..."
                    value={formData.custom_goal}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('custom_goal', e.target.value)}
                    className="mt-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Ngày bắt đầu
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('start_date', e.target.value)}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Ngày kết thúc
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('end_date', e.target.value)}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Ghi chú thêm (tùy chọn)
                </label>
                <Textarea
                  placeholder="Thêm bất kỳ thông tin nào khác mà bạn muốn chúng tôi biết"
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              {currentSection === 2 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50"
                >
                  Quay lại
                </Button>
              )}
              
              {currentSection === 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isFormValid()}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  Tiếp tục
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      Tạo chiến dịch
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
