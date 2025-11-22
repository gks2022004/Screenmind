<div align="center">

<svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#8b5cf6" stroke-width="2" />
  <path d="M8 8H16V16H8V8Z" fill="#8b5cf6" opacity="0.5" />
  <path d="M12 8V6" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" />
  <path d="M16 12H18" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" />
  <path d="M12 16V18" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" />
  <path d="M8 12H6" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" />
  <circle cx="12" cy="12" r="2" fill="#8b5cf6" />
</svg>

# ScreenMind

**Your screenshots. Organized. Annotated. Unforgettable.**

A neo-brutalist screenshot assistant that transforms chaos into clarity using AI-powered intelligence.

[Live Demo](https://ai.studio/apps/drive/1JbS1EuPDbpXmD2o5mpMomzz1MpCgNUE8) • [Documentation](#features) • [Getting Started](#quick-start)

</div>

---

## What is ScreenMind?

ScreenMind isn't just another screenshot manager. It's your digital memory vault with a brain. Capture, organize, annotate, and never forget important screenshots again. Built with a bold neo-brutalist design that makes productivity feel like art.

## Features

### Core Capabilities

**Smart Organization**
- AI-powered automatic titling and categorization
- Lightning-fast search through your entire screenshot library
- Clean, brutalist interface that puts your content first

**Rich Annotations**
- Add text notes to capture context
- Record voice memos for detailed explanations
- Set reminders with normal or URGENT priority
- Edit titles on the fly, anywhere in the app

**Intelligent Reminders**
- Time-based alarms that actually get your attention
- Visual and audio notifications for urgent items
- Smart reminder acknowledgment system
- Never miss a follow-up again

**Seamless Capture**
- Multiple input methods: upload, paste, or camera
- PWA support for mobile screenshot sharing
- Automatic clipboard detection on desktop
- Share screenshots directly from your phone's share menu

**Modern Features**
- Dark mode that's easy on the eyes
- Responsive design from mobile to desktop
- Offline-capable Progressive Web App
- Data persistence with local storage

## Quick Start

### Prerequisites

Make sure you have Node.js installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gks2022004/Screenmind.git
   cd Screenmind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Launch the app**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to `http://localhost:3000` and start capturing.

## Usage Guide

### Desktop Workflow

1. **Enable Auto-Detection**: Click the AUTO button in the header
2. **Take a screenshot**: Use your OS screenshot tool (it copies to clipboard)
3. **ScreenMind detects it**: Within 2 seconds, the capture overlay appears
4. **Add context**: Title, notes, voice memo, or reminder
5. **Save to memory**: Done. Your screenshot is organized and searchable.

### Mobile Workflow

1. **Install as PWA**: Tap Share → Add to Home Screen
2. **Take a screenshot**: Use your phone's screenshot function
3. **Share to ScreenMind**: Tap Share → Select ScreenMind
4. **Annotate and save**: Add your notes and reminders
5. **Access anywhere**: Your screenshots sync via local storage

### Alternative Methods

- Click the yellow camera button to upload from gallery
- Use the purple plus button to browse and select images
- Paste directly from clipboard with the green paste button

## Tech Stack

Built with modern web technologies for maximum performance:

- **React 19** - Lightning-fast UI
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Neo-brutalist styling
- **Vite** - Instant hot module replacement
- **Service Workers** - Offline-first architecture

## Project Structure

```
Screenmind/
├── components/          # React components
│   ├── ActionOverlay.tsx   # Screenshot capture interface
│   ├── DetailView.tsx      # Full screenshot view
│   ├── ScreenshotCard.tsx  # List item component
│   └── Icons.tsx           # Icon library
├── services/            # External services
│   └── gemini.ts           # AI integration
├── utils/               # Utilities
│   └── clipboard.ts        # Clipboard monitoring
├── public/              # Static assets
│   ├── sw.js               # Service worker
│   └── manifest.json       # PWA manifest
└── types.ts             # TypeScript definitions
```

### PWA Setup

ScreenMind works as a Progressive Web App. To install:

**On Mobile:**
1. Open in Chrome/Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Enjoy native-like experience

**On Desktop:**
1. Look for install icon in address bar
2. Click "Install ScreenMind"
3. Launch from desktop

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.



