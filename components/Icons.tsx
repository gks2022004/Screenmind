import React from 'react';
import { Camera, Mic, StickyNote, Bell, X, ChevronRight, Image as ImageIcon, Clock, Play, Pause, Trash2, Plus, Save, Calendar, Share2, ChevronLeft, Sun, Moon, CornerUpLeft, AlertCircle, Edit3, Check, ToggleLeft, ToggleRight, BellOff } from 'lucide-react';

export const ScreenmindLogo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 8H16V16H8V8Z" fill="currentColor" opacity="0.5" />
    <path d="M12 8V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 16V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

// Re-exporting for cleaner imports in other files
export { 
  Camera, 
  Mic, 
  StickyNote, 
  Bell, 
  X, 
  ChevronRight, 
  ImageIcon, 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Save,
  Calendar,
  Share2,
  ChevronLeft,
  Sun,
  Moon,
  CornerUpLeft,
  AlertCircle,
  Edit3,
  Check,
  ToggleLeft,
  ToggleRight,
  BellOff
};