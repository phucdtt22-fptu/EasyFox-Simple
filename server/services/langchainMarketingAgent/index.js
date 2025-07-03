const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { createToolCallingAgent, AgentExecutor } = require("langchain/agents");
const { BufferMemory, ChatMessageHistory } = require("langchain/memory");
const systemPrompt = require("./systemPrompt");
const createTools = require("./tools");
const agentUtils = require("./agentUtils");

class LangChainMarketingAgent {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxTokens: 2000,
    });
    this.systemPrompt = systemPrompt;
  }

  async getAgentExecutor(tools, chatHistory = []) {
    console.log('🔧 Creating agent with tools:', tools.map(t => t.name));
    console.log('📜 System prompt length:', this.systemPrompt.length);
    console.log('💬 Chat history length:', chatHistory.length);
    
    // Create ChatMessageHistory properly
    const messageHistory = new ChatMessageHistory();
    
    // Add chat history messages if any
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        if (msg.role === 'user') {
          await messageHistory.addUserMessage(msg.content);
        } else if (msg.role === 'assistant') {
          await messageHistory.addAIMessage(msg.content);
        }
      }
    }

    // Use BufferMemory for chat history
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'chat_history',
      inputKey: 'input',
      outputKey: 'output',
      chatHistory: messageHistory
    });

    // Create prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.systemPrompt],
      ["placeholder", "{chat_history}"],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"]
    ]);
    
    console.log('🎯 Created prompt template');
    
    // Bind tools to model first
    const modelWithTools = this.model.bindTools(tools);
    
    // Create agent using createToolCallingAgent
    const agent = await createToolCallingAgent({
      llm: modelWithTools,
      tools,
      prompt,
    });
    
    // Create executor with standard settings
    const executor = new AgentExecutor({
      agent,
      tools,
      memory,
      verbose: true,
      maxIterations: 3,
      returnIntermediateSteps: true,
    });
    
    console.log('✅ Agent executor created successfully');
    return executor;
  }

  async processMessage(userId, message, onboardingNotes = null, chatHistory = [], onboardingData = null) {
    try {
      const tools = createTools(this.supabase, userId, agentUtils);

      // Special handling for onboarding data submission
      if (onboardingData) {
        const businessParagraph = await agentUtils.createBusinessParagraphFromData.call(this, onboardingData);
        const addOnboardingTool = tools.find(t => t.name === 'Add_Onboarding_Data');
        if (addOnboardingTool) {
          const result = await addOnboardingTool.func({ paragraph: businessParagraph });
          return {
            success: true,
            response: result
          };
        } else {
          throw new Error('Add_Onboarding_Data tool not found');
        }
      }

      // Use standard Tools Agent execution
      const agentExecutor = await this.getAgentExecutor(tools, chatHistory);

      // Create input for agent
      const input = onboardingNotes 
        ? `[THÔNG TIN DOANH NGHIỆP]\n${onboardingNotes}\n\n[TIN NHẮN NGƯỜI DÙNG]\n${message}`
        : message;

      console.log('🤖 Invoking agent with input:', input.substring(0, 100) + '...');

      const result = await agentExecutor.invoke({
        input: input
      });

      // Nếu có tool call, trả về quy trình agent dạng text đơn giản
      if (result.intermediateSteps && result.intermediateSteps.length > 0) {
        let stepsText = '🔧 QUY TRÌNH AGENT SỬ DỤNG TOOL:\n\n';
        
        for (let i = 0; i < result.intermediateSteps.length; i++) {
          const step = result.intermediateSteps[i];
          const action = step.action;
          const observation = step.observation;
          
          stepsText += `📋 Bước ${i + 1}: Agent gọi tool "${action.tool}"\n`;
          stepsText += `📥 Input: ${JSON.stringify(action.toolInput, null, 2)}\n`;
          stepsText += `📤 Kết quả: ${typeof observation === 'string' ? observation : JSON.stringify(observation, null, 2)}\n`;
          stepsText += `\n${'─'.repeat(50)}\n\n`;
        }
        
        // Thêm output cuối cùng nếu có
        if (result.output) {
          stepsText += `✅ KẾT LUẬN CUỐI CÙNG:\n${result.output}`;
        }
        
        return {
          success: true,
          response: stepsText
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
