// Tool confirmation logic for EasyFox AI
const { z } = require("zod");

// List of tools that require user confirmation
const CONFIRMATION_REQUIRED_TOOLS = [
  // Note: Tools now handle their own confirmation logic internally
  // via the confirmationReceived parameter. This list is kept for 
  // backward compatibility but tools manage confirmation themselves.
];

// Check if a tool requires confirmation
function requiresConfirmation(toolName) {
  return CONFIRMATION_REQUIRED_TOOLS.includes(toolName);
}

// Create a pending tool call response
function createPendingToolResponse(toolName, toolInput, preview) {
  return {
    success: true,
    isPending: true,
    toolCall: {
      name: toolName,
      input: toolInput,
      preview: preview
    },
    message: "Tool call đang chờ xác nhận từ người dùng"
  };
}

// Execute a confirmed tool call
async function executeConfirmedTool(toolName, toolInput, tools) {
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }
  
  return await tool.func(toolInput);
}

module.exports = {
  requiresConfirmation,
  createPendingToolResponse,
  executeConfirmedTool
};
