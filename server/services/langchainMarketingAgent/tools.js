// Tool definitions for EasyFox AI Marketing Agent
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");

// Use agentUtils from src/lib/agentUtils (TypeScript)
function createTools(supabase, userId, agentUtils) {
  console.log('🔧 Creating LangChain DynamicStructuredTools for user:', userId);
  
  const tools = [
    new DynamicStructuredTool({
      name: "Show_Onboarding_Form",
      description: "Hiển thị form onboarding để thu thập thông tin doanh nghiệp của user. Sử dụng khi user là người mới, cần tìm hiểu thông tin doanh nghiệp, hoặc user yêu cầu cập nhật thông tin.",
      schema: z.object({
        reason: z.string().describe("Lý do cần hiển thị form onboarding")
      }),
      func: async ({ reason }) => {
        console.log('📝 Show_Onboarding_Form tool được gọi! Reason:', reason);
        const result = {
          action: "show_onboarding_form", 
          success: true
        };
        console.log('✅ Show_Onboarding_Form tool trả về:', result);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: "Add_Onboarding_Data",
      description: "Lưu/cập nhật thông tin doanh nghiệp. Marketing agent sẽ tự viết nội dung về khách hàng dựa trên thông tin được cung cấp.",
      schema: z.object({
        businessInfo: z.string().describe("Thông tin đã được marketing agent phân tích và viết thành đoạn văn hoàn chỉnh về doanh nghiệp"),
        isUpdate: z.boolean().optional().describe("True nếu đây là update thông tin đã có, false nếu là lần đầu")
      }),
      func: async ({ businessInfo, isUpdate = false }) => {
        console.log('💾 Add_Onboarding_Data tool được gọi! Business info:', businessInfo);
        
        try {
          // Lấy thông tin hiện tại nếu là update
          let finalBusinessInfo = businessInfo;
          
          if (isUpdate) {
            const { data: currentUser } = await supabase
              .from('users')
              .select('notes')
              .eq('id', userId)
              .single();
            
            const existingInfo = currentUser?.notes || '';
            
            if (existingInfo) {
              // Kết hợp thông tin cũ và mới
              finalBusinessInfo = `${existingInfo}\n\n[CẬP NHẬT MỚI]: ${businessInfo}`;
            }
          }

          console.log('✍️ Marketing agent đã chuẩn bị thông tin doanh nghiệp:', finalBusinessInfo.substring(0, 100) + '...');

          // Lưu thông tin trực tiếp vào database
          const { data, error } = await supabase
            .from('users')
            .update({ notes: finalBusinessInfo })
            .eq('id', userId);
            
          if (error) {
            console.error('❌ Lỗi khi lưu onboarding data:', error);
            throw error;
          }
          
          console.log('✅ Onboarding data đã được lưu thành công');
          
          return JSON.stringify({
            success: true,
            action: "onboarding_data_saved",
            isUpdate: isUpdate,
            preview: {
              action: "💾 AI đã lưu thông tin doanh nghiệp",
              data: finalBusinessInfo.substring(0, 200) + "...",
              status: isUpdate ? "Cập nhật thành công" : "Lưu thông tin mới thành công"
            }
          });
        } catch (error) {
          console.error('❌ Error in Add_Onboarding_Data:', error);
          return JSON.stringify({
            success: false,
            error: "Không thể lưu thông tin onboarding. Vui lòng thử lại."
          });
        }
      }
    }),

    new DynamicStructuredTool({
      name: "Show_Campaign_Form",
      description: "LUÔN LUÔN hiển thị form để người dùng tạo chiến dịch marketing mới khi họ mention về campaign/chiến dịch. Đây là BƯỚC ĐẦU TIÊN bắt buộc trong quy trình tạo campaign.",
      schema: z.object({
        userRequest: z.string().describe("Yêu cầu cụ thể của user về chiến dịch marketing")
      }),
      func: async ({ userRequest }) => {
        console.log('🚀 Show_Campaign_Form tool được gọi! User request:', userRequest);
        const result = {
          action: "show_campaign_form",
          success: true
        };
        console.log('✅ Show_Campaign_Form tool trả về:', result);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: "Create_Campaign",
      description: `Tạo chiến dịch marketing mới CHỈ sau khi khách hàng đã xác nhận. 
      
      QUAN TRỌNG - CHUẨN HÓA DỮ LIỆU TRƯỚC KHI GỌI TOOL:
      - name: Viết Title Case, chuyên nghiệp (vd: "chiến dịch abc" → "Chiến Dịch ABC")
      - budget: Chuyển về số nguyên (vd: "2000000", "5000000") - KHÔNG dùng từ "triệu", "tỷ" 
      - target_audience: Chuẩn hóa demographic (vd: "genz" → "Gen Z", "millennials" → "Millennials")
      - objectives: Viết rõ ràng, professional
      - dates: Đảm bảo format YYYY-MM-DD`,
      schema: z.object({
        campaignData: z.object({
          name: z.string().describe("Tên chiến dịch đã chuẩn hóa Title Case"),
          objectives: z.string().describe("Mục tiêu rõ ràng, professional"), 
          target_audience: z.string().describe("Đối tượng đã chuẩn hóa (Gen Z, Millennials, etc.)"),
          budget: z.string().optional().describe("Ngân sách dạng số nguyên (2000000, 5000000, etc.)"),
          startDate: z.string().optional().describe("YYYY-MM-DD format"),
          endDate: z.string().optional().describe("YYYY-MM-DD format"),
          notes: z.string().optional().describe("Ghi chú tóm tắt")
        }),
        confirmationReceived: z.boolean().describe("Khách đã approve thông tin campaign")
      }),
      func: async ({ campaignData, confirmationReceived }) => {
        try {
          console.log('🎯 Create_Campaign tool được gọi với data:', campaignData);
          
          // Kiểm tra confirmation - nếu chưa có thì trả về pending confirmation
          if (!confirmationReceived) {
            console.log('⏳ Create_Campaign: tạo confirmation request');
            
            // Tạo preview compact cho confirmation
            return JSON.stringify({
              success: true,
              isPending: true,
              toolCall: {
                name: "Create_Campaign",
                input: { campaignData, confirmationReceived: true }, // Auto-set true for actual execution
                preview: {
                  action: `🎯 Tạo chiến dịch "${campaignData.name}"`,
                  title: campaignData.name,
                  details: [
                    `📊 Mục tiêu: ${campaignData.objectives}`,
                    `👥 Đối tượng: ${campaignData.target_audience}`,
                    `💰 Ngân sách: ${campaignData.budget ? Number(campaignData.budget).toLocaleString('vi-VN') + ' VNĐ' : 'Chưa xác định'}`,
                    `📅 Thời gian: ${campaignData.startDate} → ${campaignData.endDate}`
                  ]
                }
              },
              message: "Tool call đang chờ xác nhận từ người dùng"
            });
          }

          // Parse dates from string format
          const parseDate = (dateStr) => {
            if (!dateStr) return null;
            // Handle both YYYY-MM-DD and other formats
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : dateStr;
          };

          // Budget processing - AI must send clean numbers only
          const parseBudgetForStorage = (budgetStr) => {
            if (!budgetStr) return null;
            
            // AI should send pure numbers like "2000000" 
            const num = parseFloat(budgetStr.toString().replace(/,/g, ''));
            return isNaN(num) ? null : num;
          };

          // Map dữ liệu theo schema database
          const dbCampaignData = {
            name: campaignData.name,
            goals: campaignData.objectives,
            target_audience: campaignData.target_audience,
            budget: parseBudgetForStorage(campaignData.budget),
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

          const createdCampaign = data[0];
          console.log('✅ Campaign created successfully with ID:', createdCampaign.id);
          console.log('✅ Campaign data:', createdCampaign);

          const successResponse = {
            success: true, 
            campaignId: createdCampaign.id,
            campaignData: {
              name: createdCampaign.name,
              goals: createdCampaign.goals,
              target_audience: createdCampaign.target_audience,
              budget: createdCampaign.budget,
              start_date: createdCampaign.start_date,
              end_date: createdCampaign.end_date
            },
            nextAction: "create_content_schedule", // Hướng dẫn AI bước tiếp theo
            message: `✅ CHIẾN DỊCH ĐÃ TẠO THÀNH CÔNG! 

Chiến dịch "${createdCampaign.name}" đã được lưu vào hệ thống với ID: ${createdCampaign.id}

🚀 BƯỚC TIẾP THEO: Hãy tiếp tục tạo lịch nội dung chi tiết (Content Schedule) cho chiến dịch này để hoàn thiện quy trình marketing automation.

Sử dụng tool Create_Content_Schedule với campaignId: ${createdCampaign.id}`,
            preview: {
              action: "🎯 AI đã tạo chiến dịch marketing thành công",
              title: createdCampaign.name,
              details: [
                `📊 Mục tiêu: ${createdCampaign.goals}`,
                `👥 Đối tượng: ${createdCampaign.target_audience}`,
                `💰 Ngân sách: ${createdCampaign.budget ? Number(createdCampaign.budget).toLocaleString('vi-VN') + ' VNĐ' : 'Chưa xác định'}`,
                `📅 Thời gian: ${createdCampaign.start_date} → ${createdCampaign.end_date}`,
                `🆔 Campaign ID: ${createdCampaign.id}`
              ],
              status: "✅ Đã lưu vào database - Sẵn sàng tạo Content Schedule!"
            }
          };
          
          console.log('✅ Create_Campaign returning success response:', JSON.stringify(successResponse, null, 2));
          return JSON.stringify(successResponse);
        } catch (error) {
          console.error('Error in Create_Campaign:', error);
          return JSON.stringify({ success: false, error: error.message });
        }
      }
    }),

    new DynamicStructuredTool({
      name: "Create_Content_Schedule",
      description: "Tự động tạo lịch nội dung chi tiết cho chiến dịch với content briefs chuyên nghiệp. CHỈ sử dụng sau khi khách hàng đã xác nhận thông tin chiến dịch và content strategy.",
      schema: z.object({
        campaignId: z.string().describe("ID của chiến dịch vừa được tạo"),
        analysisNotes: z.string().optional().describe("Ghi chú phân tích từ khách hàng để tối ưu content plan"),
        contentStrategy: z.object({
          pillars: z.array(z.string()).optional().describe("Các content pillars đã được xác nhận"),
          platforms: z.array(z.string()).optional().describe("Platforms đã được xác nhận"),
          frequency: z.number().optional().describe("Số posts per week đã được xác nhận")
        }).optional().describe("Chiến lược content đã được xác nhận từ khách"),
        confirmationReceived: z.boolean().optional().describe("Khách đã approve content strategy")
      }),
      func: async ({ campaignId, analysisNotes, contentStrategy, confirmationReceived = false }) => {
        try {
          console.log('🗓️ Creating detailed content schedule for campaign:', campaignId);
          
          // Lấy thông tin campaign
          const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

          if (campaignError || !campaign) {
            throw new Error('Không tìm thấy chiến dịch');
          }

          // Lấy thông tin user để hiểu business context
          const { data: userInfo } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          console.log('📊 Campaign data:', campaign);

          // Tính toán thông số cơ bản
          const startDate = new Date(campaign.start_date);
          const endDate = new Date(campaign.end_date);
          const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          const totalWeeks = Math.ceil(totalDays / 7);
          
          // Content pillars dựa trên loại business và mục tiêu
          const defaultPillars = [
            'Product Showcase', // Giới thiệu sản phẩm/dịch vụ
            'Behind The Scenes', // Hậu trường 
            'Customer Stories', // Câu chuyện khách hàng
            'Educational Content', // Nội dung giáo dục
            'Promotional Content', // Nội dung khuyến mãi
            'Brand Lifestyle', // Lối sống thương hiệu
            'Community Engagement' // Tương tác cộng đồng
          ];

          const pillars = contentStrategy?.pillars || defaultPillars;
          const platforms = contentStrategy?.platforms || ['facebook', 'instagram'];
          const postsPerWeek = contentStrategy?.frequency || 3;

          // Tạo preview cho confirmation nếu chưa được xác nhận
          if (!confirmationReceived) {
            // Tạo sample schedule items cho preview
            const previewItems = [];
            const sampleWeeks = Math.min(totalWeeks, 3); // Show max 3 weeks in preview
            
            for (let week = 0; week < sampleWeeks; week++) {
              let postsThisWeek = 0;
              
              for (let day = 0; day < 7 && postsThisWeek < postsPerWeek; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                
                const optimalDays = [1, 3, 5]; // Monday, Wednesday, Friday
                const dayOfWeek = currentDate.getDay();
                
                if (optimalDays.includes(dayOfWeek) && postsThisWeek < postsPerWeek) {
                  platforms.forEach(platform => {
                    const pillarIndex = previewItems.length % pillars.length;
                    const pillar = pillars[pillarIndex];
                    
                    previewItems.push({
                      date: currentDate.toISOString().split('T')[0],
                      platform: platform,
                      pillar: pillar,
                      category: week % 4 === 3 ? 'Promotional' : 'Organic',
                      brief: `${pillar} content for ${platform} - Week ${week + 1}`
                    });
                  });
                  postsThisWeek++;
                }
              }
            }

            const totalEstimatedPosts = totalWeeks * postsPerWeek * platforms.length;

            return JSON.stringify({
              success: true,
              isPending: true,
              toolCall: {
                name: "Create_Content_Schedule",
                input: { campaignId, analysisNotes, contentStrategy, confirmationReceived: true },
                preview: {
                  action: `📅 Tạo lịch nội dung cho "${campaign.name}"`,
                  title: `Lịch content chi tiết - ${totalEstimatedPosts} posts`,
                  summary: [
                    `📊 Tổng cộng: ${totalEstimatedPosts} posts trong ${totalWeeks} tuần`,
                    `📱 Platforms: ${platforms.join(', ')}`,
                    `🎯 Content Pillars: ${pillars.length} loại`,
                    `⏰ Tần suất: ${postsPerWeek} posts/tuần`
                  ],
                  tableHeaders: ["Ngày", "Platform", "Content Pillar", "Loại", "Content Brief"],
                  tableData: previewItems,
                  stats: {
                    totalWeeks,
                    postsPerWeek,
                    platforms,
                    totalEstimatedPosts
                  }
                }
              },
              message: "Tool call đang chờ xác nhận từ người dùng"
            });
          }

          // Tạo content briefs chuyên nghiệp
          const createDetailedBrief = (pillar, platform, week, dayIndex, campaign, userInfo) => {
            const businessType = userInfo?.notes || 'doanh nghiệp';
            const goal = campaign.goals;
            const audience = campaign.target_audience;
            
            const briefTemplates = {
              'Product Showcase': [
                `Giới thiệu chi tiết ${businessType.includes('món') ? 'món mới' : 'sản phẩm mới'} với focus vào unique selling points. Sử dụng góc chụp 45 độ, ánh sáng tự nhiên, kèm story về quá trình tạo ra sản phẩm. CTA: "Thử ngay hôm nay!"`,
                `Product demo với before/after hoặc step-by-step process. Highlight benefits cụ thể cho ${audience || 'target audience'}. Include user testimonial ngắn và price point. CTA: "Đặt hàng ngay!"`,
                `Feature spotlight một aspect đặc biệt của sản phẩm. Use close-up shots, infographic style. Giải thích tại sao feature này quan trọng. CTA: "Tìm hiểu thêm!"`
              ],
              'Behind The Scenes': [
                `Behind-the-scenes quá trình làm việc của team, từ preparation đến delivery. Humanize brand, show passion và dedication. Include team member interviews ngắn. Tone: authentic, personal.`,
                `Day-in-the-life content của founder/staff. Show challenges, victories, và what drives the business. Create emotional connection với audience. Include business values.`,
                `Process transparency - how products are made/services delivered. Build trust thông qua openness. Show quality control, attention to details. Tone: professional yet approachable.`
              ],
              'Customer Stories': [
                `Feature customer success story với before/after transformation. Include customer quotes, photos (with permission). Show measurable results. CTA: "Share your story!"`,
                `User-generated content showcase với permission. Repost customer photos/videos với added context. Thank customers publicly. Encourage more UGC participation.`,
                `Customer testimonial video hoặc written review highlight. Focus trên emotional impact và practical benefits. Include customer demographics briefly để audience relate.`
              ],
              'Educational Content': [
                `Educational post về industry insights, tips, hoặc how-to guides. Position brand as expert. Use carousel format với step-by-step instructions. Value-first approach.`,
                `Myth-busting content about common misconceptions trong industry. Provide facts với credible sources. Build authority và trust. Tone: informative, helpful.`,
                `Tutorial content related to products/services. Break down complex concepts into simple steps. Include visuals hoặc infographics. CTA: "Try it yourself!"`
              ],
              'Promotional Content': [
                `Limited-time offer announcement với clear value proposition. Create urgency với countdown timer. Specify terms clearly. Include compelling visuals. CTA: "Claim now!"`,
                `New product/service launch với early bird special. Build excitement với teaser elements. Include launch date, pricing, special benefits. Create FOMO.`,
                `Seasonal promotion tied to holidays/events. Connect offer to seasonal needs. Use seasonal visuals và messaging. Include gift-wrapping hoặc special packaging mentions.`
              ],
              'Brand Lifestyle': [
                `Lifestyle content showing how brand fits into customer's daily life. Use aspirational imagery. Connect với customer values và lifestyle goals. Tone: inspirational.`,
                `Brand values demonstration through actions/initiatives. Show community involvement, sustainability efforts, or social causes. Build emotional brand connection.`,
                `Culture content showing brand personality. Could be office culture, brand mascot, or brand humor. Make brand more relatable và memorable. Tone: fun, engaging.`
              ],
              'Community Engagement': [
                `Community spotlight featuring local partnerships, events, hoặc collaborations. Show brand's role trong community. Include partner tags và cross-promotion.`,
                `Interactive content like polls, questions, challenges that encourage audience participation. Build engagement và gather audience insights. Respond to all comments.`,
                `Appreciation post for community, customers, partners. Show gratitude và recognition. Could be milestone celebrations, thank you posts, or community achievements.`
              ]
            };

            const templates = briefTemplates[pillar] || [`Tạo nội dung ${pillar} chất lượng cao phù hợp với mục tiêu ${goal} và target audience ${audience}.`];
            const template = templates[dayIndex % templates.length];
            
            return `${template} Platform: ${platform}. Week ${week + 1} focus.`;
          };

          // Tạo lịch content chi tiết
          const scheduleItems = [];

          for (let week = 0; week < totalWeeks; week++) {
            let postsThisWeek = 0;
            
            for (let day = 0; day < 7 && postsThisWeek < postsPerWeek; day++) {
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + (week * 7) + day);
              
              // Tối ưu ngày đăng: Thứ 2, 4, 6 cho organic reach tốt hơn
              const optimalDays = [1, 3, 5]; // Monday, Wednesday, Friday
              const dayOfWeek = currentDate.getDay();
              
              if (optimalDays.includes(dayOfWeek) && postsThisWeek < postsPerWeek) {
                platforms.forEach(platform => {
                  const pillarIndex = (scheduleItems.length) % pillars.length;
                  const pillar = pillars[pillarIndex];
                  
                  // Tạo content angle dựa trên platform và timing
                  const contentAngles = {
                    facebook: `Facebook ${platform} strategy - ${pillar} for week ${week + 1}`,
                    instagram: `Instagram ${platform} visual - ${pillar} for week ${week + 1}`,
                    tiktok: `TikTok ${platform} trend - ${pillar} for week ${week + 1}`,
                    youtube: `YouTube ${platform} deep-dive - ${pillar} for week ${week + 1}`
                  };

                  const detailedBrief = createDetailedBrief(pillar, platform, week, scheduleItems.length, campaign, userInfo);

                  scheduleItems.push({
                    campaign_id: campaignId,
                    user_id: userId,
                    scheduled_date: currentDate.toISOString().split('T')[0],
                    platform: platform,
                    content_pillar: pillar,
                    content_category: week % 4 === 3 ? 'Promotional Post' : 'Organic Post', // Mỗi 4 tuần có 1 promotional
                    content_angle: contentAngles[platform] || `${platform} content strategy for ${pillar}`,
                    content_brief: detailedBrief,
                    status: 'draft'
                  });
                });
                postsThisWeek++;
              }
            }
          }

          // Lưu vào database
          const { data: savedSchedule, error: scheduleError } = await supabase
            .from('schedule')
            .insert(scheduleItems)
            .select();

          if (scheduleError) {
            console.error('Error saving schedule:', scheduleError);
            throw scheduleError;
          }

          console.log('✅ Created', savedSchedule.length, 'detailed schedule items');

          // Tạo summary report chuyên nghiệp
          const platformDistribution = platforms.reduce((acc, platform) => {
            acc[platform] = scheduleItems.filter(item => item.platform === platform).length;
            return acc;
          }, {});

          const pillarDistribution = pillars.reduce((acc, pillar) => {
            acc[pillar] = scheduleItems.filter(item => item.content_pillar === pillar).length;
            return acc;
          }, {});

          // Tạo full table data cho display (tối đa 50 items đầu tiên để tránh quá tải UI)
          const displayItems = savedSchedule.slice(0, 50).map(item => ({
            date: item.scheduled_date,
            platform: item.platform,
            pillar: item.content_pillar,
            category: item.content_category,
            brief: item.content_brief.substring(0, 80) + "..."
          }));

          return JSON.stringify({
            success: true,
            scheduleId: campaignId,
            totalItems: savedSchedule.length,
            preview: {
              action: "📅 AI đã tạo lịch nội dung chi tiết thành công",
              title: `Lịch content cho "${campaign.name}"`,
              summary: [
                `📊 Tổng cộng: ${savedSchedule.length} posts trong ${totalWeeks} tuần`,
                `📱 Platforms: ${platforms.join(', ')}`,
                `🎯 Content Pillars: ${pillars.length} loại`,
                `⏰ Tần suất: ${postsPerWeek} posts/tuần`
              ],
              tableHeaders: ["Ngày", "Platform", "Content Pillar", "Loại", "Content Brief"],
              tableData: displayItems,
              stats: {
                platformDistribution,
                pillarDistribution,
                totalWeeks,
                postsPerWeek,
                totalSaved: savedSchedule.length,
                displayedItems: displayItems.length
              },
              status: "✅ Đã lưu vào database"
            }
          });
          
        } catch (error) {
          console.error('Error in Create_Content_Schedule:', error);
          return JSON.stringify({ 
            success: false, 
            error: error.message || 'Không thể tạo lịch content chi tiết'
          });
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
          
          // Tạo preview cho campaigns
          const campaigns = result || [];
          const previewCampaigns = campaigns.slice(0, 10).map(campaign => ({
            name: campaign.name,
            goals: campaign.goals,
            target_audience: campaign.target_audience,
            budget: campaign.budget ? Number(campaign.budget).toLocaleString('vi-VN') + ' VNĐ' : 'N/A',
            period: `${campaign.start_date} → ${campaign.end_date}`,
            status: campaign.status || 'Active'
          }));

          return JSON.stringify({ 
            success: true, 
            result,
            preview: {
              action: "📋 AI đã lấy danh sách chiến dịch",
              title: `Danh sách chiến dịch marketing`,
              summary: [
                `📊 Tổng cộng: ${campaigns.length} chiến dịch`,
                `🎯 Filter: ${filter || 'Tất cả'}`,
                `📅 Dữ liệu cập nhật: ${new Date().toLocaleDateString('vi-VN')}`
              ],
              tableHeaders: ["Tên chiến dịch", "Mục tiêu", "Target", "Ngân sách", "Thời gian", "Trạng thái"],
              tableData: previewCampaigns,
              totalItems: campaigns.length,
              status: "✅ Đã tải thành công"
            }
          });
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
          
          // Tạo preview cho schedule
          const scheduleItems = result || [];
          const previewItems = scheduleItems.slice(0, 10).map(item => ({
            date: item.scheduled_date,
            platform: item.platform,
            pillar: item.content_pillar,
            category: item.content_category,
            angle: item.content_angle,
            brief: item.content_brief ? item.content_brief.substring(0, 80) + "..." : "N/A",
            status: item.status
          }));

          return JSON.stringify({ 
            success: true, 
            result,
            preview: {
              action: "📅 AI đã lấy lịch nội dung",
              title: `Lịch content cho chiến dịch`,
              summary: [
                `📊 Tổng cộng: ${scheduleItems.length} posts`,
                `📱 Platforms: ${[...new Set(scheduleItems.map(i => i.platform))].join(', ')}`,
                `🎯 Content Pillars: ${[...new Set(scheduleItems.map(i => i.content_pillar))].length} loại`,
                `📅 Campaign ID: ${campaign_id}`
              ],
              tableHeaders: ["Ngày", "Platform", "Pillar", "Category", "Angle", "Content Brief", "Status"],
              tableData: previewItems,
              totalItems: scheduleItems.length,
              status: "✅ Đã tải thành công"
            }
          });
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