"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Message } from "./message";
import { useScrollToBottom } from "../../hooks/useScrollToBottom";
import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";
import { useChat } from "../../hooks/useChat";
import LoadingSpinner from "../LoadingSpinner";

export function GeminiStyleChat() {
  const { messages, loading, sendMessage } = useChat();
  const [input, setInput] = useState("");

  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  const handleSubmit = async (event?: { preventDefault?: () => void }) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    
    await sendMessage(question);
  };

  const stop = () => {
    // Implementation for stopping the request - to be implemented when we connect to N8N
    console.log("Stop request");
  };

  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-gray-50">
      <div className="flex flex-col justify-between items-center gap-4 w-full">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-6 h-full w-full items-center overflow-y-scroll px-4"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message) => (
            <div key={message.id} className="w-full space-y-6">
              {/* User message */}
              {message.question && (
                <div className="w-full flex justify-center">
                  <Message
                    role="user"
                    content={message.question}
                  />
                </div>
              )}
              
              {/* AI response */}
              {message.ai_response && (
                <div className="w-full flex justify-center">
                  <Message
                    role="assistant"
                    content={message.ai_response}
                  />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="w-full flex justify-center">
              <motion.div
                className="flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="size-[24px] border border-gray-200 rounded-sm p-1 flex flex-col justify-center items-center shrink-0 bg-white">
                  <LoadingSpinner size="sm" />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="text-gray-600 text-sm">
                    AI đang suy nghĩ...
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        <div className="w-full px-4">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={loading}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}
