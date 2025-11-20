import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, StickyNote, Bell, Save, Play, Pause, Trash2, Calendar } from './Icons';
import { ScreenshotData } from '../types';

interface ActionOverlayProps {
  initialImage: string;
  onClose: () => void;
  onSave: (data: ScreenshotData) => void;
}

const ActionOverlay: React.FC<ActionOverlayProps> = ({ initialImage, onClose, onSave }) => {
  const getDefaultTitle = () => {
    const date = new Date();
    return `CAPTURE_${date.getHours()}${date.getMinutes()}`;
  };

  const [title, setTitle] = useState(getDefaultTitle());
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [reminder, setReminder] = useState('');
  const [showReminderInput, setShowReminderInput] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
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

  const toggleAudioPlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSave = async () => {
    let finalAudioUrl = undefined;
    if (audioBlob) {
      try { finalAudioUrl = await blobToBase64(audioBlob); } catch (e) { console.error(e); }
    }

    const newScreenshot: ScreenshotData = {
      id: Date.now().toString(),
      imageData: initialImage,
      timestamp: Date.now(),
      title: title.trim() || getDefaultTitle(),
      summary: "", 
      note: note,
      voiceNoteUrl: finalAudioUrl,
      reminderTime: reminder ? new Date(reminder).getTime() : undefined,
      reminderAcknowledged: false,
    };
    onSave(newScreenshot);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neo-bg dark:bg-neo-dark animate-pop overflow-y-auto p-4">
      {/* Brutalist Window Container */}
      <div className="max-w-lg mx-auto w-full bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-neo-lg dark:shadow-neo-white min-h-full flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black dark:border-white bg-neo-yellow">
          <h2 className="font-display font-bold text-lg text-black uppercase tracking-tight">New Capture</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 flex flex-col gap-6">
          
          {/* Image Preview & Title */}
          <div className="space-y-4">
             <div className="border-2 border-black dark:border-white p-2 bg-white dark:bg-gray-800 transform rotate-1 hover:rotate-0 transition-transform">
                <img src={initialImage} alt="Screenshot" className="w-full max-h-[40vh] object-contain border border-black/10 dark:border-white/10" />
             </div>
             
             <div className="relative">
                <label className="block text-xs font-bold uppercase mb-1 ml-1 text-black dark:text-white">File Name</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-black border-2 border-black dark:border-white p-3 font-mono font-bold text-lg focus:outline-none focus:shadow-neo dark:focus:shadow-neo-white transition-shadow"
                  placeholder="TITLE_HERE"
                />
             </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'note', icon: StickyNote, label: 'NOTE', active: showNoteInput || note, color: 'bg-neo-primary' },
              { id: 'voice', icon: Mic, label: isRecording ? 'REC' : 'VOICE', active: isRecording || audioUrl, color: 'bg-neo-accent' },
              { id: 'remind', icon: Bell, label: 'ALARM', active: showReminderInput || reminder, color: 'bg-neo-secondary' }
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => {
                   if(btn.id === 'note') setShowNoteInput(!showNoteInput);
                   if(btn.id === 'remind') setShowReminderInput(!showReminderInput);
                   if(btn.id === 'voice') { if(!audioUrl && !isRecording) startRecording(); if(isRecording) stopRecording(); }
                }}
                className={`
                  flex flex-col items-center justify-center p-3 border-2 border-black dark:border-white transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                  ${btn.active 
                     ? `${btn.color} text-white shadow-neo dark:shadow-neo-white` 
                     : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'}
                `}
              >
                <btn.icon className={`w-6 h-6 mb-1 ${btn.id === 'voice' && isRecording ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-black tracking-wider">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Inputs */}
          <div className="space-y-4">
            {showNoteInput && (
              <div className="animate-slide-up">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Type details..."
                  className="w-full bg-neo-bg dark:bg-gray-800 border-2 border-black dark:border-white p-3 text-sm font-mono focus:outline-none min-h-[100px]"
                />
              </div>
            )}

            {(isRecording || audioUrl) && (
              <div className="animate-slide-up border-2 border-black dark:border-white p-3 flex items-center justify-between bg-neo-bg dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleAudioPlayback}
                    disabled={isRecording}
                    className={`w-10 h-10 border-2 border-black flex items-center justify-center transition active:translate-x-0.5 active:translate-y-0.5 ${isRecording ? 'bg-neo-accent text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    {isRecording ? <div className="w-3 h-3 bg-white animate-pulse" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="font-mono text-sm font-bold">
                    {isRecording ? `REC ${formatTime(recordingTime)}` : 'AUDIO_NOTE_01.mp3'}
                  </div>
                </div>
                {!isRecording && audioUrl && (
                  <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }}><Trash2 className="w-5 h-5 hover:text-neo-accent" /></button>
                )}
                {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />}
              </div>
            )}

            {showReminderInput && (
               <div className="animate-slide-up">
                 <div className="relative">
                   <input 
                     type="datetime-local"
                     value={reminder}
                     min={getMinDateTime()}
                     onChange={(e) => setReminder(e.target.value)}
                     className="w-full bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-3 text-sm font-bold appearance-none dark:[color-scheme:dark]"
                   />
                   <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                 </div>
               </div>
            )}
          </div>
        </div>

        {/* Footer Save Button */}
        <div className="p-4 border-t-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-display font-black text-xl uppercase border-2 border-transparent hover:bg-neo-primary hover:border-black dark:hover:border-white hover:shadow-neo dark:hover:shadow-neo-white transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            <Save className="w-6 h-6" />
            Save to Memory
          </button>
        </div>

      </div>
    </div>
  );
};

export default ActionOverlay;