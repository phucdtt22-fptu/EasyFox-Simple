Easyfox - Là một nền tảng marketing tự động hóa, giúp bạn dễ dàng quản lý và tối ưu hóa các chiến dịch marketing của mình. Mục tiêu là các local business, các doanh nghiệp nhỏ và vừa tại Mỹ, ví dụ các tiệm nail, spa, salon, nhà hàng, quán cà phê, v.v. Đặc điểm của nhóm khách hàng này là họ không có nhiều thời gian và kiến thức về marketing, nhưng lại cần một giải pháp đơn giản, hiệu quả và tiết kiệm chi phí. Easyfox cung cấp trợ lý AI hỗ trợ tạo nội dung, lên lịch đăng bài, phân tích hiệu quả chiến dịch và tối ưu hóa ngân sách quảng cáo. Nền tảng này giúp các doanh nghiệp nhỏ và vừa tiết kiệm thời gian, chi phí và công sức trong việc quản lý marketing, đồng thời nâng cao hiệu quả kinh doanh.


Tech Stack:
- Frontend: ReactJS, NextJS, TailwindCSS
- Backend: NodeJS, ExpressJS, Supabase
- Database: Supabase (PostgreSQL)
- AI BACKEND: N8N

Chức năng chính dành cho người dùng:
- Đăng nhập/ Đăng ký sử dụng
- Quản lý tài khoản
- Giao diện chat tối ưu với AI
- Lịch sử trò chuyện

Chi tiết
- Backend: Là nơi quản lý lịch sử chat hiển thị trên giao diện chat, bao gồm các câu hỏi và câu trả lời từ AI. Backend cũng sẽ lưu trữ các thông tin người dùng và các thiết lập cá nhân. Gửi http request tới n8n để lấy câu trả lời từ AI.

Thông tin gửi tới AI N8N bao gồm:
- Câu hỏi của người dùng
- id người dùng (dùng để fixed vào các truy vấn database các tool của agent giúp ai dễ dàng lấy thông tin)
- id lịch sử chat (để AI lấy đúng lịch sử chat của người dùng)
- Thông tin cơ bản của người dùng và doanh nghiệp của họ. Để AI biết rằng người này đã onboarding chưa. Nếu dữ liệu trống AI sẽ tiến hành onboarding cho người dùng.

Database:
- Bảng users: Lưu trữ thông tin người dùng, bao gồm id, email, tên, mật khẩu (đã mã hóa), và ghi chú để AI điền vào thông tin cơ bản của người dùng sau quá trình onboarding.
- Bảng chat_history: Lưu trữ lịch sử trò chuyện của người dùng, bao gồm id, user_id (liên kết với bảng users), câu hỏi, câu trả lời từ AI, và thời gian tạo.
- Bảng settings: Lưu trữ các thiết lập cá nhân của người dùng, bao gồm id, user_id (liên kết với bảng users), và các thông tin khác liên quan đến cài đặt cá nhân.
- Bảng Campaigns: Lưu trữ thông tin về các chiến dịch marketing của người dùng, bao gồm id, user_id (liên kết với bảng users), tên chiến dịch, ngân sách,...
- Bảng schedule sẽ bao gồm lịch đăng, mạng xã hội và nội dung đăng của các ngày theo 4 tầng:
+ Content Pillars (tối đa 4–6): trụ cột định hướng tổng thể → được lưu cố định.
+ Content Categories (per pillar): loại nội dung cụ thể (VD: tutorial, case study, tips…).
+ Content Angles (per category): góc nhìn triển khai – để làm content đa dạng.
+ Content Brief Generator: AI sẽ dùng các tầng trên để generate nội dung chi tiết.
=> AI nói chuyện chính với khách sẽ là người ra các nội dung này. còn các cột còn lại như full_content, hình ảnh, video sẽ có một giao diện riêng để khách xác nhận nội dung đó và bắt đầu được AI hỗ trợ ra đầy đủ nội dung để post



AI N8N (TÔI SẼ TỰ BUILD N8N FLOW):
- AI AGENT TRỢ LÝ CHÍNH:
    - Onboarding người dùng: Lấy thông tin cơ bản của người dùng và doanh nghiệp của họ, sau đó gọi tool trên n8n chỉnh sửa thêm vào thông tin tóm tắt onboarding trong bảng User nếu thông tin onboarding của họ không được hiển thị (cột ghi chú).
    - Dựa trên thông tin cơ bản của người dùng mà AI được cung cấp, AI sẽ gọi tool trên n8n để tạo một record trong bảng Campaigns và điền đầy đủ thông tin cơ bản cùng với tất cả lịch đăng bài vào bảng schedule
    - Gọi tool trả lời cho người dùng về các câu hỏi liên quan đến chiến dịch marketing, lịch đăng bài, ngân sách, v.v.
    Lưu ý: Server phải gửi user_id và chat_history_id để AI có thể lấy đúng lịch sử chat của người dùng và gọi tool lấy thông tin từ database đúng người để trả lời đúng câu hỏi.

- AI tạo content:
    - Dựa trên lịch đăng bài đã được tạo trong bảng Campaigns, AI sẽ tự động tạo nội dung cho các bài đăng theo lịch trình đã định. AI sẽ sử dụng các thông tin từ bảng Campaigns để tạo nội dung phù hợp với Content Brief.
    - AI sẽ gọi tool trên n8n để lưu nội dung đã tạo vào các cột nội dung trong bảng schedule
Frontend:
- Giao diện đẹp hiện đại, màu sắc tươi sáng đáng tin cậy, dễ sử dụng.
- Giao diện chat với AI tối ưu hiển thị lịch sử trò chuyện, câu hỏi và câu trả lời từ AI. (AI thường trả về markdown nên cần hiển thị đúng và đẹp định dạng markdown)