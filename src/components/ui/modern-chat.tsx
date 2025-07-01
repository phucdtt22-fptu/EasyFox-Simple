"use client";

import { Attachment } from "ai";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ModernMessage } from "./modern-message";
import { ModernInput } from "./modern-input";
import { ModernOverview } from "./modern-overview";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { OnboardingFormData, ToolInvocation } from "@/types";



// UI message type for rendering
export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
  customToolInvocations?: ToolInvocation[];
}

export type ModernChatProps = {
  initialMessages: DisplayMessage[];
  suggestedActions: string[];
  onSendMessage?: (message: string) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
  onOnboardingSubmit?: (data: OnboardingFormData) => void;
  onOnboardingSkip?: () => void;
  onOnboardingConfirm?: () => void;
  onOnboardingEdit?: () => void;
};

export function ModernChat({
  initialMessages,
  suggestedActions,
  onSendMessage,
  loading = false,
  onOnboardingSubmit,
  onOnboardingSkip,
  onOnboardingConfirm,
  onOnboardingEdit
}: ModernChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>([messages]);

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSubmit = async (event?: { preventDefault?: () => void }) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    
    if (!input.trim() || isLoading || !onSendMessage) return;
    
    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message immediately to UI
    const userMessage: DisplayMessage = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: messageText,
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await onSendMessage(messageText);
      
      if (result.success) {
        // The messages will be updated via useEffect when initialMessages changes
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        console.error("Error sending message:", result.error);
      }
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedAction = async (action: string) => {
    if (!onSendMessage) return;
    
    setInput(action);
    // Trigger submit after a brief delay to show the input
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && (
            <ModernOverview
              key="overview"
              suggestedActions={suggestedActions}
              onSuggestedAction={handleSuggestedAction}
            />
          )}

          {messages.map((message, index) => (
            <ModernMessage
              key={message.id || `message-${index}`}
              message={{
                ...message,
                role: message.role,
                content: message.content,
                id: message.id,
                createdAt: message.createdAt
              }}
              isLast={index === messages.length - 1}
              onSuggestionClick={handleSuggestedAction}
              suggestions={index === messages.length - 1 ? suggestedActions : []}
              loadingSuggestions={loading}
              toolInvocations={message.customToolInvocations || []}
              onOnboardingSubmit={onOnboardingSubmit}
              onOnboardingSkip={onOnboardingSkip}
              onOnboardingConfirm={onOnboardingConfirm}
              onOnboardingEdit={onOnboardingEdit}
            />
          ))}

          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3 px-4"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-medium">
                AI
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ModernInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading || loading}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            suggestedActions={[]}
            onSuggestedAction={handleSuggestedAction}
          />
        </div>
      </div>
    </div>
  );
}
