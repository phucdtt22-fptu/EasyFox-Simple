"use client"

import { 
  Bot, 
  User, 
  Menu, 
  Plus, 
  Send, 
  ArrowUp, 
  StopCircle, 
  Paperclip,
  Copy,
  Check,
  MoreHorizontal,
  Trash,
  PenTool,
  Info,
  Calendar,
  Target,
  DollarSign,
  Users,
  BarChart3,
  Lightbulb,
  MessageSquare,
  Settings,
  X
} from "lucide-react"

// User and Bot icons for chat
export const UserIcon = () => <User className="w-4 h-4 text-gray-600" />
export const BotIcon = () => <Bot className="w-4 h-4 text-orange-500" />

// Navigation icons
export const MenuIcon = () => <Menu className="w-5 h-5" />
export const PlusIcon = () => <Plus className="w-4 h-4" />
export const XIcon = () => <X className="w-5 h-5" />

// Chat input icons
export const SendIcon = () => <Send className="w-4 h-4" />
export const ArrowUpIcon = ({ size }: { size?: number }) => <ArrowUp className={`w-${size || 4} h-${size || 4}`} />
export const StopIcon = ({ size }: { size?: number }) => <StopCircle className={`w-${size || 4} h-${size || 4}`} />
export const PaperclipIcon = ({ size }: { size?: number }) => <Paperclip className={`w-${size || 4} h-${size || 4}`} />

// Action icons
export const CopyIcon = () => <Copy className="w-4 h-4" />
export const CheckIcon = () => <Check className="w-4 h-4" />
export const MoreHorizontalIcon = () => <MoreHorizontal className="w-4 h-4" />
export const TrashIcon = () => <Trash className="w-4 h-4" />
export const PencilEditIcon = ({ size }: { size?: number }) => <PenTool className={`w-${size || 4} h-${size || 4}`} />
export const InfoIcon = () => <Info className="w-4 h-4" />

// Marketing specific icons
export const CalendarIcon = () => <Calendar className="w-4 h-4" />
export const TargetIcon = () => <Target className="w-4 h-4" />
export const DollarSignIcon = () => <DollarSign className="w-4 h-4" />
export const UsersIcon = () => <Users className="w-4 h-4" />
export const BarChart3Icon = () => <BarChart3 className="w-4 h-4" />
export const LightbulbIcon = () => <Lightbulb className="w-4 h-4" />
export const MessageSquareIcon = () => <MessageSquare className="w-4 h-4" />
export const SettingsIcon = () => <Settings className="w-4 h-4" />

// EasyFox Logo component
export const EasyFoxIcon = () => (
  <div className="flex items-center space-x-1">
    <span className="text-orange-500 font-bold text-lg">Easy</span>
    <span className="text-red-500 font-bold text-lg">Fox</span>
  </div>
)
