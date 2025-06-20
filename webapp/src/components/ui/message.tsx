"use client";

import { motion } from "framer-motion";
import React from "react";

import { BotIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";

export const Message = ({
  role,
  content,
}: {
  role: string;
  content: string;
}) => {
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border border-gray-200 rounded-sm p-1 flex flex-col justify-center items-center shrink-0 bg-white">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {content && (
          <div className="text-gray-800 flex flex-col gap-4">
            {role === "user" ? (
              <p className="text-gray-900">{content}</p>
            ) : (
              <Markdown>{content}</Markdown>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
