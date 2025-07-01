"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { Button } from "./button";
import { ModernHistory } from "./modern-history";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface ModernLayoutProps {
  children: ReactNode;
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewChat?: () => void;
}

export function ModernLayout({ 
  children, 
  currentSessionId, 
  onSessionSelect,
  onNewChat
}: ModernLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo & History */}
            <div className="flex items-center gap-4">
              {user && onSessionSelect && onNewChat && (
                <ModernHistory
                  currentSessionId={currentSessionId}
                  onSessionSelect={onSessionSelect}
                  onNewChat={onNewChat}
                />
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">EasyFox</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Marketing AI Platform</p>
                </div>
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 hover:bg-orange-50 border-orange-200 user-button"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <User size={14} className="text-white" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">
                        {user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={handleProfileClick}
                      className="dropdown-menu-item cursor-pointer"
                    >
                      <User size={16} className="mr-2" />
                      Thông tin cá nhân
                    </DropdownMenuItem>
                    <DropdownMenuItem className="dropdown-menu-item cursor-pointer">
                      <Settings size={16} className="mr-2" />
                      Cài đặt
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <LogOut size={16} className="mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <a href="/login">Sign in</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-[calc(100vh-4rem)]"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
