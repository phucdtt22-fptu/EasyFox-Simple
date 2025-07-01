const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { createOpenAIFunctionsAgent, AgentExecutor } = require("langchain/agents");
const { BufferMemory, ChatMessageHistory } = require("langchain/memory");
const systemPrompt = require("./systemPrompt");
const createTools = require("./tools");
const agentUtils = require("./agentUtils");

class LangChainMarketingAgent {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.suggestionModel = new ChatOpenAI({
      modelName: process.env.OPENAI_SUGGESTION_MODEL || "gpt-3.5-turbo",
      temperature: 0.5,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.systemPrompt = systemPrompt;
    // No gemini, no legacy agent, only OpenAI Functions Agent
  }

  async getAgentExecutor(tools, chatHistory = []) {
    // Use BufferMemory for chat history
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'chat_history',
      inputKey: 'input',
      outputKey: 'output',
      chatHistory: new ChatMessageHistory(
        (chatHistory || []).map(msg => ({
          role: msg.role === 'assistant' ? 'ai' : 'human',
          content: msg.content
        }))
      )
    });
    // System prompt: explicitly instruct OpenAI to ALWAYS use function/tool calls for campaign creation, onboarding, etc.
    const openaiSystemPrompt = `
Bạn là EasyFox AI Marketing Agent. Luôn sử dụng function/tool call (không trả về text) khi người dùng yêu cầu tạo chiến dịch marketing mới, chỉnh sửa thông tin doanh nghiệp, hoặc các tác vụ liên quan đến form. KHÔNG trả về chuỗi TOOL_CALL: ... hoặc text mô tả, chỉ trả về tool call đúng chuẩn OpenAI Functions. Nếu không có tool phù hợp, chỉ trả về text trả lời thông thường.

${this.systemPrompt}
`;
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", openaiSystemPrompt],
      ["placeholder", "{chat_history}"],
      ["user", "{input}"],
      ["placeholder", "{agent_scratchpad}"]
    ]);
    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt,
      inputVariables: ["input", "chat_history", "agent_scratchpad"]
    });
    const executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      memory,
      verbose: true
    });
    return executor;
  }

  async processMessage(userId, message, onboardingNotes = null, chatHistory = [], onboardingData = null) {
    try {
      const tools = createTools(this.supabase, userId, agentUtils);

      // --- Detect if user is in "waiting for campaign form" state ---
      let waitingForCampaignForm = false;
      if (chatHistory && chatHistory.length > 0) {
        const lastShowCampaignForm = [...chatHistory].reverse().find(
          msg => msg.content && (msg.content.includes('Show_Campaign_Form') || msg.content.includes('show_campaign_form'))
        );
        const lastCreateCampaign = [...chatHistory].reverse().find(
          msg => msg.content && (msg.content.includes('Create_Campaign') || msg.content.includes('create_campaign'))
        );
        if (lastShowCampaignForm && (!lastCreateCampaign || chatHistory.indexOf(lastShowCampaignForm) > chatHistory.indexOf(lastCreateCampaign))) {
          waitingForCampaignForm = true;
        }
      }

      // Special handling for onboarding data submission
      if (onboardingData) {
        const businessParagraph = await agentUtils.createBusinessParagraphFromData.call(this, onboardingData);
        const addOnboardingTool = tools.find(t => t.name === 'Add_Onboarding_Data');
        if (addOnboardingTool) {
          const result = await addOnboardingTool.func(JSON.stringify({ paragraph: businessParagraph }));
          return {
            success: true,
            response: result
          };
        } else {
          throw new Error('Add_Onboarding_Data tool not found');
        }
      }

      // --- System prompt and message array ---
      let systemMessage = `${this.systemPrompt}\n\nCURRENT CONTEXT:\n- User ID: ${userId}\n- Onboarding Status: ${onboardingNotes ? 'COMPLETED' : 'NOT COMPLETED'}\n\n${onboardingNotes ? `BUSINESS ONBOARDING DATA:\n${onboardingNotes}` : ''}`;

      const messages = [
        { role: 'system', content: systemMessage }
      ];
      if (chatHistory && chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-6);
        recentHistory.forEach(msg => {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          });
        });
      }
      messages.push({ role: 'user', content: message });

      // --- If waiting for campaign form, only append reminder, do NOT call AI again ---
      if (waitingForCampaignForm) {
        const reminder = '\n\n⚠️ Bạn đang có một form tạo chiến dịch marketing chưa hoàn thành. Vui lòng điền đầy đủ thông tin vào form để tôi có thể hỗ trợ bạn lên kế hoạch nội dung phù hợp nhất!';
        // Optionally, show last AI message if available
        let lastAIMessage = null;
        if (chatHistory && chatHistory.length > 0) {
          // Find the last assistant/ai message
          for (let i = chatHistory.length - 1; i >= 0; i--) {
            const msg = chatHistory[i];
            if (msg.role === 'assistant' || msg.role === 'ai') {
              lastAIMessage = msg.content;
              break;
            }
          }
        }
        return {
          success: true,
          response: (lastAIMessage ? lastAIMessage : '') + reminder,
          waitingForCampaignForm: true
        };
      }

      // --- Use OpenAI Functions Agent via LangChain ---
      const agentExecutor = await this.getAgentExecutor(tools, chatHistory);
      const input = {
        input: message
      };
      const result = await agentExecutor.invoke(input);
      // result.output: string, result.intermediateSteps: tool calls
      // Ưu tiên trả về toolInvocations nếu có tool call (kể cả khi intermediateSteps rỗng)
      // Nếu có tool call (function_call/tool/toolInput), trả về toolInvocations, KHÔNG trả về response text
      if (
        (result.intermediateSteps && result.intermediateSteps.length > 0) ||
        (result.tool && result.toolInput)
      ) {
        let toolInvocations = [];
        if (result.intermediateSteps && result.intermediateSteps.length > 0) {
          toolInvocations = result.intermediateSteps.map((step) => {
            return {
              toolCallId: step.action.toolCallId || step.action.tool_call_id || step.action.tool_name || 'tool',
              toolName: step.action.tool,
              state: 'result',
              args: step.action.toolInput || step.action.tool_input || {}
            };
          });
        } else if (result.tool && result.toolInput) {
          toolInvocations = [{
            toolCallId: result.tool,
            toolName: result.tool,
            state: 'result',
            args: result.toolInput
          }];
        }
        // KHÔNG trả về response text nếu có toolInvocations
        return {
          success: true,
          toolInvocations
        };
      }
      // Nếu không có tool call, trả về text như cũ
      return {
        success: true,
        response: result.output
      };
    } catch (error) {
      console.error('LangChain Marketing Agent error:', error);
      return {
        success: false,
        error: 'Xin lỗi, tôi gặp chút vấn đề kỹ thuật. Hãy thử lại sau giây lát nhé!',
        details: error.message
      };
    }
  }
}

module.exports = LangChainMarketingAgent;
