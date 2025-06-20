"use client"

import { Bot, User } from "lucide-react"

export const BotIcon = () => (
  <Bot className="w-4 h-4 text-orange-500" />
)

export const UserIcon = () => (
  <User className="w-4 h-4 text-gray-600" />
)

export const EasyFoxIcon = () => (
  <div className="flex items-center space-x-1">
    <span className="text-orange-500 font-bold text-lg">Easy</span>
    <span className="text-red-500 font-bold text-lg">Fox</span>
  </div>
)

export const ArrowUpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <path
      d="M8 12L8 4M8 4L4 8M8 4L12 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const StopIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <rect
      x="4"
      y="4"
      width="8"
      height="8"
      rx="2"
      fill="currentColor"
    />
  </svg>
)
