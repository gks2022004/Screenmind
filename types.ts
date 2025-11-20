export interface ScreenshotData {
  id: string;
  imageData: string; // Base64
  timestamp: number;
  title: string;
  summary?: string; // Keeping for backward compatibility or manual notes
  note?: string;
  voiceNoteUrl?: string;
  reminderTime?: number; // Timestamp
  reminderAcknowledged?: boolean;
  isUrgent?: boolean;
}

export interface GeminiAnalysisResult {
  title: string;
  summary: string;
}

export type ViewMode = 'list' | 'capture' | 'detail';