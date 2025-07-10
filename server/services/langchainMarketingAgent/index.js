const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { createToolCallingAgent, AgentExecutor } = require("langchain/agents");
const { BufferMemory, ChatMessageHistory } = require("langchain/memory");
const createSystemPrompt = require("./systemPrompt");
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
  }

  async getAgentExecutor(tools, chatHistory = [], onboardingNotes = null) {
    const systemPrompt = createSystemPrompt(onboardingNotes);
    
    console.log('🔧 Creating agent with tools:', tools.map(t => t.name));
    console.log('📜 System prompt length:', systemPrompt.length);
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
      ["system", systemPrompt],
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
    
    // Create executor with controlled settings để tránh duplicate tool calls
    const executor = new AgentExecutor({
      agent,
      tools,
      memory,
      verbose: true,
      maxIterations: 10, // Tăng từ 2 lên 3 để cho phép chain logic
      returnIntermediateSteps: true,
      earlyStoppingMethod: "generate", // Dừng sớm khi có output
    });
    
    console.log('✅ Agent executor created successfully');
    return executor;
  }

  // 🔥 LƯU TOOL RESPONSES VÀO MEMORY - giống như N8N
  async saveToolResponsesToMemory(memory, intermediateSteps, finalOutput) {
    try {
      // Tạo structured tool execution context
      const toolExecutions = intermediateSteps.map(step => {
        let parsedResult = null;
        let status = 'FAILED';
        
        try {
          parsedResult = JSON.parse(step.observation);
          status = parsedResult.success ? 'SUCCESS' : 'FAILED';
        } catch (e) {
          status = step.observation.includes('success') ? 'SUCCESS' : 'FAILED';
          parsedResult = { raw: step.observation };
        }
        
        return {
          tool: step.action.tool,
          status: status,
          result: parsedResult,
          timestamp: new Date().toISOString()
        };
      });

      // Tạo structured context message cho agent - FIX: đảm bảo serialize đúng
      const contextData = {
        toolExecutions: toolExecutions,
        finalOutput: finalOutput,
        completedActions: toolExecutions.filter(t => t.status === 'SUCCESS').map(t => t.tool)
      };

      // Save với format đảm bảo agent có thể đọc được
      const toolContextMessage = `[TOOL_CONTEXT] ${JSON.stringify(contextData, null, 0)}`;
      await memory.chatHistory.addAIMessage(toolContextMessage);
      
      // Human-readable format cho agent dễ parse
      const completedTools = contextData.completedActions;
      const readableContext = `[EXECUTION_SUMMARY] Completed tools: ${completedTools.join(', ')}. Status: All tasks successful. Next step: Continue workflow based on user response.`;
      await memory.chatHistory.addAIMessage(readableContext);
      
      console.log('💾 Đã lưu structured tool context vào memory:', completedTools.join(', '));
    } catch (error) {
      console.error('❌ Lỗi khi lưu tool responses vào memory:', error);
    }
  }

  async processMessage(userId, message, onboardingNotes = null, chatHistory = [], onboardingData = null, streamCallback = null) {
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

      // Check if user needs onboarding
      const needsOnboarding = !onboardingNotes || onboardingNotes.trim().length === 0;
      
      // If user needs onboarding and is greeting, automatically call Show_Onboarding_Form
      const isGreeting = /^(xin chào|chào|hello|hi|hey|xin chao|chao)/i.test(message.trim());
      
      if (needsOnboarding && isGreeting) {
        console.log('🎯 User needs onboarding and is greeting - auto-calling Show_Onboarding_Form');
        
        const showOnboardingTool = tools.find(t => t.name === 'Show_Onboarding_Form');
        if (showOnboardingTool) {
          const toolResult = await showOnboardingTool.func({ 
            reason: "User mới cần thu thập thông tin doanh nghiệp" 
          });
          
          return {
            success: true,
            response: `Chào mừng bạn đến với EasyFox AI! 👋

Tôi là trợ lý marketing chuyên nghiệp dành cho doanh nghiệp nhỏ và vừa. Để có thể tư vấn marketing hiệu quả nhất cho bạn, tôi cần tìm hiểu về doanh nghiệp của bạn trước.

${JSON.parse(toolResult).message}`,
            toolInvocation: {
              toolName: 'Show_Onboarding_Form',
              args: { reason: "User mới cần thu thập thông tin doanh nghiệp" },
              result: toolResult
            }
          };
        }
      }

      // Use standard Tools Agent execution
      const agentExecutor = await this.getAgentExecutor(tools, chatHistory, onboardingNotes);

      // Now just pass the user message directly without adding onboarding context
      console.log('🤖 Invoking agent with message:', message.substring(0, 100) + '...');

      // Create streaming config if callback provided
      const config = streamCallback ? {
        callbacks: [{
          handleToolStart: (tool, input, runId, parentRunId, tags) => {
            console.log('🔧 Tool started:', tool.name);
            if (streamCallback) {
              streamCallback({
                type: 'tool_start',
                toolName: tool.name,
                toolInput: input,
                timestamp: new Date().toISOString()
              });
            }
          },
          handleToolEnd: (output, runId, parentRunId, tags) => {
            console.log('✅ Tool completed:', tags);
            if (streamCallback) {
              streamCallback({
                type: 'tool_end',
                output: output,
                timestamp: new Date().toISOString()
              });
            }
          },
          handleAgentAction: (action, runId, parentRunId, tags) => {
            console.log('🤖 Agent action:', action.tool);
            if (streamCallback) {
              streamCallback({
                type: 'agent_action',
                toolName: action.tool,
                toolInput: action.toolInput,
                timestamp: new Date().toISOString()
              });
            }
          },
          handleChainStart: (chain, inputs, runId, parentRunId, tags) => {
            console.log('⚡ Chain started:', chain.lc_namespace);
          },
          handleLLMStart: (llm, prompts, runId, parentRunId, extraParams, tags) => {
            console.log('🧠 LLM started');
            if (streamCallback) {
              streamCallback({
                type: 'ai_response',
                content: 'AI đang suy nghĩ...',
                timestamp: new Date().toISOString()
              });
            }
          },
          handleLLMEnd: (output, runId, parentRunId, tags) => {
            console.log('🧠 LLM completed');
            // Stream the actual AI response content
            if (streamCallback && output && output.generations && output.generations[0] && output.generations[0][0]) {
              const aiResponse = output.generations[0][0].text || output.generations[0][0].message?.content;
              if (aiResponse) {
                streamCallback({
                  type: 'ai_response',
                  content: aiResponse,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        }]
      } : {};

      const result = await agentExecutor.invoke({
        input: message
      }, config);

      // Nếu có tool call, trả về với thông tin tool invocations
      if (result.intermediateSteps && result.intermediateSteps.length > 0) {
        // Extract tool invocations từ intermediateSteps
        const toolInvocations = result.intermediateSteps.map(step => {
          let parsedObservation = null;
          let preview = null;
          
          try {
            parsedObservation = JSON.parse(step.observation);
            // Kiểm tra nếu có preview data từ tool
            if (parsedObservation.preview) {
              preview = parsedObservation.preview;
            }
          } catch (e) {
            // Nếu observation không phải JSON, giữ nguyên
            parsedObservation = step.observation;
          }

          return {
            toolName: step.action.tool,
            toolInput: step.action.toolInput,
            toolCallId: step.action.toolCallId,
            observation: step.observation,
            parsedData: parsedObservation,
            preview: preview
          };
        });

        console.log('🔧 Tool invocations detected:', toolInvocations.map(t => `${t.toolName}: ${t.parsedData?.success ? 'SUCCESS' : 'FAILED'}`));
        
        // 🔥 LƯU TOOL RESPONSES VÀO MEMORY để agent nhớ những gì đã làm
        await this.saveToolResponsesToMemory(agentExecutor.memory, result.intermediateSteps, result.output);
        
        return {
          success: true,
          response: result.output || 'Đã xử lý thành công!',
          toolInvocations: toolInvocations
        };
      }
      // Nếu không có tool call, trả về text như cũ và lưu vào memory
      else {
        // Lưu conversation vào memory cho lần tiếp theo với structured format
        const userContext = { 
          type: 'user_message', 
          content: message, 
          timestamp: new Date().toISOString() 
        };
        const aiContext = { 
          type: 'ai_response', 
          content: result.output, 
          timestamp: new Date().toISOString() 
        };
        
        await agentExecutor.memory.chatHistory.addUserMessage(message);
        await agentExecutor.memory.chatHistory.addAIMessage(result.output);
      }
      
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
