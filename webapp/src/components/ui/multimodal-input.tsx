"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

import { ArrowUpIcon, StopIcon } from "./icons";
import { Textarea } from "./textarea";
import { Button } from "./button";
import useWindowSize from "../../hooks/useWindowSize";

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  handleSubmit,
}: {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    handleSubmit();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [handleSubmit, width]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (input.trim() && !isLoading) {
        submitForm();
      }
    }
  };

  return (
    <motion.div
      key="input"
      className="w-full md:max-w-[500px] max-w-[calc(100dvw-32px)] mx-auto"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
    >
      <div className="relative flex items-end gap-2 p-2 border border-gray-200 rounded-2xl bg-white shadow-sm focus-within:border-orange-300 focus-within:shadow-md transition-all">
        <Textarea
          ref={textareaRef}
          placeholder="Nhập tin nhắn của bạn..."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[24px] max-h-[200px] px-2 py-1 border-0 resize-none focus-visible:ring-0 bg-transparent text-gray-900 placeholder:text-gray-500"
          rows={1}
          disabled={isLoading}
        />
        
        <Button
          type="submit"
          size="sm"
          onClick={(event) => {
            event.preventDefault();
            if (!isLoading && input.trim()) {
              submitForm();
            } else if (isLoading) {
              stop();
            }
          }}
          disabled={!input.trim() && !isLoading}
          className={`
            shrink-0 size-8 p-1.5 rounded-full transition-all
            ${
              !input.trim() && !isLoading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isLoading
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            }
          `}
        >
          {isLoading ? <StopIcon /> : <ArrowUpIcon />}
        </Button>
      </div>
    </motion.div>
  );
}
