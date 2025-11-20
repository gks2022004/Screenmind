import React, { useState, useRef, useEffect } from 'react';
import { Mic, StickyNote, Bell, Calendar, Share2, Trash2, Play, Pause, ChevronLeft, AlertCircle, Edit3, Save, Check, X, ToggleLeft, ToggleRight } from './Icons';
import { ScreenshotData } from '../types';

interface DetailViewProps {
  item: ScreenshotData;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (data: ScreenshotData) => void;
}

const DetailView: React.FC<DetailViewProps> = ({ item, onClose, onDelete, onUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(item.note || '');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setNoteText(item.note || '');
    setIsEditingNote(false);
  }, [item.id]);

  const handleDelete = () => {
    if (window.confirm('Delete permanently?')) {
      onDelete(item.id);
      onClose();
    }
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      const response = await fetch(item.imageData);
      const blob = await response.blob();
      const file = new File([blob], "screenshot.png", { type: "image/png" });
      const shareData: ShareData = { title: item.title, text: item.summary, files: [file] };
      if (navigator.canShare && navigator.canShare(shareData)) await navigator.share(shareData);
    } catch (err) { console.error('Share failed:', err); }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const toggleUrgent = () => {
    onUpdate({ ...item, isUrgent: !item.isUrgent });
  };

  const saveNote = () => {
    onUpdate({ ...item, note: noteText });
    setIsEditingNote(false);
  };

  const deleteNote = () => {
    if (window.confirm('Remove note?')) {
      onUpdate({ ...item, note: '' });
      setNoteText('');
    }
  };

  const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  });
  const reminderDate = item.reminderTime ? new Date(item.reminderTime) : null;

  return (
    <div className="fixed inset-0 z-50 bg-neo-bg dark:bg-neo-dark animate-slide-up overflow-y-auto">
      
      {/* Brutalist Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 bg-white dark:bg-black border-b-2 border-black dark:border-white">
        <button 
          onClick={onClose} 
          className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-black border-2 border-black dark:border-white shadow-neo dark:shadow-neo-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold uppercase text-sm">Back</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button onClick={handleShare} className="p-2 border-2 border-black dark:border-white bg-neo-primary text-white hover:bg-black transition-colors shadow-sm">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-2 border-2 border-black dark:border-white bg-neo-accent text-white hover:bg-black transition-colors shadow-sm">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
        
        {/* Title Section */}
        <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 shadow-neo dark:shadow-neo-white">
           <h1 className="font-display text-3xl font-black uppercase leading-none mb-2 break-words">
             {item.title}
           </h1>
           <div className="inline-flex items-center gap-2 px-2 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-mono mb-4">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
           </div>
           {item.summary && <p className="text-sm font-mono border-l-4 border-neo-yellow pl-3 py-1">{item.summary}</p>}
        </div>

        {/* Image Display */}
        <div className="border-2 border-black dark:border-white p-2 bg-white dark:bg-gray-800">
          <img 
            src={item.imageData} 
            alt={item.title} 
            className="w-full h-auto object-contain" 
          />
        </div>

        {/* Modules */}
        <div className="grid gap-4">
          
          {/* Reminder Block */}
          {reminderDate && (
            <div className={`flex items-center justify-between p-4 border-2 border-black dark:border-white ${item.isUrgent ? 'bg-neo-accent text-white' : 'bg-neo-secondary text-white'} shadow-neo-sm`}>
               <div className="flex items-center gap-3">
                  <div className="bg-black/20 p-2 rounded-sm">
                    {item.isUrgent ? <AlertCircle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest opacity-80">Target Time</div>
                    <div className="font-display font-bold text-lg leading-none mt-1">
                      {reminderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs font-mono mt-0.5">{reminderDate.toLocaleDateString()}</div>
                  </div>
               </div>
               <button onClick={toggleUrgent} className="flex flex-col items-center">
                  {item.isUrgent ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 opacity-50" />}
                  <span className="text-[10px] font-bold uppercase mt-1">{item.isUrgent ? 'URGENT' : 'NORMAL'}</span>
               </button>
            </div>
          )}

          {/* Audio Block */}
          {item.voiceNoteUrl && (
            <div className="p-4 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-neo-accent animate-pulse rounded-full"></div>
                    <span className="font-mono text-sm font-bold tracking-widest">VOICE_MEMO</span>
                  </div>
                  <button 
                    onClick={toggleAudio}
                    className="px-4 py-2 border border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors flex items-center gap-2"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="text-xs font-bold">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>
               </div>
               <audio ref={audioRef} src={item.voiceNoteUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            </div>
          )}

          {/* Note Block */}
          <div className="border-2 border-black dark:border-white bg-neo-yellow p-1">
             <div className="border border-black/20 p-4 h-full bg-white/50">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2 text-black">
                      <StickyNote className="w-5 h-5" />
                      <h3 className="font-black uppercase text-sm">Field Notes</h3>
                   </div>
                   {!isEditingNote && (
                     <div className="flex gap-1">
                        {item.note ? (
                           <>
                            <button onClick={() => setIsEditingNote(true)} className="p-1 hover:bg-black hover:text-white transition"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={deleteNote} className="p-1 hover:bg-black hover:text-white transition"><Trash2 className="w-4 h-4" /></button>
                           </>
                        ) : (
                           <button onClick={() => setIsEditingNote(true)} className="text-xs font-bold underline">+ ADD</button>
                        )}
                     </div>
                   )}
                </div>

                {isEditingNote ? (
                   <div className="space-y-2">
                      <textarea 
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full p-2 bg-white border-2 border-black text-sm font-mono focus:outline-none focus:shadow-neo"
                        rows={4}
                      />
                      <div className="flex justify-end gap-2">
                         <button onClick={() => setIsEditingNote(false)} className="px-3 py-1 text-xs font-bold uppercase border border-black hover:bg-gray-200">Cancel</button>
                         <button onClick={saveNote} className="px-3 py-1 text-xs font-bold uppercase bg-black text-white border border-black hover:bg-neo-primary">Save</button>
                      </div>
                   </div>
                ) : (
                   item.note && <p className="font-mono text-sm leading-relaxed">{item.note}</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;