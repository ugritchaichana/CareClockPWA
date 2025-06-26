// Notification Manager for PWA Medicine Reminders with iOS Support and Modal Integration
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
  medicineImageUrl?: string;
}

// Callback types for modal integration
export interface NotificationCallbacks {
  onShowModal?: (data: {
    medicineId: number;
    medicineName: string;
    dosage: number;
    medicineImageUrl?: string;
    title: string;
    message?: string;
    timeType: string;
    scheduledTime: string;
  }) => void;
  onNotificationClick?: (notificationId: string) => void;
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
  private callbacks: NotificationCallbacks = {};

  private constructor() {
    this.detectPlatform();
    this.initializeAudio();
    this.requestNotificationPermission();
    this.loadNotificationsFromStorage();
    this.startNotificationChecker();
    this.registerServiceWorkerListener();
    this.requestWakeLock();
    this.setupDeepLinkListener();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Set callbacks for modal integration
  public setCallbacks(callbacks: NotificationCallbacks) {
    this.callbacks = callbacks;
  }

  // Setup deep link listener for notification clicks
  private setupDeepLinkListener() {
    // Listen for URL changes to handle deep links from notifications
    if (typeof window !== 'undefined') {
      // Check initial URL for notification parameter
      this.checkForNotificationParameter();
      
      // Listen for hash changes (for deep links)
      window.addEventListener('hashchange', () => {
        this.checkForNotificationParameter();
      });
      
      // Listen for focus events (when app becomes active from notification click)
      window.addEventListener('focus', () => {
        // Small delay to ensure URL is updated
        setTimeout(() => {
          this.checkForNotificationParameter();
        }, 100);
      });
    }
  }

  // Check URL for notification parameters
  private checkForNotificationParameter() {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    const notificationId = url.searchParams.get('notification');
    const medicineId = url.searchParams.get('medicineId');
    
    if (notificationId || medicineId) {
      // Find the notification and trigger modal
      const notification = this.notifications.find(n => 
        n.id === notificationId || n.medicineId.toString() === medicineId
      );
      
      if (notification && this.callbacks.onShowModal) {
        this.callbacks.onShowModal({
          medicineId: notification.medicineId,
          medicineName: notification.medicineName,
          dosage: notification.dosage,
          medicineImageUrl: notification.medicineImageUrl,
          title: notification.title,
          message: notification.message,
          timeType: notification.timeType,
          scheduledTime: notification.scheduledTime
        });
        
        // Clean up URL parameters
        url.searchParams.delete('notification');
        url.searchParams.delete('medicineId');
        window.history.replaceState({}, '', url.toString());
      }
      
      if (this.callbacks.onNotificationClick) {
        this.callbacks.onNotificationClick(notificationId || medicineId || '');
      }
    }
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

    // Always show system notification first
    const hasPermission = Notification.permission === 'granted';
    if (hasPermission) {
      await this.showSystemNotification(notification);
    }

    // Then, if app is active, show modal directly
    if (this.callbacks.onShowModal && document.hasFocus()) {
      // App is active - show modal directly
      console.log('App is active, showing modal');
      this.callbacks.onShowModal({
        medicineId: notification.medicineId,
        medicineName: notification.medicineName,
        dosage: notification.dosage,
        medicineImageUrl: notification.medicineImageUrl,
        title: notification.title,
        message: notification.message,
        timeType: notification.timeType,
        scheduledTime: notification.scheduledTime
      });
    }

    // Record that notification was shown
    this.recordNotificationShown(notification.medicineId, 'shown');
  }

  // Show system notification (separate from modal)
  private async showSystemNotification(notification: ScheduledNotification) {
    try {
      // Create notification URL with deep link parameters
      const notificationUrl = `${window.location.origin}${window.location.pathname}?notification=${notification.id}&medicineId=${notification.medicineId}`;

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
            data: {
              url: notificationUrl,
              medicineId: notification.medicineId,
              notificationId: notification.id
            },
            actions: [
              { action: 'taken', title: '✅ กินแล้ว' },
              { action: 'skip', title: '⏭️ ข้าม' },
              { action: 'view', title: '👀 ดูรายละเอียด' }
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
          data: {
            url: notificationUrl,
            medicineId: notification.medicineId,
            notificationId: notification.id
          }
        };

        // Add vibration pattern for supported browsers (iOS Safari)
        if (notification.vibrationEnabled && 'vibrate' in navigator) {
          (notificationOptions as any).vibrate = [200, 100, 200, 100, 200];
        }

        const notif = new Notification(notification.title, notificationOptions);

        // Handle notification click - open app with deep link
        notif.onclick = () => {
          window.focus();
          notif.close();
          
          // Navigate to notification URL for deep link handling
          if (notificationUrl !== window.location.href) {
            window.location.href = notificationUrl;
          } else {
            // Same URL, trigger modal directly
            if (this.callbacks.onShowModal) {
              this.callbacks.onShowModal({
                medicineId: notification.medicineId,
                medicineName: notification.medicineName,
                dosage: notification.dosage,
                medicineImageUrl: notification.medicineImageUrl,
                title: notification.title,
                message: notification.message,
                timeType: notification.timeType,
                scheduledTime: notification.scheduledTime
              });
            }
          }
        };

        // Auto close after 30 seconds if not interacted
        setTimeout(() => {
          notif.close();
        }, 30000);
      }
    } catch (error) {
      console.error('Failed to show system notification:', error);
    }
  }

