'use client'

import { OnboardingFormData } from '@/types'

interface OnboardingDataTableProps {
  data: OnboardingFormData
  onConfirm: () => void
  onEdit: () => void
}

export function OnboardingDataTable({ data, onConfirm, onEdit }: OnboardingDataTableProps) {
  // Generate markdown table from onboarding data
  const generateMarkdownTable = (data: OnboardingFormData): string => {
    return `
## 🦊 Hồ sơ Doanh nghiệp - ${data.businessName}

| **Thông tin** | **Chi tiết** |
|---------------|--------------|
| **Tên doanh nghiệp** | ${data.businessName} |
| **Loại hình** | ${data.businessType} |
| **Mô tả doanh nghiệp** | ${data.businessDescription} |
| **Vị trí** | ${data.businessLocation || 'Chưa cập nhật'} |
| **Quy mô** | ${data.businessSize || 'Chưa cập nhật'} |
| **Năm hoạt động** | ${data.yearsInBusiness || 'Chưa cập nhật'} |
| **Sản phẩm/Dịch vụ chính** | ${data.mainProducts} |
| **Khách hàng mục tiêu** | ${data.targetCustomers} |
| **Mục tiêu kinh doanh** | ${data.businessGoals} |

---

**📊 Tóm tắt:**
- **Doanh nghiệp:** ${data.businessName} (${data.businessType})
- **Quy mô:** ${data.businessSize || 'Chưa xác định'}
- **Hoạt động:** ${data.yearsInBusiness || 'Chưa xác định'} năm
    `.trim()
  }

  const markdownContent = generateMarkdownTable(data)

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
          ✅ Xác nhận thông tin doanh nghiệp
        </h2>
        <p className="text-sm text-green-600 dark:text-green-300">
          Vui lòng kiểm tra lại thông tin trước khi xác nhận
        </p>
      </div>

      {/* Markdown Preview */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap font-mono text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border">
            {markdownContent}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            🏢 Thông tin cơ bản
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li><strong>Tên:</strong> {data.businessName}</li>
            <li><strong>Loại hình:</strong> {data.businessType}</li>
            {data.businessLocation && <li><strong>Vị trí:</strong> {data.businessLocation}</li>}
            {data.businessSize && <li><strong>Quy mô:</strong> {data.businessSize}</li>}
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            🎯 Hoạt động kinh doanh
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li><strong>Năm hoạt động:</strong> {data.yearsInBusiness || 'Chưa xác định'}</li>
            <li><strong>Sản phẩm chính:</strong> {data.mainProducts}</li>
            <li><strong>Khách hàng:</strong> {data.targetCustomers}</li>
            <li><strong>Mục tiêu:</strong> {data.businessGoals}</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
        >
          ✏️ Chỉnh sửa
        </button>
        
        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors"
        >
          ✅ Xác nhận & Tiếp tục
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Lưu ý:</strong> Sau khi xác nhận, AI sẽ phân tích thông tin này và tạo mô tả chi tiết về doanh nghiệp của bạn để hỗ trợ tốt hơn trong các cuộc trò chuyện tiếp theo.
        </p>
      </div>
    </div>
  )
}
