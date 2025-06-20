"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, Plus, BookOpen, LogOut, Settings } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../hooks/useChat";
import ChatHistory from "../ChatHistory";
import { GeminiStyleChat } from "./gemini-style-chat";

export function ModernChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clearChat, switchToSession } = useChat();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        className={`${
          sidebarOpen ? "w-80" : "w-16"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm`}
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 64 }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            {sidebarOpen && (
              <button
                onClick={clearChat}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                title="Tạo chat mới"
              >
                <Plus className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">Chat mới</span>
              </button>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-4">
              <h2 className="text-xl font-bold">
                <span className="text-orange-500">Easy</span>
                <span className="text-red-500">Fox</span>
              </h2>
              <p className="text-gray-500 text-sm">Trợ lý AI Marketing</p>
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          {sidebarOpen ? (
            <div className="p-2">
              <ChatHistory
                onSessionSelect={(sessionId) => {
                  switchToSession(sessionId);
                }}
                isModal={false}
              />
            </div>
          ) : (
            <div className="p-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full p-3 hover:bg-gray-100 rounded-lg transition-colors text-center"
                title="Xem lịch sử chat"
              >
                <BookOpen className="w-5 h-5 mx-auto text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {user?.user_metadata?.name || user?.email}
              </div>
              <div className="flex space-x-2">
                <button
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-600 flex-1"
                  title="Cài đặt"
                >
                  <Settings className="w-4 h-4" />
                  <span>Cài đặt</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-red-600"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors text-center"
                title="Cài đặt"
              >
                <Settings className="w-5 h-5 mx-auto text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors text-center"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5 mx-auto text-red-600" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1">
        <GeminiStyleChat />
      </div>
    </div>
  );
}
