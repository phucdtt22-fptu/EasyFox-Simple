// Helper: map tool args to CampaignFormData (backend → frontend)

"use client";

// Helper: map tool args to CampaignFormData (backend → frontend)
import type { CampaignFormData } from "@/components/campaign/CampaignForm";
// Accepts any object with possible campaign fields (from backend tool call)
type CampaignArgs = Partial<{
  campaign_name: string;
  name: string;
  goals: string;
  objective: string;
  startDate: string;
  start_date: string;
  endDate: string;
  end_date: string;
  budget: string | number;
  notes: string;
}>;

function mapCampaignArgsToFormData(args: CampaignArgs): Partial<CampaignFormData> {
  if (!args) return {};
  // Map backend fields to frontend fields
  return {
    name: args.campaign_name || args.name || "",
    objective: args.goals || args.objective || "",
    startDate: args.startDate || args.start_date || "",
    endDate: args.endDate || args.end_date || "",
    budget: typeof args.budget === "number" ? String(args.budget) : (args.budget || ""),
    notes: args.notes || ""
  };
}

import { Message } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { User, Bot, Lightbulb, Send } from "lucide-react";

import { MarkdownRenderer } from "./markdown-renderer";
import { ToolInvocation, OnboardingFormData } from "@/types";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { OnboardingDataTable } from "@/components/onboarding/OnboardingDataTable";
import { CampaignForm } from "@/components/campaign/CampaignForm";

interface Suggestion {
  id: string;
  text: string;
  category?: string;
}

interface ModernMessageProps {
  message: Message;
  isLast?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  suggestions?: string[];
  loadingSuggestions?: boolean;
  toolInvocations?: ToolInvocation[];
  onOnboardingSubmit?: (data: OnboardingFormData) => void;
  onOnboardingSkip?: () => void;
  onOnboardingConfirm?: () => void;
  onOnboardingEdit?: () => void;
}

