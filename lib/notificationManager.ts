// Notification Manager for PWA Medicine Reminders
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

  private constructor() {
    this.initializeAudio();
    this.requestNotificationPermission();
    this.loadNotificationsFromStorage();
    this.startNotificationChecker();
    this.registerServiceWorkerListener();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Initialize audio for alarm sounds
  private initializeAudio() {
    try {
      // Create audio context for alarm sounds
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create alarm sound element
      this.alarmSound = new Audio();
      this.alarmSound.loop = true;
      this.alarmSound.volume = 0.8;
      
      // You can add a custom alarm sound file, or use a generated tone
      this.generateAlarmTone();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // Generate a simple alarm tone
  private generateAlarmTone() {
    if (!this.audioContext) return;

    try {
      // Create a simple beep sound using Web Audio API
      const generateBeep = () => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext!.currentTime);
        gainNode.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext!.currentTime + 0.5);
      };

      // Store the beep function for later use
      (this as any).playBeep = generateBeep;
    } catch (error) {
      console.error('Failed to generate alarm tone:', error);
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

  // Register service worker message listener
  private registerServiceWorkerListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, notificationTag } = event.data;
        
        if (type === 'MEDICINE_TAKEN') {
          this.handleMedicineTaken(notificationTag);
        } else if (type === 'MEDICINE_SKIPPED') {
          this.handleMedicineSkipped(notificationTag);
        }
      });
    }
  }

  // Handle medicine taken from notification
  private handleMedicineTaken(notificationTag: string) {
    // Find the notification and mark medicine as taken
    const notification = this.notifications.find(n => `medicine-${n.id}` === notificationTag);
    if (notification) {
      // Call API to record consumption
      this.recordMedicineConsumption(notification.medicineId, 'taken');
    }
  }

  // Handle medicine skipped from notification
  private handleMedicineSkipped(notificationTag: string) {
    const notification = this.notifications.find(n => `medicine-${n.id}` === notificationTag);
    if (notification) {
      // Call API to record consumption
      this.recordMedicineConsumption(notification.medicineId, 'skipped');
    }
  }

  // Record medicine consumption
  private async recordMedicineConsumption(medicineId: number, status: 'taken' | 'skipped') {
    try {
      const patientData = localStorage.getItem('patient-data');
      if (!patientData) return;

      const { phoneNumber } = JSON.parse(patientData);

      await fetch('/api/medicines/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          medicineId,
          status
        })
      });
    } catch (error) {
      console.error('Failed to record consumption:', error);
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

  // Start the notification checker
  private startNotificationChecker() {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkDueNotifications();
    }, 60000); // 60 seconds

    // Also check immediately
    this.checkDueNotifications();
  }

  // Stop the notification checker
  public stopNotificationChecker() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for due notifications
  private checkDueNotifications() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    this.notifications.forEach(notification => {
      if (notification.isActive && notification.scheduledTime === currentTime) {
        this.triggerNotification(notification);
      }
    });
  }

  // Trigger a notification
  private async triggerNotification(notification: ScheduledNotification) {
    const hasPermission = await this.requestNotificationPermission();
    
    if (!hasPermission) {
      console.error('Notification permission not granted');
      return;
    }

    // Play alarm sound
    if (notification.soundEnabled) {
      this.playAlarmSound();
    }

    // Vibrate if supported and enabled
    if (notification.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
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
          actions: [
            { action: 'taken', title: '✅ กินแล้ว' },
            { action: 'skip', title: '⏭️ ข้าม' },
            { action: 'snooze', title: '⏰ เลื่อน 5 นาที' }
          ]
        }
      });
    } else {
      // Fallback to regular notification
      const notif = new Notification(notification.title, {
        body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
        icon: '/asset/CareClockLOGO.PNG',
        badge: '/asset/CareClockLOGO.PNG',
        tag: `medicine-${notification.id}`,
        requireInteraction: true
      });

      // Handle notification click
      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      // Auto close after 30 seconds if not interacted
      setTimeout(() => {
        notif.close();
        this.stopAlarmSound();
      }, 30000);
    }
  }

  // Play alarm sound
  private playAlarmSound() {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Play multiple beeps
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if ((this as any).playBeep) {
            (this as any).playBeep();
          }
        }, i * 1000);
      }
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }
  }

  // Stop alarm sound
  private stopAlarmSound() {
    try {
      if (this.alarmSound && !this.alarmSound.paused) {
        this.alarmSound.pause();
        this.alarmSound.currentTime = 0;
      }
    } catch (error) {
      console.error('Failed to stop alarm sound:', error);
    }
  }

  // Sync with server notifications
  public async syncNotifications(serverNotifications: any[]) {
    try {
      // Convert server notifications to local format
      const localNotifications: ScheduledNotification[] = serverNotifications.map(notif => ({
        id: `server-${notif.id}`,
        medicineId: notif.medicineId,
        medicineName: notif.medicine.medicineName,
        title: notif.title,
        message: notif.message || '',
        scheduledTime: this.formatTimeFromDateTime(notif.scheduledTime),
        timeType: notif.timeType,
        isActive: notif.isActive,
        dosage: notif.medicine.dosage,
        soundEnabled: true,
        vibrationEnabled: true
      }));

      // Update local notifications
      this.notifications = localNotifications;
      this.saveNotificationsToStorage();
    } catch (error) {
      console.error('Failed to sync notifications:', error);
    }
  }

  // Helper function to format DateTime to HH:mm
  private formatTimeFromDateTime(dateTime: string): string {
    try {
      const date = new Date(dateTime);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Failed to format time:', error);
      return '00:00';
    }
  }

  // Check if notifications are supported
  public static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Get notification permission status
  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export a singleton instance
export const notificationManager = NotificationManager.getInstance();
