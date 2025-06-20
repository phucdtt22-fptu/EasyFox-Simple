"use client";

import { motion } from "framer-motion";
import { EasyFoxIcon } from "./icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 flex flex-col gap-4 text-gray-600 text-sm">
        <p className="flex flex-row justify-center gap-2 items-center text-gray-900">
          <EasyFoxIcon />
          <span className="text-gray-400">AI Marketing</span>
        </p>
        <p className="text-center">
          Chào mừng bạn đến với <strong className="text-orange-600">EasyFox</strong> - 
          Trợ lý AI Marketing chuyên nghiệp dành cho doanh nghiệp vừa và nhỏ tại Việt Nam.
        </p>
        <p className="text-center">
          Tôi sẽ giúp bạn tạo ra các chiến dịch marketing hiệu quả, 
          nội dung thu hút và lên kế hoạch truyền thông đa kênh một cách thông minh.
        </p>
        <div className="mt-4 p-4 bg-white rounded-lg border border-orange-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Bắt đầu bằng cách:</p>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• Chia sẻ thông tin về doanh nghiệp của bạn</li>
            <li>• Mô tả sản phẩm/dịch vụ chính</li>
            <li>• Nêu mục tiêu marketing cụ thể</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