export function ModernMessage({ 
  message, 
  isLast, 
  onSuggestionClick, 
  suggestions: propSuggestions = [],
  loadingSuggestions: propLoadingSuggestions = false,
  toolInvocations = [],
  onOnboardingSubmit,
  onOnboardingSkip,
  onOnboardingConfirm,
  onOnboardingEdit
}: ModernMessageProps) {
  const { role, content } = message;
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  // Nếu có toolInvocations, KHÔNG render content (ẩn dòng TOOL_CALL...)
  const shouldHideContent = isAssistant && toolInvocations && toolInvocations.length > 0;
  // DEBUG: Log toolInvocations for troubleshooting
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[ModernMessage] toolInvocations:', JSON.stringify(toolInvocations, null, 2));
  }

  // Convert propSuggestions to local format for display
  const suggestions = propSuggestions.map((suggestion, index) => ({
    id: `suggestion-${index}`,
    text: suggestion,
    category: 'general',
  }));

  const loadingSuggestions = propLoadingSuggestions;

  const handleSuggestionClick = (suggestionText: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestionText);
    }
  };

  // Parse user message to separate business info and user message
  const parseUserContent = (content: string) => {
    const businessInfoPattern = /\[THÔNG TIN DOANH NGHIỆP\]\s*([\s\S]*?)\s*\[TIN NHẮN NGƯỜI DÙNG\]\s*([\s\S]*)/;
    const match = content.match(businessInfoPattern);
    
    if (match) {
      return {
        businessInfo: match[1].trim(),
        userMessage: match[2].trim()
      };
    }
    
    return {
      businessInfo: null,
      userMessage: content
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 max-w-4xl mx-auto ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser 
          ? "bg-gray-100 border border-gray-200" 
          : "bg-gradient-to-br from-orange-500 to-red-500 text-white"
      }`}>
        {isUser ? (
          <User size={16} className="text-gray-600" />
        ) : (
          <Bot size={16} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : "text-left"}`}> 
        {!shouldHideContent && (
          <div className={`inline-block max-w-full ${
            isUser 
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl rounded-tr-md px-4 py-3"
              : "bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3"
          }`}>
            {typeof content === "string" ? (
              isUser ? (
                (() => {
                  const { businessInfo, userMessage } = parseUserContent(content);
                  return (
                    <div className="space-y-3">
                      {businessInfo && (
                        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                          <div className="text-white/90 text-xs font-medium mb-2 flex items-center gap-1">
                            <span>📋</span>
                            THÔNG TIN DOANH NGHIỆP
                          </div>
                          <div className="text-white prose prose-sm max-w-none [&>*]:text-white [&>strong]:!text-white [&>em]:text-white [&>h1]:text-white [&>h2]:text-white [&>h3]:text-white [&>h4]:text-white [&>h5]:text-white [&>h6]:text-white [&>p]:text-white [&>ul]:text-white [&>ol]:text-white [&>li]:text-white [&>blockquote]:text-white [&>code]:text-white [&_table]:border-white/20 [&_th]:border-white/20 [&_td]:border-white/20 [&_th]:text-white [&_td]:text-white [&_table]:text-white [&>b]:!text-white [&_strong]:!text-white [&_b]:!text-white">
                            <MarkdownRenderer content={businessInfo} />
                          </div>
                        </div>
                      )}
                      <div className="text-white prose prose-sm max-w-none [&>*]:text-white [&>strong]:!text-white [&>em]:text-white [&>h1]:text-white [&>h2]:text-white [&>h3]:text-white [&>h4]:text-white [&>h5]:text-white [&>h6]:text-white [&>p]:text-white [&>ul]:text-white [&>ol]:text-white [&>li]:text-white [&>blockquote]:text-white [&>code]:text-white [&_table]:border-white/20 [&_th]:border-white/20 [&_td]:border-white/20 [&_th]:text-white [&_td]:text-white [&_table]:text-white [&>b]:!text-white [&_strong]:!text-white [&_b]:!text-white">
                        <MarkdownRenderer content={userMessage} />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-gray-800 prose prose-sm max-w-none">
                  <MarkdownRenderer content={content} />
                </div>
              )
            ) : (
              <div className="text-gray-800">
                {content as ReactNode}
              </div>
            )}
          </div>
        )}

        {/* Tool Invocations */}
        {isAssistant && toolInvocations && toolInvocations.length > 0 && (
          <div className="mt-4 space-y-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolCallId, toolName, result, args } = toolInvocation;
              if (toolName === "showOnboardingForm" || toolName === "Show_Onboarding_Form") {
                return (
                  <div key={toolCallId} className="my-4">
                    <OnboardingForm
                      onSubmit={onOnboardingSubmit || (() => {})}
                      onSkip={onOnboardingSkip || (() => {})}
                    />
                  </div>
                );
              } else if (toolName === "Show_Campaign_Form" || toolName === "showCampaignForm") {
                return (
                  <div key={toolCallId} className="my-4">
                    <CampaignForm
                      onSubmit={(data: CampaignFormData) => {
                        // TODO: Gửi dữ liệu campaign về backend qua API hoặc callback
                        if (window && window.alert) window.alert("Đã gửi dữ liệu chiến dịch: " + JSON.stringify(data));
                      }}
                      initialData={mapCampaignArgsToFormData(args)}
                    />
                  </div>
                );
              } else if (toolName === "showOnboardingData") {
                return (
                  <div key={toolCallId}>
                    <OnboardingDataTable
                      data={result as OnboardingFormData}
                      onConfirm={() => onOnboardingConfirm?.()}
                      onEdit={onOnboardingEdit || (() => {})}
                    />
                  </div>
                );
              } else if (toolName === "saveOnboardingData" || toolName === "Add_Onboarding_Data") {
                return (
                  <div key={toolCallId} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <span className="text-lg">✅</span>
                      <span className="font-medium">Đã lưu thông tin doanh nghiệp thành công!</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">
                      Thông tin của bạn đã được cập nhật vào hệ thống. Tôi sẽ sử dụng thông tin này để hỗ trợ bạn tốt hơn.
                    </p>
                  </div>
                );
              } else {
                return null;
              }
            })}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-gray-600 mt-1 ${isUser ? "text-right" : "text-left"}`}>
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          }) : ''}
        </div>

        {/* Suggestions - Only for assistant messages and last message */}
        {isAssistant && isLast && (
          <div className="mt-3">
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Lightbulb size={14} className="animate-pulse" />
                <span>Đang tạo gợi ý...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Lightbulb size={14} className="text-orange-500" />
                  <span className="font-medium">Gợi ý tiếp theo:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion: Suggestion) => (
                    <motion.button
                      key={suggestion.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 text-sm rounded-lg transition-all duration-200 group"
                    >
                      <span>{suggestion.text}</span>
                      <Send size={12} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}
