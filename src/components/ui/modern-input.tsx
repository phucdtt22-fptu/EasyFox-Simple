"use client";

import { Attachment } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import React, { useRef, useEffect, Dispatch, SetStateAction } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";

import { Button } from "./button";
import { Textarea } from "./textarea";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt?: Date;
}

interface ModernInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  isLoading: boolean;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Message[];
  suggestedActions?: string[];
  onSuggestedAction?: (action: string) => void;
}

export function ModernInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  attachments,
  setAttachments,
  messages,
  suggestedActions = [],
  onSuggestedAction
}: ModernInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [input]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && input.trim()) {
        handleSubmit();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // Handle file upload logic here
    console.log("Files selected:", files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Suggested Actions for empty chat */}
      <AnimatePresence>
        {messages.length === 0 && suggestedActions.length > 0 && onSuggestedAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            {suggestedActions.slice(0, 4).map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => onSuggestedAction(action)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
              >
                <div className="font-medium text-gray-900 text-sm group-hover:text-orange-600">
                  {action}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2">
              <Paperclip size={14} className="text-gray-500" />
              <span className="text-sm text-gray-700 truncate max-w-32">
                {attachment.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
        <div className="flex items-end gap-2 p-3">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
            disabled={isLoading}
          >
            <Paperclip size={18} />
          </button>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn của bạn..."
            className="flex-1 min-h-[20px] max-h-[120px] resize-none border-none bg-transparent focus:ring-0 focus:border-none p-0 text-base placeholder:text-gray-400"
            disabled={isLoading}
          />

          {/* Send Button */}
          <Button
            type="submit"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Typing Indicator */}
      {input.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {input.length}/2000 ký tự
        </div>
      )}
    </div>
  );
}
