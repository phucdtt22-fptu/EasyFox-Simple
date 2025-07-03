"use client";

import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function InlineCampaignForm() {
  const { sendMessage } = useChat();
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    budget: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ẩn form ngay lập tức khi user bấm submit
    setIsSubmitted(true);
    
    // Gửi thông tin campaign qua chat như user input
    const campaignInfo = `Tôi muốn tạo chiến dịch:
- Tên: ${formData.name}
- Mục tiêu: ${formData.objective}
- Ngân sách: ${formData.budget}
- Ngày bắt đầu: ${formData.startDate}
- Ngày kết thúc: ${formData.endDate}
- Ghi chú: ${formData.notes}`;

    // Gửi message (không await để không block UI)
    sendMessage(campaignInfo);
  };

  // Nếu đã submit thì ẩn form
  if (isSubmitted) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-4 w-full max-w-md border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-orange-600 mb-4">Tạo Chiến Dịch Marketing</h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Tên chiến dịch</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            placeholder="Ví dụ: Khuyến mãi mùa hè"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Mục tiêu</label>
          <select
            value={formData.objective}
            onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            required
          >
            <option value="" className="text-gray-500">Chọn mục tiêu</option>
            <option value="Tăng doanh thu" className="text-gray-800">Tăng doanh thu</option>
            <option value="Tăng nhận diện thương hiệu" className="text-gray-800">Tăng nhận diện thương hiệu</option>
            <option value="Thu hút khách hàng mới" className="text-gray-800">Thu hút khách hàng mới</option>
            <option value="Giữ chân khách hàng cũ" className="text-gray-800">Giữ chân khách hàng cũ</option>
            <option value="Tăng engagement trên mạng xã hội" className="text-gray-800">Tăng engagement trên mạng xã hội</option>
            <option value="Tăng lượt truy cập website" className="text-gray-800">Tăng lượt truy cập website</option>
            <option value="Giới thiệu sản phẩm/dịch vụ mới" className="text-gray-800">Giới thiệu sản phẩm/dịch vụ mới</option>
            <option value="Tăng độ nhận diện thương hiệu" className="text-gray-800">Tăng độ nhận diện thương hiệu</option>
            <option value="Tăng số lượng lead" className="text-gray-800">Tăng số lượng lead</option>
            <option value="Tăng tỷ lệ chuyển đổi" className="text-gray-800">Tăng tỷ lệ chuyển đổi</option>
            <option value="Xây dựng cộng đồng khách hàng" className="text-gray-800">Xây dựng cộng đồng khách hàng</option>
            <option value="Tăng độ tin cậy thương hiệu" className="text-gray-800">Tăng độ tin cậy thương hiệu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Ngân sách (VNĐ)</label>
          <input
            type="text"
            value={formData.budget}
            onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            placeholder="Ví dụ: 5.000.000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Ngày bắt đầu</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Ngày kết thúc</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            min={formData.startDate}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Ghi chú thêm</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-gray-800 bg-white"
            rows={2}
            placeholder="Thông tin bổ sung..."
          />
        </div>

        <Button 
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!formData.name || !formData.objective || !formData.startDate || !formData.endDate}
        >
          Tạo Chiến Dịch
        </Button>
      </form>
    </div>
  );
}
