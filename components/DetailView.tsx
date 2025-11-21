import React, { useState, useRef, useEffect } from 'react';
import { Mic, StickyNote, Bell, Calendar, Share2, Trash2, Play, Pause, ChevronLeft, AlertCircle, Edit3, Save, Check, X, ToggleLeft, ToggleRight, Clock, BellOff } from './Icons';
import { ScreenshotData } from '../types';

interface DetailViewProps {
  item: ScreenshotData;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (data: ScreenshotData) => void;
}

const DetailView: React.FC<DetailViewProps> = ({ item, onClose, onDelete, onUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Title State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(item.title);
  
  // Note State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(item.note || '');
  
  // Reminder State
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [isConfirmingOff, setIsConfirmingOff] = useState(false); // UI State for turning off alarm

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDeletingAudio, setIsDeletingAudio] = useState(false); // UI State for deletion confirmation
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null); // Ref for date input

  useEffect(() => {
    setTitleText(item.title);
    setNoteText(item.note || '');
    setIsEditingTitle(false);
    setIsEditingNote(false);
    setIsEditingReminder(false);
    setIsDeletingAudio(false);
    setIsConfirmingOff(false);
    
    // FIX: Safety check to prevent RangeError: Invalid time value
    if (item.reminderTime && !isNaN(item.reminderTime)) {
      try {
        const date = new Date(item.reminderTime);
        if (!isNaN(date.getTime())) {
           // Adjust for local timezone for the input
           const offset = date.getTimezoneOffset() * 60000;
           const localDate = new Date(date.getTime() - offset);
           setReminderTime(localDate.toISOString().slice(0, 16));
        } else {
           setReminderTime('');
        }
      } catch (e) {
        console.error("Date parse error", e);
        setReminderTime('');
      }
    } else {
      setReminderTime('');
    }
  }, [item.id, item.reminderTime]);

  // --- ACTIONS ---

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

  const toggleUrgent = () => {
    onUpdate({ ...item, isUrgent: !item.isUrgent });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // --- TITLE LOGIC ---

  const saveTitle = () => {
    if (titleText.trim()) {
      onUpdate({ ...item, title: titleText.trim() });
      setIsEditingTitle(false);
    }
  };

  const cancelTitleEdit = () => {
    setTitleText(item.title);
    setIsEditingTitle(false);
  };

  // --- NOTE LOGIC ---

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

  // --- REMINDER LOGIC ---

  const saveReminder = () => {
    if (!reminderTime) return;
    const timestamp = new Date(reminderTime).getTime();
    // FIX: Prevent saving NaN timestamps
    if (isNaN(timestamp)) return;

    onUpdate({ 
      ...item, 
      reminderTime: timestamp,
      reminderAcknowledged: false 
    });
    setIsEditingReminder(false);
  };

  const clearReminder = () => {
    onUpdate({ ...item, reminderTime: undefined, isUrgent: false });
    setReminderTime('');
    setIsEditingReminder(false);
    setIsConfirmingOff(false);
  };

  // --- AUDIO LOGIC ---

  const toggleAudio = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const confirmDeleteAudio = () => {
    onUpdate({ ...item, voiceNoteUrl: undefined });
    setIsDeletingAudio(false);
    setIsPlaying(false);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const base64Audio = await blobToBase64(blob);
        onUpdate({ ...item, voiceNoteUrl: base64Audio });
        setIsRecording(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- RENDER HELPERS ---

  const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  });
  
  // FIX: Safe derived date
  let reminderDate: Date | null = null;
  if (item.reminderTime && !isNaN(item.reminderTime)) {
    const d = new Date(item.reminderTime);
    if (!isNaN(d.getTime())) reminderDate = d;
  }

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
        <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 shadow-neo dark:shadow-neo-white relative">
           {isEditingTitle ? (
             <div className="flex items-center gap-2 mb-2">
               <input
                 type="text"
                 value={titleText}
                 onChange={(e) => setTitleText(e.target.value)}
                 className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white font-display font-black uppercase text-2xl focus:outline-none focus:shadow-neo dark:focus:shadow-neo-white"
                 autoFocus
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') saveTitle();
                   if (e.key === 'Escape') cancelTitleEdit();
                 }}
               />
               <button onClick={saveTitle} className="p-2 bg-neo-secondary text-white border-2 border-black hover:bg-green-600">
                 <Check className="w-5 h-5" />
               </button>
               <button onClick={cancelTitleEdit} className="p-2 bg-gray-300 border-2 border-black hover:bg-gray-400">
                 <X className="w-5 h-5" />
               </button>
             </div>
           ) : (
             <div className="flex items-center gap-2 mb-2">
               <h1 className="font-display text-3xl font-black uppercase leading-none break-words flex-1">
                 {item.title}
               </h1>
               <button 
                 onClick={() => setIsEditingTitle(true)}
                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                 title="Edit title"
               >
                 <Edit3 className="w-5 h-5" />
               </button>
             </div>
           )}
           
           <div className="flex flex-wrap items-center gap-2 mb-4">
             <div className="inline-flex items-center gap-2 px-2 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-mono">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
             </div>

             {/* Visual Indicator for Reminder */}
             {reminderDate && (
               <div className={`inline-flex items-center gap-1 px-2 py-1 border border-black dark:border-white text-[10px] font-bold uppercase tracking-wider ${item.isUrgent ? 'bg-neo-accent text-white' : 'bg-neo-secondary text-white'}`}>
                 <Bell className="w-3 h-3 fill-current" />
                 <span>{item.isUrgent ? 'Urgent' : 'Alarm Set'}</span>
               </div>
             )}
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
          <div className={`border-2 border-black dark:border-white shadow-neo-sm transition-colors ${reminderDate && !isEditingReminder ? (item.isUrgent ? 'bg-neo-accent text-white' : 'bg-neo-secondary text-white') : 'bg-white dark:bg-gray-900 text-black dark:text-white'}`}>
            
            {isEditingReminder ? (
              <div className="p-4">
                 <div className="flex items-center justify-between mb-3">
                    <span className="font-black uppercase text-sm flex items-center gap-2"><Clock className="w-4 h-4"/> Set Alarm</span>
                    <button onClick={() => setIsEditingReminder(false)}><X className="w-5 h-5" /></button>
                 </div>
                 <div className="relative mb-4">
                   <input 
                     ref={dateInputRef}
                     type="datetime-local"
                     value={reminderTime}
                     min={getMinDateTime()}
                     onChange={(e) => setReminderTime(e.target.value)}
                     onClick={(e) => {
                        // FIX: Reliably open picker on click
                        try {
                           if (typeof e.currentTarget.showPicker === 'function') {
                              e.currentTarget.showPicker();
                           } else {
                              e.currentTarget.focus();
                           }
                        } catch(err) {
                           console.warn('Picker open failed', err);
                        }
                     }}
                     className="w-full p-2 pr-10 border-2 border-black text-black font-mono text-lg bg-white dark:bg-gray-100 appearance-none dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer rounded-none"
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                      <Calendar className="w-5 h-5" />
                   </div>
                 </div>
                 
                 <div className="flex gap-2">
                   <button onClick={saveReminder} className="flex-1 bg-black text-white py-2 font-bold uppercase border-2 border-transparent hover:bg-neo-primary hover:border-black transition-all">Save</button>
                   {reminderDate && (
                     <button onClick={clearReminder} className="px-4 border-2 border-black py-2 font-bold uppercase hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors">Clear</button>
                   )}
                 </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-sm border-2 ${reminderDate ? 'border-transparent bg-black/20' : 'border-black dark:border-white bg-transparent'}`}>
                      {item.isUrgent ? <AlertCircle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest opacity-80">
                        {reminderDate ? 'Target Time' : 'No Alarm Set'}
                      </div>
                      {reminderDate ? (
                        <>
                          <div className="font-display font-bold text-lg leading-none mt-1">
                            {reminderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="text-xs font-mono mt-0.5 opacity-80">{reminderDate.toLocaleDateString()}</div>
                        </>
                      ) : (
                        <button onClick={() => setIsEditingReminder(true)} className="text-sm font-bold underline mt-1 hover:text-neo-primary">
                          + Add Reminder
                        </button>
                      )}
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-end gap-2">
                   {reminderDate && (
                     <div className="flex items-center gap-2">
                        {isConfirmingOff ? (
                          <div className="flex gap-2 mr-2 animate-slide-up">
                             <button 
                                onClick={clearReminder}
                                className="px-2 py-1 bg-white text-black font-bold text-[10px] uppercase border-2 border-transparent rounded hover:bg-red-100"
                             >
                               Confirm
                             </button>
                             <button 
                                onClick={() => setIsConfirmingOff(false)}
                                className="px-2 py-1 border-2 border-white/50 text-[10px] font-bold uppercase rounded hover:bg-white/20"
                             >
                               Cancel
                             </button>
                          </div>
                        ) : (
                          <>
                            <button onClick={toggleUrgent} className="flex flex-col items-center mr-2" title="Toggle Urgency">
                                {item.isUrgent ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 opacity-50" />}
                                <span className="text-[8px] font-bold uppercase mt-1">{item.isUrgent ? 'URGENT' : 'NORMAL'}</span>
                            </button>
                            <button onClick={() => setIsEditingReminder(true)} className="p-2 hover:bg-black/10 rounded-full transition" title="Edit Time">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setIsConfirmingOff(true)}
                              className="p-2 hover:bg-black/10 rounded-full transition text-white/80 hover:text-white" 
                              title="Turn Off Alarm"
                            >
                              <BellOff className="w-4 h-4" />
                            </button>
                          </>
                        )}
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>

          {/* Audio Block - Record/Update */}
          <div className="p-4 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black relative overflow-hidden">
             {isRecording && <div className="absolute top-0 left-0 w-full h-1 bg-neo-accent animate-pulse"></div>}
             
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <div className="w-3 h-3 bg-neo-accent animate-pulse rounded-full"></div>
                  ) : (
                    <Mic className={`w-5 h-5 ${item.voiceNoteUrl ? 'text-neo-primary' : 'text-gray-400'}`} />
                  )}
                  <span className="font-mono text-sm font-bold tracking-widest">
                    {isRecording ? `REC ${formatTime(recordingTime)}` : (item.voiceNoteUrl ? 'VOICE_MEMO' : 'NO_AUDIO')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Recording In Progress */}
                  {isRecording && (
                     <button 
                       onClick={stopRecording}
                       className="px-4 py-2 bg-neo-accent text-white font-bold border border-white hover:bg-red-600 transition-colors"
                     >
                       STOP
                     </button>
                  )}

                  {/* Existing Audio Actions */}
                  {!isRecording && item.voiceNoteUrl && (
                    <>
                      <button 
                        onClick={toggleAudio}
                        className="px-4 py-2 border border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors flex items-center gap-2"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span className="text-xs font-bold">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                      </button>
                      
                      {isDeletingAudio ? (
                        <div className="flex items-center gap-2 ml-2 animate-slide-up">
                          <button 
                            onClick={confirmDeleteAudio} 
                            className="px-2 py-2 bg-neo-accent text-white font-bold text-[10px] uppercase border border-white hover:bg-red-600"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setIsDeletingAudio(false)} 
                            className="px-2 py-2 border border-white text-[10px] font-bold uppercase hover:bg-white hover:text-black"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsDeletingAudio(true)} 
                          className="p-2 hover:text-neo-accent transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Record New (If none exists) */}
                  {!isRecording && !item.voiceNoteUrl && (
                     <button 
                       onClick={startRecording}
                       className="px-4 py-2 border border-white dark:border-black bg-neo-primary text-white hover:bg-white hover:text-black transition-colors font-bold text-xs uppercase"
                     >
                       + Record
                     </button>
                  )}
                </div>
             </div>
             {/* Hidden Audio Element */}
             {item.voiceNoteUrl && (
                 <audio ref={audioRef} src={item.voiceNoteUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
             )}
          </div>

          {/* Note Block - Refined UI */}
          <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-900">
             {/* Heavy Header */}
             <div className="bg-neo-primary px-4 py-2 border-b-2 border-black dark:border-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <StickyNote className="w-4 h-4" />
                  <span className="font-black uppercase text-xs tracking-widest">Field Notes</span>
                </div>
                
                {!isEditingNote && (
                   <div className="flex gap-2">
                      {item.note ? (
                         <>
                          <button onClick={() => setIsEditingNote(true)} className="text-white hover:text-black transition"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={deleteNote} className="text-white hover:text-black transition"><Trash2 className="w-4 h-4" /></button>
                         </>
                      ) : (
                         <button onClick={() => setIsEditingNote(true)} className="text-white text-xs font-bold underline decoration-2 hover:text-black">+ ADD</button>
                      )}
                   </div>
                )}
             </div>

             <div className="p-4 min-h-[120px]">
                {isEditingNote ? (
                   <div className="space-y-2">
                      <textarea 
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-black border-2 border-black dark:border-white text-sm font-mono focus:outline-none focus:shadow-neo dark:focus:shadow-neo-white"
                        rows={5}
                        placeholder="Type your notes here..."
                      />
                      <div className="flex justify-end gap-2">
                         <button onClick={() => setIsEditingNote(false)} className="px-3 py-1 text-xs font-bold uppercase border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white">Cancel</button>
                         <button onClick={saveNote} className="px-4 py-1 text-xs font-bold uppercase bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-neo-primary hover:border-neo-primary transition-colors">Save Note</button>
                      </div>
                   </div>
                ) : (
                   item.note ? (
                     <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap dark:text-gray-200">{item.note}</p>
                   ) : (
                     <div className="h-full flex items-center justify-center opacity-40">
                        <span className="text-xs font-black uppercase italic text-gray-400">No notes recorded</span>
                     </div>
                   )
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DetailView;