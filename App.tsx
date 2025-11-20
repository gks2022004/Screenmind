import React, { useState, useRef, useEffect } from 'react';
import { Plus, ImageIcon, Sun, Moon, Bell, X, AlertCircle, ScreenmindLogo } from './components/Icons';
import ActionOverlay from './components/ActionOverlay';
import ScreenshotCard from './components/ScreenshotCard';
import DetailView from './components/DetailView';
import { ScreenshotData } from './types';
import { ClipboardMonitor } from './utils/clipboard';

const App: React.FC = () => {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeAlarmItem, setActiveAlarmItem] = useState<ScreenshotData | null>(null);
  const [clipboardMonitorEnabled, setClipboardMonitorEnabled] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clipboardMonitorRef = useRef<ClipboardMonitor>(new ClipboardMonitor());

  useEffect(() => {
    const savedTheme = localStorage.getItem('screenmind_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkMode(initialDark);
    updateThemeClass(initialDark);
  }, []);

  const updateThemeClass = (isDark: boolean) => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('screenmind_theme', newMode ? 'dark' : 'light');
    updateThemeClass(newMode);
  };

  useEffect(() => {
    const saved = localStorage.getItem('screenmind_data');
    if (saved) {
      try { setScreenshots(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const toSave = screenshots.slice(0, 20); 
    localStorage.setItem('screenmind_data', JSON.stringify(toSave));
  }, [screenshots]);

  const playAlarm = (isUrgent: boolean = false) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const t = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'square'; 
      const frequency = isUrgent ? 1046.5 : 880;
      const duration = isUrgent ? 0.08 : 0.1;
      const gap = isUrgent ? 0.08 : 0.1;
      const repetitions = isUrgent ? 8 : 3; 
      for (let i = 0; i < repetitions; i++) {
        const startTime = t + (i * (duration + gap));
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      }
      oscillator.start(t);
      oscillator.stop(t + (repetitions * (duration + gap)) + 0.5);
      oscillator.onended = () => ctx.close();
    } catch (e) { console.error(e); }
  };

  const dismissAlarm = () => {
    if (!activeAlarmItem) return;
    const updatedScreenshots = screenshots.map(s => 
      s.id === activeAlarmItem.id ? { ...s, reminderAcknowledged: true } : s
    );
    setScreenshots(updatedScreenshots);
    setActiveAlarmItem(null);
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Force update to get latest service worker
        registration.update();
        
        // Check for shared image data on load
        caches.open('screenmind-v1').then((cache) => {
          cache.match('/shared-image-data').then((response) => {
            if (response) {
              response.json().then((data) => {
                if (data.imageData) {
                  setCurrentImage(data.imageData);
                  // Clear the cached data after using it
                  cache.delete('/shared-image-data');
                }
              });
            }
          });
        });
      }).catch((error) => {
        console.log('Service Worker registration failed:', error);
      });

      // Listen for shared images from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SHARED_IMAGE') {
          setCurrentImage(event.data.imageData);
        }
      });
    }
    
    const interval = setInterval(() => {
      const now = Date.now();
      const overdueItem = screenshots.find(item => 
        item.reminderTime && item.reminderTime <= now && !item.reminderAcknowledged
      );
      if (overdueItem) {
        setActiveAlarmItem(overdueItem);
        playAlarm(overdueItem.isUrgent);
        if ("Notification" in window && Notification.permission === 'granted') {
          new Notification(`${overdueItem.isUrgent ? '🚨 URGENT' : '⏰'} ALARM: ${overdueItem.title}`);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [screenshots]); 

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentImage(reader.result as string);
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCamera = () => {
    // On mobile, this will open camera or gallery
    if (fileInputRef.current) {
      // Remove capture attribute to allow gallery selection on some devices
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
      // Re-add capture for next time
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.setAttribute('capture', 'environment');
        }
      }, 100);
    }
  };

  const handleSaveCapture = (data: ScreenshotData) => {
    setScreenshots(prev => [data, ...prev]);
    setCurrentImage(null);
  };

  const handleDelete = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
    if (selectedScreenshot?.id === id) setSelectedScreenshot(null);
  };

  const handleUpdateScreenshot = (updatedItem: ScreenshotData) => {
    setScreenshots(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
    if (selectedScreenshot?.id === updatedItem.id) setSelectedScreenshot(updatedItem);
  };

  const toggleClipboardMonitor = async () => {
    if (!clipboardMonitorEnabled) {
      // Start monitoring
      await clipboardMonitorRef.current.startMonitoring((imageData) => {
        setCurrentImage(imageData);
      });
      setClipboardMonitorEnabled(true);
    } else {
      // Stop monitoring
      clipboardMonitorRef.current.stopMonitoring();
      setClipboardMonitorEnabled(false);
    }
  };

  const pasteFromClipboard = async () => {
    const imageData = await clipboardMonitorRef.current.checkNow();
    if (imageData) {
      setCurrentImage(imageData);
    } else {
      alert('No image found in clipboard. Take a screenshot first!');
    }
  };

  const sortedScreenshots = [...screenshots].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen pb-24 relative bg-dots transition-colors duration-300 font-sans">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {/* Neo-Brutalist Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b-2 border-black dark:border-white px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center border-2 border-transparent shadow-neo-sm">
             <ScreenmindLogo className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-xl font-display font-black uppercase tracking-tighter leading-none dark:text-white">ScreenMind</h1>
             <div className="h-1 bg-neo-primary w-full mt-0.5"></div>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleClipboardMonitor}
            className={`px-3 py-2 border-2 border-black dark:border-white font-bold text-xs uppercase transition-all ${
              clipboardMonitorEnabled 
                ? 'bg-neo-secondary text-white shadow-neo-sm' 
                : 'bg-white dark:bg-gray-900 hover:shadow-neo dark:hover:shadow-neo-white'
            }`}
            title={clipboardMonitorEnabled ? 'Auto-detect ON' : 'Auto-detect OFF'}
          >
            {clipboardMonitorEnabled ? '● AUTO' : 'AUTO'}
          </button>
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 border-2 border-black dark:border-white bg-neo-yellow text-black hover:shadow-neo dark:hover:shadow-neo-white hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all flex items-center justify-center"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 max-w-xl mx-auto space-y-6">
        {screenshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg mt-10">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-neo flex items-center justify-center mb-6 rotate-3">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black uppercase mb-2 dark:text-white">Empty Memory</h3>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest hover:bg-neo-primary dark:hover:bg-neo-primary hover:text-white border-2 border-transparent hover:border-black transition-all"
            >
              Add Capture
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
               <div className="h-px bg-black dark:bg-white flex-1"></div>
               <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1 dark:bg-white dark:text-black">
                 ARCHIVE ({sortedScreenshots.length})
               </span>
               <div className="h-px bg-black dark:bg-white flex-1"></div>
            </div>
            {sortedScreenshots.map(item => (
              <ScreenshotCard 
                key={item.id} 
                item={item} 
                onDelete={handleDelete}
                onClick={setSelectedScreenshot}
                onUpdate={handleUpdateScreenshot}
              />
            ))}
          </>
        )}
      </main>

      {/* Brutalist FAB */}
      <div className="fixed bottom-8 right-6 z-20 flex flex-col gap-3">
        {/* Camera/Screenshot button - visible on mobile */}
        <button 
          onClick={openCamera}
          className="w-14 h-14 bg-neo-yellow text-black border-2 border-black dark:border-white shadow-neo dark:shadow-neo-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center md:hidden"
          title="Take/Upload Screenshot"
        >
          <ImageIcon className="w-6 h-6" />
        </button>
        {/* Paste button - visible on desktop */}
        <button 
          onClick={pasteFromClipboard}
          className="hidden md:flex w-14 h-14 bg-neo-secondary text-white border-2 border-black dark:border-white shadow-neo dark:shadow-neo-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all items-center justify-center"
          title="Paste from clipboard"
        >
          <ImageIcon className="w-6 h-6" />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 bg-neo-primary border-2 border-black shadow-neo hover:shadow-neo-lg hover:-translate-y-1 hover:-translate-x-1 transition-all active:translate-x-0 active:translate-y-0 active:shadow-none flex items-center justify-center text-white"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </button>
      </div>

      {/* Overlays */}
      {currentImage && (
        <ActionOverlay 
          initialImage={currentImage} 
          onClose={() => setCurrentImage(null)} 
          onSave={handleSaveCapture} 
        />
      )}

      {selectedScreenshot && (
        <DetailView 
          item={selectedScreenshot} 
          onClose={() => setSelectedScreenshot(null)} 
          onDelete={handleDelete}
          onUpdate={handleUpdateScreenshot}
        />
      )}

      {/* Alarm Overlay */}
      {activeAlarmItem && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center font-display ${activeAlarmItem.isUrgent ? 'bg-neo-accent' : 'bg-neo-primary'}`}>
          <div className="bg-white border-4 border-black shadow-neo-lg p-8 max-w-sm w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-stripes opacity-20"></div>
            
            {activeAlarmItem.isUrgent ? (
               <AlertCircle className="w-20 h-20 mx-auto mb-4 text-neo-accent animate-bounce" />
            ) : (
               <Bell className="w-20 h-20 mx-auto mb-4 text-black animate-bounce" />
            )}
            
            <h2 className="text-4xl font-black mb-2 uppercase italic text-black">Wake Up!</h2>
            <p className="text-lg font-bold mb-6 font-mono border-y-2 border-black py-2 text-black">
              {activeAlarmItem.title}
            </p>
            
            <button 
              onClick={dismissAlarm}
              className="w-full py-4 bg-black text-white font-black text-xl uppercase border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-colors shadow-neo"
            >
              Dismiss
            </button>
            
            <button 
              onClick={() => {
                dismissAlarm();
                setSelectedScreenshot(activeAlarmItem);
              }}
              className="mt-6 text-sm font-bold underline uppercase tracking-widest text-gray-600 hover:text-black"
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;