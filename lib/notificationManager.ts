// Notification Manager for PWA Medicine Reminders with iOS Support
export interface ScheduledNotification {
  id: string;
  medicineId: number;
  medicineName: string;
  title: string;
  message: string;
  scheduledTime: string; // HH:mm format
  timeType: string;
  isActive: boolean;
  dosage: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: ScheduledNotification[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private alarmSound: HTMLAudioElement | null = null;
  private isIOS: boolean = false;
  private wakeLock: any = null;
  private soundPlaying: boolean = false;

  private constructor() {
    this.detectPlatform();
    this.initializeAudio();
    this.requestNotificationPermission();
    this.loadNotificationsFromStorage();
    this.startNotificationChecker();
    this.registerServiceWorkerListener();
    this.requestWakeLock();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Detect if running on iOS
  private detectPlatform() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // Request wake lock to keep app active in background
  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Wake lock acquired');
      }
    } catch (error) {
      console.log('Wake lock not supported or failed:', error);
    }
  }

  // Initialize audio for alarm sounds with iOS compatibility
  private initializeAudio() {
    try {
      // Create audio context for alarm sounds (iOS requires user interaction)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
      }
      
      // Create alarm sound element for iOS compatibility
      this.alarmSound = new Audio();
      this.alarmSound.loop = false; // iOS doesn't support looping well
      this.alarmSound.volume = 1.0; // Max volume for iOS
      this.alarmSound.preload = 'auto';
      
      // For iOS, we need to use a real sound file or data URL
      this.createIOSCompatibleAlarm();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // Create iOS-compatible alarm sound
  private createIOSCompatibleAlarm() {
    try {
      // Create a data URL with a simple beep sound for iOS compatibility
      const beepDataURL = this.generateBeepDataURL();
      if (this.alarmSound && beepDataURL) {
        this.alarmSound.src = beepDataURL;
      }
      
      // For iOS, also prepare Web Audio API beep
      if (this.audioContext) {
        this.prepareWebAudioBeep();
      }
    } catch (error) {
      console.error('Failed to create iOS-compatible alarm:', error);
    }
  }

  // Generate a beep sound as data URL for iOS
  private generateBeepDataURL(): string {
    try {
      // Simple WAV beep sound as base64 data URL
      const sampleRate = 44100;
      const frequency = 440;
      const duration = 0.5;
      const samples = sampleRate * duration;
      
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Generate sine wave
      for (let i = 0; i < samples; i++) {
        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
        const value = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(44 + i * 2, value, true);
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to generate beep data URL:', error);
      return '';
    }
  }

  // Prepare Web Audio API beep for iOS
  private prepareWebAudioBeep() {
    if (!this.audioContext) return;

    try {
      (this as any).playWebAudioBeep = () => {
        if (!this.audioContext || this.audioContext.state === 'closed') return;
        
        // Resume audio context if suspended (iOS requirement)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
      };
    } catch (error) {
      console.error('Failed to prepare Web Audio beep:', error);
    }
  }

  // Request notification permission
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Get notification permission status
  public getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Start the notification checker
  private startNotificationChecker() {
    // Check every minute for scheduled notifications
    this.checkInterval = setInterval(() => {
      this.checkScheduledNotifications();
    }, 60000); // Check every minute

    // Also check immediately
    this.checkScheduledNotifications();
  }

  // Check for notifications that should be shown now
  private checkScheduledNotifications() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:mm format

    this.notifications
      .filter(notification => notification.isActive)
      .forEach(notification => {
        if (notification.scheduledTime === currentTime) {
          this.showNotificationWithSoundAndVibration(notification);
        }
      });
  }

  // Show notification with enhanced sound and vibration for iOS
  private async showNotificationWithSoundAndVibration(notification: ScheduledNotification) {
    console.log('Showing notification:', notification);

    const hasPermission = Notification.permission === 'granted';
    if (!hasPermission) {
      console.error('Notification permission not granted');
      return;
    }

    // Play alarm sound first (before notification for iOS compatibility)
    if (notification.soundEnabled) {
      await this.playAlarmSound();
    }

    // Vibrate if supported and enabled (iOS supports vibration)
    if (notification.vibrationEnabled) {
      this.triggerVibration();
    }

    // Show notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for better notification support
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: {
          title: notification.title,
          body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
          tag: `medicine-${notification.id}`,
          icon: '/asset/CareClockLOGO.PNG',
          badge: '/asset/CareClockLOGO.PNG',
          requireInteraction: true,
          silent: false, // Allow sound on iOS
          vibrate: notification.vibrationEnabled ? [200, 100, 200, 100, 200] : undefined,
          actions: [
            { action: 'taken', title: '✅ กินแล้ว' },
            { action: 'skip', title: '⏭️ ข้าม' },
            { action: 'snooze', title: '⏰ เลื่อน 5 นาที' }
          ]
        }
      });
    } else {
      // Fallback to regular notification with iOS compatibility
      const notificationOptions: NotificationOptions = {
        body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
        icon: '/asset/CareClockLOGO.PNG',
        badge: '/asset/CareClockLOGO.PNG',
        tag: `medicine-${notification.id}`,
        requireInteraction: true,
        silent: !notification.soundEnabled, // Control sound
      };

      // Add vibration pattern for supported browsers (iOS Safari)
      if (notification.vibrationEnabled && 'vibrate' in navigator) {
        (notificationOptions as any).vibrate = [200, 100, 200, 100, 200];
      }

      const notif = new Notification(notification.title, notificationOptions);

      // Handle notification click
      notif.onclick = () => {
        window.focus();
        notif.close();
        this.stopAlarmSound();
      };

      // For iOS, continue playing sound until user interacts
      if (this.isIOS && notification.soundEnabled) {
        this.playIOSAlarmLoop();
      }

      // Auto close after 30 seconds if not interacted
      setTimeout(() => {
        notif.close();
        this.stopAlarmSound();
      }, 30000);
    }

    // Record that notification was shown
    this.recordNotificationShown(notification.medicineId, 'shown');
  }

  // Enhanced vibration for iOS
  private triggerVibration() {
    try {
      if ('vibrate' in navigator) {
        // iOS-compatible vibration pattern
        const vibrationPattern = this.isIOS 
          ? [200, 100, 200, 100, 200] // iOS short pattern
          : [500, 200, 500, 200, 500]; // Android longer pattern
        
        navigator.vibrate(vibrationPattern);
        
        // For iOS, repeat vibration after delay
        if (this.isIOS) {
          setTimeout(() => {
            navigator.vibrate([200, 100, 200]);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Vibration failed:', error);
    }
  }

  // iOS-specific alarm loop
  private playIOSAlarmLoop() {
    if (!this.isIOS || this.soundPlaying) return;
    
    this.soundPlaying = true;
    let playCount = 0;
    const maxPlays = 10; // Limit to prevent infinite loop
    
    const playLoop = () => {
      if (playCount >= maxPlays || !this.soundPlaying) return;
      
      this.playAlarmSound().then(() => {
        playCount++;
        if (this.soundPlaying) {
          setTimeout(playLoop, 1000); // Play every second
        }
      });
    };
    
    playLoop();
  }

  // Enhanced alarm sound with iOS compatibility
  private async playAlarmSound(): Promise<void> {
    return new Promise((resolve) => {
      try {
        // For iOS, we need user interaction to play audio
        if (this.isIOS) {
          this.playIOSCompatibleSound().then(resolve);
          return;
        }

        // Try Web Audio API first
        if (this.audioContext && (this as any).playWebAudioBeep) {
          (this as any).playWebAudioBeep();
          setTimeout(resolve, 500);
          return;
        }

        // Fallback to HTML Audio
        if (this.alarmSound) {
          this.alarmSound.currentTime = 0;
          const playPromise = this.alarmSound.play();
          
          if (playPromise) {
            playPromise
              .then(() => {
                setTimeout(() => {
                  if (this.alarmSound) {
                    this.alarmSound.pause();
                    this.alarmSound.currentTime = 0;
                  }
                  resolve();
                }, 500);
              })
              .catch((error) => {
                console.error('Audio play failed:', error);
                resolve();
              });
          } else {
            setTimeout(resolve, 500);
          }
        } else {
          resolve();
        }
      } catch (error) {
        console.error('Failed to play alarm sound:', error);
        resolve();
      }
    });
  }

  // iOS-compatible sound playing
  private async playIOSCompatibleSound(): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Resume audio context if needed
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().then(() => {
            console.log('AudioContext resumed for iOS sound');
          });
        }

        // Try multiple sound methods for iOS
        const methods = [
          () => this.playWebAudioBeepIOS(),
          () => this.playHTMLAudioIOS(),
          () => this.createSpeechSynthesisBeep()
        ];

        let methodIndex = 0;
        const playWithMethod = () => {
          if (methodIndex >= methods.length) {
            resolve();
            return;
          }

          try {
            console.log(`Trying iOS sound method ${methodIndex}`);
            methods[methodIndex]();
            methodIndex++;
            setTimeout(() => {
              if (methodIndex < methods.length) {
                // Try next method as backup
                setTimeout(playWithMethod, 100);
              } else {
                resolve();
              }
            }, 200);
          } catch (error) {
            console.error(`iOS sound method ${methodIndex} failed:`, error);
            methodIndex++;
            playWithMethod();
          }
        };

        playWithMethod();
      } catch (error) {
        console.error('iOS sound playback failed:', error);
        resolve();
      }
    });
  }

  // Web Audio beep specifically for iOS
  private playWebAudioBeepIOS() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // Higher frequency for iOS
    oscillator.type = 'square'; // More distinct sound
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // HTML Audio for iOS
  private playHTMLAudioIOS() {
    if (!this.alarmSound) return;

    // For iOS, create a new audio element each time
    const audio = new Audio();
    audio.src = this.alarmSound.src;
    audio.volume = 1.0;
    audio.play().catch(console.error);
  }

  // Fallback: Use Speech Synthesis as a beep (iOS compatible)
  private createSpeechSynthesisBeep() {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('beep');
      utterance.rate = 10;
      utterance.pitch = 2;
      utterance.volume = 0.1;
      speechSynthesis.speak(utterance);
    }
  }

  // Stop alarm sound
  private stopAlarmSound() {
    this.soundPlaying = false;
    
    try {
      if (this.alarmSound) {
        this.alarmSound.pause();
        this.alarmSound.currentTime = 0;
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') {
        // Stop any ongoing oscillators
        this.audioContext.suspend();
      }
    } catch (error) {
      console.error('Failed to stop alarm sound:', error);
    }
  }

  // Initialize audio with user interaction (required for iOS)
  public async initializeAudioWithUserInteraction(): Promise<boolean> {
    try {
      // Resume audio context if suspended (iOS requirement)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully');
      }

      // Test play a silent sound to unlock audio on iOS
      if (this.isIOS) {
        await this.unlockIOSAudio();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize audio with user interaction:', error);
      return false;
    }
  }

  // Unlock iOS audio by playing a silent sound
  private async unlockIOSAudio(): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.audioContext) {
          resolve();
          return;
        }

        // Create a silent oscillator to unlock audio
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime); // Silent
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.01);
        
        oscillator.onended = () => {
          console.log('iOS audio unlocked successfully');
          resolve();
        };
        
        // Fallback timeout
        setTimeout(resolve, 100);
      } catch (error) {
        console.error('Failed to unlock iOS audio:', error);
        resolve();
      }
    });
  }

  // Test sound playback (for testing purposes)
  public async testSoundPlayback(): Promise<boolean> {
    try {
      console.log('Testing sound playback...');
      
      // Initialize audio if needed
      await this.initializeAudioWithUserInteraction();
      
      // Play test sound
      await this.playAlarmSound();
      
      console.log('Sound test completed successfully');
      return true;
    } catch (error) {
      console.error('Sound test failed:', error);
      return false;
    }
  }

  // Record consumption status
  private async recordNotificationShown(medicineId: number, status: string) {
    try {
      // This can be used to track notification delivery
      console.log(`Notification shown for medicine ${medicineId} with status: ${status}`);
    } catch (error) {
      console.error('Failed to record notification shown:', error);
    }
  }

  // Add or update a notification
  public addNotification(notification: ScheduledNotification) {
    const existingIndex = this.notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex >= 0) {
      this.notifications[existingIndex] = notification;
    } else {
      this.notifications.push(notification);
    }
    
    this.saveNotificationsToStorage();
  }

  // Remove a notification
  public removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotificationsToStorage();
  }

  // Get all active notifications
  public getActiveNotifications(): ScheduledNotification[] {
    return this.notifications.filter(n => n.isActive);
  }

  // Save notifications to localStorage
  private saveNotificationsToStorage() {
    try {
      localStorage.setItem('scheduled-notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  // Load notifications from localStorage
  private loadNotificationsFromStorage() {
    try {
      const stored = localStorage.getItem('scheduled-notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
      this.notifications = [];
    }
  }

  // Register service worker message listener
  private registerServiceWorkerListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
          this.handleNotificationAction(event.data.action, event.data.notificationId);
        }
      });
    }
  }

  // Handle notification action
  private handleNotificationAction(action: string, notificationId: string) {
    console.log(`Notification action: ${action} for notification: ${notificationId}`);
    
    // Stop alarm sound when user interacts
    this.stopAlarmSound();
    
    // Handle different actions
    switch (action) {
      case 'taken':
        // Record medicine taken
        console.log('Medicine taken');
        break;
      case 'skip':
        // Record medicine skipped
        console.log('Medicine skipped');
        break;
      case 'snooze':
        // Snooze for 5 minutes
        this.snoozeNotification(notificationId, 5);
        break;
    }
  }

  // Snooze notification
  private snoozeNotification(notificationId: string, minutes: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      const currentTime = new Date();
      currentTime.setMinutes(currentTime.getMinutes() + minutes);
      
      const newTime = currentTime.toTimeString().substring(0, 5);
      notification.scheduledTime = newTime;
      
      this.saveNotificationsToStorage();
      console.log(`Notification snoozed for ${minutes} minutes`);
    }
  }

  // Sync with server notifications
  public async syncNotifications(serverNotifications: any[]) {
    try {
      // Clear existing notifications
      this.notifications = [];
      
      // Add server notifications
      serverNotifications.forEach(serverNotif => {
        const notification: ScheduledNotification = {
          id: `server-${serverNotif.id}`,
          medicineId: serverNotif.medicineId,
          medicineName: serverNotif.medicine?.medicineName || 'Unknown Medicine',
          title: serverNotif.title,
          message: serverNotif.message || '',
          scheduledTime: this.formatTimeFromDateTime(serverNotif.scheduledTime),
          timeType: serverNotif.timeType,
          isActive: serverNotif.isActive,
          dosage: serverNotif.medicine?.dosage || 1,
          soundEnabled: true,
          vibrationEnabled: true
        };
        
        this.notifications.push(notification);
      });
      
      this.saveNotificationsToStorage();
      console.log(`Synced ${this.notifications.length} notifications`);
    } catch (error) {
      console.error('Failed to sync notifications:', error);
    }
  }

  // Format time from DateTime string
  private formatTimeFromDateTime(dateTime: string): string {
    try {
      const date = new Date(dateTime);
      return date.toTimeString().substring(0, 5); // HH:mm format
    } catch (error) {
      return dateTime; // Return as-is if parsing fails
    }
  }

  // Check if notifications are supported
  public static isSupported(): boolean {
    return 'Notification' in window;
  }

  // Cleanup
  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.stopAlarmSound();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();
