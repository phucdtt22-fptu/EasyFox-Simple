"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, Calendar, TrendingUp } from "lucide-react";

interface ModernOverviewProps {
  suggestedActions: string[];
  onSuggestedAction: (action: string) => void;
}

export function ModernOverview({ suggestedActions, onSuggestedAction }: ModernOverviewProps) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="max-w-2xl mx-auto mt-12 mb-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles size={16} />
          EasyFox AI Marketing
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Chào mừng đến với <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">EasyFox</span>
        </h1>
        
        <p className="text-gray-600 text-lg leading-relaxed">
          Trợ lý AI chuyên nghiệp giúp bạn xây dựng chiến lược marketing hiệu quả 
          cho doanh nghiệp nhỏ và vừa. Từ tạo nội dung đến lập lịch đăng bài tự động.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Chiến lược Marketing</h3>
          <p className="text-gray-600 text-sm">Phân tích thị trường và xây dựng chiến lược phù hợp với ngành nghề của bạn</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Lập lịch tự động</h3>
          <p className="text-gray-600 text-sm">Đăng bài lên multiple platforms cùng lúc với lịch trình tối ưu</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Nội dung AI</h3>
          <p className="text-gray-600 text-sm">Tạo posts, captions và hashtags hấp dẫn phù hợp với target audience</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Phân tích đối thủ</h3>
          <p className="text-gray-600 text-sm">Theo dõi và học hỏi từ những gì competitors đang làm tốt</p>
        </div>
      </div>

      {/* Suggested Actions */}
      {suggestedActions && suggestedActions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
            Bắt đầu với những gợi ý sau:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => onSuggestedAction(action)}
                className="group bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-orange-300 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {action.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {action}
                    </h4>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          💡 <strong>Tip:</strong> Hãy chia sẻ thông tin về doanh nghiệp để tôi có thể tư vấn chính xác hơn
        </p>
      </div>
    </motion.div>
  );
}
