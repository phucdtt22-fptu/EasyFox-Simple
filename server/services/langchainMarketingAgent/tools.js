// Tool definitions for EasyFox AI Marketing Agent



// Use agentUtils from src/lib/agentUtils (TypeScript)
function createTools(supabase, userId, agentUtils) {
  return [
    {
      name: "Show_Campaign_Form",
      description: "Hiển thị form tạo chiến dịch marketing mới để khách hàng điền thông tin cơ bản (tên, mục tiêu, thời gian, ngân sách, nền tảng, tần suất).",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Lý do cần form" }
        },
        required: ["reason"]
      },
      func: async ({ reason }) => {
        return {
          action: "show_campaign_form",
          reason: reason || "Cần thu thập thông tin cơ bản để tạo chiến dịch marketing mới",
          message: `Vui lòng điền form thông tin chiến dịch marketing mới để tôi có thể hỗ trợ bạn lên kế hoạch nội dung phù hợp.`
        };
      }
    },
    {
      name: "Show_Onboarding_Form",
      description: "Hiển thị form onboarding để khách hàng điền thông tin nhanh",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Lý do cần form onboarding" }
        },
        required: ["reason"]
      },
      func: async ({ reason }) => {
        return {
          action: "show_onboarding_form",
          reason,
          message: `Để tôi có thể hỗ trợ bạn tốt nhất, vui lòng điền form thông tin doanh nghiệp bên dưới. ${reason}`
        };
      }
    },
    {
      name: "Add_Onboarding_Data",
      description: "Lưu đoạn văn mô tả doanh nghiệp sau khi user hoàn thành onboarding form.",
      parameters: {
        type: "object",
        properties: {
          paragraph: { type: "string", description: "Đoạn văn mô tả doanh nghiệp" }
        },
        required: ["paragraph"]
      },
      func: async ({ paragraph }) => {
        // Gọi hàm utils để lưu vào DB
        if (!paragraph) return { error: "Thiếu đoạn văn mô tả doanh nghiệp" };
        const result = await agentUtils.saveOnboardingParagraph?.(paragraph, userId, supabase);
        return { success: true, result };
      }
    },
    {
      name: "Create_Campaign",
      description: "Tạo chiến dịch marketing mới với các thông tin chi tiết.",
      parameters: {
        type: "object",
        properties: {
          campaign_name: { type: "string" },
          goals: { type: "string" },
          duration_weeks: { type: "number" },
          platforms: { type: "array", items: { type: "string" } },
          posts_per_week: { type: "number" },
          content_pillars: { type: "array", items: { type: "string" } },
          target_audience: { type: "string" },
          budget: { type: "number" }
        },
        required: ["campaign_name", "goals", "duration_weeks", "platforms", "posts_per_week", "content_pillars", "target_audience", "budget"]
      },
      func: async (args) => {
        // Gọi hàm utils để lưu campaign vào DB
        const result = await agentUtils.createCampaign?.(args, userId, supabase);
        return { success: true, result };
      }
    },
    {
      name: "Create_Schedule",
      description: "Tạo lịch nội dung chi tiết cho chiến dịch.",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "string" },
          schedule_weeks: { type: "number" },
          business_type: { type: "string" },
          content_pillars: { type: "array", items: { type: "string" } },
          platforms: { type: "array", items: { type: "string" } }
        },
        required: ["campaign_id", "schedule_weeks", "business_type", "content_pillars", "platforms"]
      },
      func: async (args) => {
        const result = await agentUtils.createSchedule?.(args, userId, supabase);
        return { success: true, result };
      }
    },
    {
      name: "Get_Campaign",
      description: "Lấy danh sách các chiến dịch marketing của user.",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string" }
        },
        required: ["user_id"]
      },
      func: async ({ user_id }) => {
        const result = await agentUtils.getCampaigns?.(user_id || userId, supabase);
        return { success: true, result };
      }
    },
    {
      name: "Get_Schedule",
      description: "Lấy lịch nội dung cho chiến dịch.",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          campaign_id: { type: "string" }
        },
        required: ["user_id"]
      },
      func: async ({ user_id, campaign_id }) => {
        const result = await agentUtils.getSchedule?.(user_id || userId, campaign_id, supabase);
        return { success: true, result };
      }
    }
  ];
}

module.exports = createTools;
