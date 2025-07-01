// Utility functions for EasyFox AI Marketing Agent

function getCategoriesForPillar(pillar, businessType) {
  const categories = {
    'Giới thiệu dịch vụ': ['Quy trình làm việc', 'Trang thiết bị', 'Đội ngũ nhân viên', 'Không gian cửa hàng'],
    'Khuyến mãi & Ưu đãi': ['Giảm giá dịch vụ', 'Combo tiết kiệm', 'Quà tặng kèm', 'Chương trình thành viên'],
    'Testimonial & Review': ['Feedback khách hàng', 'Before/After', 'Câu chuyện khách hàng', 'Rating & Review'],
    'Tips & Hướng dẫn': ['Cách chăm sóc', 'Xu hướng mới', 'DIY tại nhà', 'Lựa chọn phù hợp']
  };
  return categories[pillar] || ['Nội dung chung', 'Thông tin hữu ích', 'Chia sẻ kinh nghiệm'];
}

function getAnglesForPillar(pillar, businessType) {
  const angles = {
    'Giới thiệu dịch vụ': ['Chuyên nghiệp', 'Thân thiện', 'Hiện đại', 'Chất lượng'],
    'Khuyến mãi & Ưu đãi': ['Tiết kiệm', 'Giá trị', 'Có hạn', 'Đặc biệt'],
    'Testimonial & Review': ['Tin tưởng', 'Hài lòng', 'Gợi ý', 'Chia sẻ'],
    'Tips & Hướng dẫn': ['Hữu ích', 'Dễ hiểu', 'Thực tế', 'Chuyên môn']
  };
  return angles[pillar] || ['Thông tin', 'Hấp dẫn', 'Chân thực', 'Gần gũi'];
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

module.exports = {
  getCategoriesForPillar,
  getAnglesForPillar,
  getWeekNumber
};
