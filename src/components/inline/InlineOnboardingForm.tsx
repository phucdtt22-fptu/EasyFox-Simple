"use client";

import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function InlineOnboardingForm() {
  const { sendMessage } = useChat();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    targetAudience: '',
    location: '',
    phone: '',
    challenges: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ẩn form ngay lập tức khi user bấm submit
    setIsSubmitted(true);
    
    // Gửi thông tin onboarding qua chat như user input
    const onboardingInfo = `Thông tin doanh nghiệp của tôi:
- Tên: ${formData.businessName}
- Loại hình: ${formData.businessType}
- Khách hàng mục tiêu: ${formData.targetAudience}
- Địa điểm: ${formData.location}
- Số điện thoại: ${formData.phone}
- Thách thức: ${formData.challenges}`;

    // Gửi message (không await để không block UI)
    sendMessage(onboardingInfo);
  };

  // Nếu đã submit thì ẩn form
  if (isSubmitted) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-4 w-full max-w-md border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-orange-600 mb-4">Thông tin doanh nghiệp</h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Tên doanh nghiệp</label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            placeholder="Ví dụ: Nail Salon ABC"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Loại hình kinh doanh</label>
          <select
            value={formData.businessType}
            onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            required
          >
            <option value="" className="text-gray-500">Chọn loại hình</option>
            <option value="Nail Salon" className="text-gray-800">Nail Salon</option>
            <option value="Spa" className="text-gray-800">Spa</option>
            <option value="Nhà hàng" className="text-gray-800">Nhà hàng</option>
            <option value="Quán cà phê" className="text-gray-800">Quán cà phê</option>
            <option value="Khác" className="text-gray-800">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Khách hàng mục tiêu</label>
          <input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            placeholder="Ví dụ: Phụ nữ 25-45 tuổi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Địa điểm</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            placeholder="Thành phố, bang"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Số điện thoại</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            placeholder="(xxx) xxx-xxxx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Thách thức chính</label>
          <textarea
            value={formData.challenges}
            onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            placeholder="Mô tả ngắn gọn các thách thức marketing hiện tại"
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          Gửi thông tin
        </Button>
      </form>
    </div>
  );
}
