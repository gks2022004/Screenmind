/**
 * Clipboard monitoring utilities for screenshot detection
 */

export class ClipboardMonitor {
  private intervalId: number | null = null;
  private lastClipboardContent: string | null = null;
  private onImageCallback: ((imageData: string) => void) | null = null;

  /**
   * Start monitoring clipboard for new screenshots
   * Note: Requires user interaction first (e.g., click a button)
   */
  async startMonitoring(onImage: (imageData: string) => void) {
    this.onImageCallback = onImage;
    
    // Check every 2 seconds for clipboard changes
    this.intervalId = window.setInterval(async () => {
      await this.checkClipboard();
    }, 2000);
  }

  /**
   * Stop monitoring clipboard
   */
  stopMonitoring() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check clipboard for image content
   */
  private async checkClipboard() {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        // Look for image types
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const imageData = await this.blobToBase64(blob);
          
          // Only trigger if it's different from last time
          if (imageData !== this.lastClipboardContent) {
            this.lastClipboardContent = imageData;
            this.onImageCallback?.(imageData);
          }
        }
      }
    } catch (err) {
      // Clipboard access denied or not available
      console.debug('Clipboard access not available:', err);
    }
  }

  /**
   * Manually check clipboard (call on user interaction)
   */
  async checkNow(): Promise<string | null> {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        return null;
      }

      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          return await this.blobToBase64(blob);
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
    return null;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * Request clipboard permission with user interaction
 */
export async function requestClipboardPermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
    return result.state === 'granted' || result.state === 'prompt';
  } catch {
    return false;
  }
}