  // Record notification was shown
  private async recordNotificationShown(medicineId: number, status: string) {
    try {
      console.log(`Notification shown for medicine ${medicineId} with status: ${status}`);
    } catch (error) {
      console.error('Failed to record notification shown:', error);
    }
  }

  // Play alarm sound with iOS compatibility
  public async playAlarmSound(): Promise<void> {
    try {
      this.soundPlaying = true;
      
      // Try HTML Audio first (iOS compatible)
      if (this.alarmSound) {
        await this.alarmSound.play();
      }
      
      // Try Web Audio API as backup
      if ((this as any).playWebAudioBeep) {
        (this as any).playWebAudioBeep();
      }
      
      // Use Speech Synthesis as final fallback (works well on iOS)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('ถึงเวลากินยาแล้ว');
        utterance.lang = 'th-TH';
        utterance.volume = 0.1;
        speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }
  }

  // Stop alarm sound
  public stopAlarmSound(): void {
    try {
      this.soundPlaying = false;
      
      if (this.alarmSound) {
        this.alarmSound.pause();
        this.alarmSound.currentTime = 0;
      }
      
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      
    } catch (error) {
      console.error('Failed to stop alarm sound:', error);
    }
  }

  // Trigger vibration
  private triggerVibration(): void {
    if ('vibrate' in navigator) {
      // Vibration pattern: [vibrate, pause, vibrate, pause, ...]
      const pattern = [500, 300, 500, 300, 500];
      navigator.vibrate(pattern);
    }
  }

  // Initialize audio with user interaction (required for iOS)
  public async initializeAudioWithUserInteraction(): Promise<void> {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Play a silent sound to unlock audio on iOS
      if (this.alarmSound) {
        this.alarmSound.volume = 0;
        await this.alarmSound.play();
        this.alarmSound.pause();
        this.alarmSound.volume = 1.0;
      }
      
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio with user interaction:', error);
    }
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
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          const { notificationId, medicineId } = event.data;
          
          // Handle notification click
          if (this.callbacks.onNotificationClick) {
            this.callbacks.onNotificationClick(notificationId);
          }
          
          // Show modal if callback available
          if (this.callbacks.onShowModal) {
            const notification = this.notifications.find(n => 
              n.id === notificationId || n.medicineId === medicineId
            );
            
            if (notification) {
              this.callbacks.onShowModal({
                medicineId: notification.medicineId,
                medicineName: notification.medicineName,
                dosage: notification.dosage,
                medicineImageUrl: notification.medicineImageUrl,
                title: notification.title,
                message: notification.message,
                timeType: notification.timeType,
                scheduledTime: notification.scheduledTime
              });
            }
          }
        }
      });
    }
  }

  // Sync notifications with server data
  public async syncNotifications(serverNotifications: any[]) {
    try {
      // Convert server notifications to local format
      const localNotifications: ScheduledNotification[] = serverNotifications.map(notif => ({
        id: `${notif.id}-${notif.timeType}`,
        medicineId: notif.medicineId,
        medicineName: notif.medicine?.medicineName || 'Unknown Medicine',
        title: notif.title,
        message: notif.message || '',
        scheduledTime: notif.scheduledTime.substring(0, 5), // HH:mm format
        timeType: notif.timeType,
        isActive: notif.isActive,
        dosage: notif.medicine?.dosage || 1,
        soundEnabled: true,
        vibrationEnabled: true,
        medicineImageUrl: notif.medicine?.medicineImageUrl
      }));
      
      this.notifications = localNotifications;
      this.saveNotificationsToStorage();
      
      console.log(`Synced ${localNotifications.length} notifications`);
    } catch (error) {
      console.error('Failed to sync notifications:', error);
    }
  }

  // Check if notifications are supported
  public static isSupported(): boolean {
    return 'Notification' in window;
  }

  // Cleanup
  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.stopAlarmSound();
    
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  // Handle notification actions (taken/skipped)
  public async handleNotificationAction(notificationId: string, action: 'taken' | 'skipped', medicineId?: number) {
    try {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (!notification && medicineId) {
        // Find by medicine ID if notification ID not found
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5);
        const candidateNotifications = this.notifications.filter(n => 
          n.medicineId === medicineId && n.scheduledTime === currentTime
        );
        if (candidateNotifications.length > 0) {
          candidateNotifications[0]; // Use first match
        }
      }

      if (notification) {
        // Record the action
        console.log(`Medicine ${notification.medicineName} was ${action} at ${new Date().toLocaleString()}`);
        
        // Log consumption to backend if needed
        await this.logConsumption(notification.medicineId, action, notification.timeType);
        
        // Store locally for tracking
        const today = new Date().toISOString().split('T')[0];
        const consumptionKey = `consumption-${today}-${notification.medicineId}-${notification.timeType}`;
        localStorage.setItem(consumptionKey, JSON.stringify({
          medicineId: notification.medicineId,
          medicineName: notification.medicineName,
          action,
          timestamp: new Date().toISOString(),
          timeType: notification.timeType
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to handle notification action:', error);
      return false;
    }
  }

  // Log consumption to backend
  private async logConsumption(medicineId: number, action: 'taken' | 'skipped', timeType: string) {
    try {
      const response = await fetch('/api/medicines/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId,
          action,
          timeType,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to log consumption to backend');
      }
    } catch (error) {
      console.warn('Failed to log consumption to backend:', error);
    }
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

// Create and export singleton instance
export const notificationManager = NotificationManager.getInstance();
