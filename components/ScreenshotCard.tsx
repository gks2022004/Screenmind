import React, { useState } from 'react';
import { ScreenshotData } from '../types';
import { Clock, StickyNote, Play, Pause, Share2, Trash2, Edit3, Check, X } from './Icons';

interface ScreenshotCardProps {
  item: ScreenshotData;
  onDelete: (id: string) => void;
  onClick: (item: ScreenshotData) => void;
  onUpdate: (data: ScreenshotData) => void;
}

const ScreenshotCard: React.FC<ScreenshotCardProps> = ({ item, onDelete, onClick, onUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.voiceNoteUrl) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this capture?')) {
      onDelete(item.id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.share) return;
    try {
      const response = await fetch(item.imageData);
      const blob = await response.blob();
      const file = new File([blob], "screenshot.png", { type: "image/png" });
      const shareData: ShareData = { title: item.title, text: item.summary, files: [file] };
      if (navigator.canShare && navigator.canShare(shareData)) await navigator.share(shareData);
    } catch (err) {
      console.log('Share cancelled');
    }
  };

  const handleEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleSaveTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim()) {
      onUpdate({ ...item, title: editedTitle.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(item.title);
    setIsEditingTitle(false);
  };

  const formattedDate = new Date(item.timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });

  const reminderDate = item.reminderTime ? new Date(item.reminderTime) : null;
  const isReminderOverdue = reminderDate ? reminderDate.getTime() < Date.now() : false;

  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-neo dark:shadow-neo-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] dark:hover:shadow-none transition-all duration-200 cursor-pointer mb-2 p-3 flex gap-4"
    >
      {/* Thumbnail with bold border */}
      <div className="w-24 h-24 shrink-0 border-2 border-black dark:border-white bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img 
          src={item.imageData} 
          alt={item.title} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
        <div>
          <div className="flex justify-between items-start mb-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 px-2 py-0.5 bg-white dark:bg-gray-800 border border-black dark:border-white font-display font-bold text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle(e as any);
                    if (e.key === 'Escape') handleCancelEdit(e as any);
                  }}
                />
                <button onClick={handleSaveTitle} className="p-0.5 bg-neo-secondary text-white border border-black">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={handleCancelEdit} className="p-0.5 bg-gray-300 border border-black">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 flex-1 group/title">
                <h3 className="font-display font-bold text-lg leading-tight truncate pr-2 text-black dark:text-white">
                  {item.title || 'Untitled'}
                </h3>
                <button 
                  onClick={handleEditTitle}
                  className="opacity-0 group-hover/title:opacity-100 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-opacity"
                  title="Edit title"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
            <span className="inline-block px-1.5 py-0.5 border border-black dark:border-white text-[10px] font-bold uppercase bg-neo-yellow text-black shrink-0">
              {formattedDate}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 font-mono">
            {item.summary || "No description provided."}
          </p>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-end justify-between mt-1">
          {/* Badges */}
          <div className="flex items-center gap-2">
            {item.note && (
              <div className="w-6 h-6 border border-black dark:border-white bg-neo-primary text-white flex items-center justify-center">
                <StickyNote className="w-3 h-3" />
              </div>
            )}
            
            {item.reminderTime && (
              <div className={`w-6 h-6 border border-black dark:border-white flex items-center justify-center ${isReminderOverdue ? 'bg-neo-accent text-white animate-pulse' : 'bg-neo-secondary text-white'}`}>
                <Clock className="w-3 h-3" />
              </div>
            )}

            {item.voiceNoteUrl && (
               <button 
                 onClick={handlePlayAudio}
                 className="h-6 px-2 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center gap-1 hover:bg-gray-800 dark:hover:bg-gray-200"
               >
                 {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                 <span className="text-[9px] font-bold font-mono">AUDIO</span>
               </button>
            )}
          </div>

          {/* Icon Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={handleShare} className="p-1 hover:bg-neo-primary hover:text-white border border-transparent hover:border-black transition-colors rounded-sm">
               <Share2 className="w-4 h-4" />
             </button>
             <button onClick={handleDelete} className="p-1 hover:bg-neo-accent hover:text-white border border-transparent hover:border-black transition-colors rounded-sm">
               <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      {item.voiceNoteUrl && (
        <audio ref={audioRef} src={item.voiceNoteUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
      )}
    </div>
  );
};

export default ScreenshotCard;