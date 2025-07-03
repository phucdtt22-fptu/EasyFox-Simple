// Tool definitions for EasyFox AI Marketing Agent
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");

// Use agentUtils from src/lib/agentUtils (TypeScript)
function createTools(supabase, userId, agentUtils) {
  console.log('🔧 Creating LangChain DynamicStructuredTools for user:', userId);
  
  const tools = [
    new DynamicStructuredTool({
      name: "Show_Campaign_Form",
      description: "Hiển thị form để người dùng tạo chiến dịch marketing mới. Sử dụng khi người dùng muốn tạo campaign, chiến dịch, hoặc cần form để điền thông tin chi tiết.",
      schema: z.object({
        userRequest: z.string().describe("Yêu cầu cụ thể của user về chiến dịch marketing")
      }),
      func: async ({ userRequest }) => {
        console.log('🚀 Show_Campaign_Form tool được gọi! User request:', userRequest);
        const result = {
          action: "show_campaign_form",
          reason: userRequest || "User muốn tạo chiến dịch marketing",
          message: `Tôi sẽ giúp bạn tạo một chiến dịch marketing phù hợp. 

Để tư vấn chính xác nhất, bạn có thể chia sẻ:
- Tên chiến dịch mong muốn
- Mục tiêu chính (tăng doanh thu, nhận diện thương hiệu, thu hút khách mới...)
- Đối tượng khách hàng mục tiêu
- Ngân sách dự kiến (nếu có)
- Thời gian triển khai

Với thông tin này, tôi sẽ đưa ra kế hoạch chi tiết cho bạn!`
        };
        console.log('✅ Show_Campaign_Form tool trả về:', result);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: "Show_Onboarding_Form", 
      description: "Hiển thị form onboarding để khách hàng điền thông tin doanh nghiệp",
      schema: z.object({
        reason: z.string().describe("Lý do cần thu thập thông tin onboarding")
      }),
      func: async ({ reason }) => {
        const result = {
          action: "show_onboarding_form",
          reason: reason || "Cần thu thập thông tin doanh nghiệp",
          message: `Để tôi có thể hỗ trợ bạn tốt nhất, vui lòng điền form thông tin doanh nghiệp bên dưới.`
        };
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: "Add_Onboarding_Data",
      description: "Lưu thông tin doanh nghiệp sau khi user hoàn thành onboarding form",
      schema: z.object({
        paragraph: z.string().describe("Đoạn văn mô tả đầy đủ về doanh nghiệp")
      }),
      func: async ({ paragraph }) => {
        try {
          if (!paragraph) {
            throw new Error('Missing paragraph in onboarding data');
          }

          const { data: updateData, error } = await supabase
            .from('users')
            .update({ notes: paragraph })
            .eq('id', userId);

          if (error) {
            console.error('Error saving onboarding data:', error);
            throw error;
          }

          return JSON.stringify({
            success: true,
            message: 'Thông tin doanh nghiệp đã được lưu thành công!',
            data: paragraph
          });
        } catch (error) {
          console.error('Error in Add_Onboarding_Data:', error);
          return JSON.stringify({
            success: false,
            error: error.message
          });
        }
      }
    }),

    new DynamicStructuredTool({
      name: "Create_Campaign",
      description: "Tạo chiến dịch marketing mới với thông tin từ form",
      schema: z.object({
        campaignData: z.object({
          name: z.string().describe("Tên chiến dịch"),
          objectives: z.string().describe("Mục tiêu chiến dịch"),
          target_audience: z.string().describe("Đối tượng mục tiêu"),
          budget: z.string().optional().describe("Ngân sách dự kiến"),
          startDate: z.string().optional().describe("Ngày bắt đầu chiến dịch (YYYY-MM-DD)"),
          endDate: z.string().optional().describe("Ngày kết thúc chiến dịch (YYYY-MM-DD)"),
          notes: z.string().optional().describe("Ghi chú bổ sung")
        }).describe("Dữ liệu chi tiết của chiến dịch")
      }),
      func: async ({ campaignData }) => {
        try {
          // Parse dates from string format
          const parseDate = (dateStr) => {
            if (!dateStr) return null;
            // Handle both YYYY-MM-DD and other formats
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : dateStr;
          };

          // Map dữ liệu theo schema database
          const dbCampaignData = {
            name: campaignData.name,
            goals: campaignData.objectives,
            target_audience: campaignData.target_audience,
            budget: campaignData.budget ? parseFloat(campaignData.budget) : null,
            start_date: parseDate(campaignData.startDate),
            end_date: parseDate(campaignData.endDate),
            notes: campaignData.notes || ''
          };
          
          const { data, error } = await supabase
            .from('campaigns')
            .insert([{ ...dbCampaignData, user_id: userId }])
            .select();

          if (error) {
            console.error('Error creating campaign:', error);
            throw error;
          }

          return JSON.stringify({ 
            success: true, 
            result: data[0],
            message: 'Chiến dịch đã được tạo thành công!'
          });
        } catch (error) {
          console.error('Error in Create_Campaign:', error);
          return JSON.stringify({ success: false, error: error.message });
        }
      }
    }),

    new DynamicStructuredTool({
      name: "Create_Schedule",
      description: "Tạo lịch nội dung cho chiến dịch",
      schema: z.object({
        scheduleData: z.object({
          campaignId: z.string().describe("ID của chiến dịch"),
          contentPlan: z.string().describe("Kế hoạch nội dung")
        }).describe("Dữ liệu lịch nội dung")
      }),
      func: async ({ scheduleData }) => {
        try {
          const result = await agentUtils.createSchedule?.(scheduleData, userId, supabase);
          return JSON.stringify({ success: true, result });
        } catch (error) {
          console.error('Error in Create_Schedule:', error);
          return JSON.stringify({ success: false, error: error.message });
        }
      }
    }),

    new DynamicStructuredTool({
      name: "Get_Campaign",
      description: "Lấy danh sách chiến dịch hiện có của user",
      schema: z.object({
        filter: z.string().optional().describe("Bộ lọc tìm kiếm chiến dịch")
      }),
      func: async ({ filter }) => {
        try {
          const result = await agentUtils.getCampaigns?.(userId, supabase, filter);
          return JSON.stringify({ success: true, result });
        } catch (error) {
          console.error('Error in Get_Campaign:', error);
          return JSON.stringify({ success: false, error: error.message });
        }
      }
    }),

    new DynamicStructuredTool({
      name: "Get_Schedule",
      description: "Lấy lịch nội dung của chiến dịch",
      schema: z.object({
        campaign_id: z.string().describe("ID của chiến dịch cần lấy lịch")
      }),
      func: async ({ campaign_id }) => {
        try {
          const result = await agentUtils.getSchedule?.(userId, campaign_id, supabase);
          return JSON.stringify({ success: true, result });
        } catch (error) {
          console.error('Error in Get_Schedule:', error);
          return JSON.stringify({ success: false, error: error.message });
        }
      }
    })
  ];
  
  console.log('✅ Created', tools.length, 'LangChain DynamicStructuredTools:', tools.map(t => t.name));
  return tools;
}

module.exports = createTools;