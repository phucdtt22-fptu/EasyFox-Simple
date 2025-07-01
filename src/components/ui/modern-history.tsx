"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Trash2, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

import { Button } from "./button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

interface ModernHistoryProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ModernHistory({ 
  currentSessionId, 
  onSessionSelect, 
  onNewChat 
}: ModernHistoryProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load chat sessions
  const loadChatSessions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('chat_session_id, question, ai_response, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chat sessions:', error);
        return;
      }

      // Group by session ID and create session objects
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach(msg => {
        const sessionId = msg.chat_session_id;
        if (!sessionId) return;

        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            id: sessionId,
            title: msg.question ? 
              msg.question.substring(0, 50) + (msg.question.length > 50 ? '...' : '') : 
              'Cuộc trò chuyện mới',
            lastMessage: msg.ai_response ? 
              msg.ai_response.substring(0, 100) + (msg.ai_response.length > 100 ? '...' : '') : 
              msg.question || '',
            timestamp: msg.created_at,
            messageCount: 1
          });
        } else {
          const session = sessionMap.get(sessionId)!;
          session.messageCount++;
          // Update timestamp to most recent
          if (new Date(msg.created_at) > new Date(session.timestamp)) {
            session.timestamp = msg.created_at;
          }
        }
      });

      const sessions = Array.from(sessionMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      loadChatSessions();
    }
  }, [user, isOpen, loadChatSessions]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id)
        .eq('chat_session_id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return;
      }

      // Update local state
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // If deleting current session, start new chat
      if (sessionId === currentSessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
    setDeleteId(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50 force-black-text"
      >
        <Menu size={16} />
        <span className="hidden sm:inline font-semibold">Lịch sử</span>
      </Button>

      {/* Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-gray-50">
          <SheetHeader className="p-4 pr-12 border-b border-gray-200 bg-white">
            <SheetTitle className="text-lg font-semibold text-gray-900 text-left mb-3">
              Lịch sử chat
            </SheetTitle>
            <Button
              size="sm"
              onClick={() => {
                onNewChat();
                setIsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Cuộc trò chuyện mới</span>
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              {chatSessions.length} cuộc trò chuyện
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                <MessageCircle size={24} className="mb-2" />
                <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {chatSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group bg-white rounded-lg border cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all ${
                        currentSessionId === session.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => {
                        onSessionSelect(session.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {session.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {session.lastMessage}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                              <span>{formatTimestamp(session.timestamp)}</span>
                              <span>•</span>
                              <span>{session.messageCount} tin nhắn</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation - rendered as portal to avoid z-index issues */}
      {deleteId && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Xóa cuộc trò chuyện?
                </h3>
                <p className="text-gray-500 text-sm">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={() => handleDeleteSession(deleteId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Xóa
              </Button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}
