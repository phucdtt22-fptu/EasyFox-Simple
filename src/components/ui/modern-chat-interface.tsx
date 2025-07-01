"use client";

import { useChat } from "@/hooks/useChat";
import { ModernLayout } from "./modern-layout";
import { ModernChat } from "./modern-chat";

export function ModernChatInterface() {
  const {
    messages,
    loading,
    chatSessionId,
    suggestedActions,
    sendMessage,
    clearChat,
    switchToSession,
    handleOnboardingSubmit,
    handleOnboardingSkip,
    handleOnboardingConfirm,
    handleOnboardingEdit,
  } = useChat();

  const handleSendMessage = async (message: string) => {
    return await sendMessage(message);
  };

  const handleNewChat = async () => {
    await clearChat();
  };

  const handleSessionSelect = async (sessionId: string) => {
    await switchToSession(sessionId);
  };

  // Convert messages to format expected by ModernChat
  // Map messages to DisplayMessage[], ensuring correct type for customToolInvocations
  const expandedMessages = messages.flatMap((msg) => {
    const msgs = [];
    if (msg.question) {
      msgs.push({
        id: `${msg.id}-q`,
        role: "user" as const,
        content: msg.question,
        createdAt: new Date(msg.created_at),
      });
    }
    if (msg.ai_response) {
      // Support ChatMessageWithTools, ensure correct type for customToolInvocations
      const toolInvocations = (msg as { toolInvocations?: unknown[] }).toolInvocations;
      msgs.push({
        id: `${msg.id}-a`,
        role: "assistant" as const,
        content: msg.ai_response,
        createdAt: new Date(msg.created_at),
        customToolInvocations: Array.isArray(toolInvocations)
          ? (toolInvocations as import("@/types").ToolInvocation[])
          : [],
      });
    }
    return msgs;
  });

  return (
    <ModernLayout
      currentSessionId={chatSessionId || undefined}
      onSessionSelect={handleSessionSelect}
      onNewChat={handleNewChat}
    >
      <ModernChat
        initialMessages={expandedMessages}
        suggestedActions={suggestedActions}
        onSendMessage={handleSendMessage}
        loading={loading}
        onOnboardingSubmit={handleOnboardingSubmit}
        onOnboardingSkip={handleOnboardingSkip}
        onOnboardingConfirm={handleOnboardingConfirm}
        onOnboardingEdit={handleOnboardingEdit}
      />
    </ModernLayout>
  );
}
