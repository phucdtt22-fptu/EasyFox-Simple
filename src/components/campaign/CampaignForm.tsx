import React, { useState } from "react";
import { Button } from "../ui/button";

export interface CampaignFormData {
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  budget: string;
  notes?: string;
}

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<CampaignFormData>;
}

export function CampaignForm({ onSubmit, onCancel, initialData }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: initialData?.name || "",
    objective: initialData?.objective || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    budget: initialData?.budget || "",
    notes: initialData?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSubmit(formData);
    setLoading(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tên chiến dịch *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Mục tiêu *</label>
        <input
          type="text"
          name="objective"
          value={formData.objective}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Ngày kết thúc *</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Ngân sách dự kiến *</label>
        <input
          type="text"
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Huỷ
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Đang lưu..." : "Tạo chiến dịch"}
        </Button>
      </div>
    </form>
  );
}
