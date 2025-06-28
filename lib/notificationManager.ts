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
    if (typeof window === 'undefined') {
      return;
    }
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

  public setCallbacks(callbacks: NotificationCallbacks) {
    this.callbacks = callbacks;
  }

  private setupDeepLinkListener() {
    if (typeof window === 'undefined') return;
    this.checkForNotificationParameter();
    window.addEventListener('hashchange', () => this.checkForNotificationParameter());
    window.addEventListener('focus', () => setTimeout(() => this.checkForNotificationParameter(), 100));
  }

  private checkForNotificationParameter() {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const notificationId = url.searchParams.get('notification') || url.searchParams.get('notification_id');
    const medicineId = url.searchParams.get('medicineId');
    if (notificationId || medicineId) {
      const notification = this.notifications.find(n => n.id === notificationId || n.medicineId.toString() === medicineId);
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
        url.searchParams.delete('notification');
        url.searchParams.delete('notification_id');
        url.searchParams.delete('medicineId');
        window.history.replaceState({}, '', url.toString());
      }
      if (this.callbacks.onNotificationClick) {
        this.callbacks.onNotificationClick(notificationId || medicineId || '');
      }
    }
  }

  private detectPlatform() {
    if (typeof navigator === 'undefined') return;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private async requestWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Wake lock acquired');
    } catch (error) {
      console.log('Wake lock not supported or failed:', error);
    }
  }

  private initializeAudio() {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
      }
      this.alarmSound = new Audio();
      this.alarmSound.loop = false;
      this.alarmSound.volume = 1.0;
      this.alarmSound.preload = 'auto';
      this.createIOSCompatibleAlarm();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private createIOSCompatibleAlarm() {
    try {
      const beepDataURL = this.generateBeepDataURL();
      if (this.alarmSound && beepDataURL) {
        this.alarmSound.src = beepDataURL;
      }
      if (this.audioContext) {
        this.prepareWebAudioBeep();
      }
    } catch (error) {
      console.error('Failed to create iOS-compatible alarm:', error);
    }
  }

  private generateBeepDataURL(): string {
    if (typeof window === 'undefined') return '';
    try {
      const sampleRate = 44100;
      const frequency = 440;
      const duration = 0.5;
      const samples = sampleRate * duration;
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
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

  private prepareWebAudioBeep() {
    if (!this.audioContext) return;
    try {
      (this as any).playWebAudioBeep = () => {
        if (!this.audioContext || this.audioContext.state === 'closed') return;
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

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  private startNotificationChecker() {
    this.checkInterval = setInterval(() => this.checkScheduledNotifications(), 60000);
    this.checkScheduledNotifications();
  }

  private checkScheduledNotifications() {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    this.notifications
      .filter(notification => notification.isActive && notification.scheduledTime === currentTime)
      .forEach(notification => this.showNotificationWithSoundAndVibration(notification));
  }

  private async showNotificationWithSoundAndVibration(notification: ScheduledNotification) {
    console.log('Showing notification:', notification);
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (Notification.permission === 'granted') {
      await this.showSystemNotification(notification);
    }
    if (this.callbacks.onShowModal && document.hasFocus()) {
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
    this.recordNotificationShown(notification.medicineId, 'shown');
  }

  private async showSystemNotification(notification: ScheduledNotification) {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    try {
      const notificationUrl = `${window.location.origin}/?notification_id=${notification.id}`;
      if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            notification: {
              title: notification.title,
              body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
              tag: `medicine-${notification.id}`,
              icon: '/asset/CareClockLOGO.PNG',
              badge: '/asset/CareClockLOGO.PNG',
              requireInteraction: true,
              silent: false,
              vibrate: notification.vibrationEnabled ? [200, 100, 200, 100, 200] : undefined,
              data: { url: notificationUrl, medicineId: notification.medicineId, notificationId: notification.id },
              actions: [
                { action: 'taken', title: '✅ กินแล้ว' },
                { action: 'skip', title: '⏭️ ข้าม' },
                { action: 'view', title: '👀 ดูรายละเอียด' }
              ]
            }
          });
        } else {
          const registration = await navigator.serviceWorker.ready;
          if (registration?.showNotification) {
            await registration.showNotification(notification.title, {
              body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
              tag: `medicine-${notification.id}`,
              icon: '/asset/CareClockLOGO.PNG',
              badge: '/asset/CareClockLOGO.PNG',
              requireInteraction: true,
              silent: !notification.soundEnabled,
              data: { url: notificationUrl, medicineId: notification.medicineId, notificationId: notification.id },
              vibrate: notification.vibrationEnabled ? [200, 100, 200, 100, 200] : undefined,
              actions: [
                { action: 'taken', title: '✅ กินแล้ว' },
                { action: 'skip', title: '⏭️ ข้าม' },
                { action: 'view', title: '👀 ดูรายละเอียด' }
              ]
            } as any);
          }
        }
      } else {
        const options: any = {
          body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
          icon: '/asset/CareClockLOGO.PNG',
          badge: '/asset/CareClockLOGO.PNG',
          tag: `medicine-${notification.id}`,
          requireInteraction: true,
          silent: !notification.soundEnabled,
          data: { url: notificationUrl, medicineId: notification.medicineId, notificationId: notification.id }
        };
        if (notification.vibrationEnabled && 'vibrate' in navigator) {
          (options as any).vibrate = [200, 100, 200, 100, 200];
        }
        const notif = new Notification(notification.title, options);
        notif.onclick = () => {
          window.focus();
          notif.close();
          if (notificationUrl !== window.location.href) {
            window.location.href = notificationUrl;
          } else if (this.callbacks.onShowModal) {
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
        };
        setTimeout(() => notif.close(), 30000);
      }

      // Fallback/duplicate safeguard – attempt to use ready registration as well. Browsers will
      // dedupe based on the `tag` so user will not see duplicates, but ensures notification shows
      // even if message channel fails for some reason.
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(notification.title, {
            body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
            tag: `medicine-${notification.id}`,
            icon: '/asset/CareClockLOGO.PNG',
            badge: '/asset/CareClockLOGO.PNG',
            requireInteraction: true,
            silent: !notification.soundEnabled,
            data: { url: notificationUrl, medicineId: notification.medicineId, notificationId: notification.id },
            vibrate: notification.vibrationEnabled ? [200, 100, 200, 100, 200] : undefined,
            actions: [
              { action: 'taken', title: '✅ กินแล้ว' },
              { action: 'skip', title: '⏭️ ข้าม' },
              { action: 'view', title: '👀 ดูรายละเอียด' },
            ],
          } as any);
        } catch (e) {
          console.warn('Fallback registration.showNotification failed', e);
        }
      }
    } catch (error) {
      console.error('Failed to show system notification:', error);
      // Ultimate fallback: try in-page Notification constructor (will be ignored if permissions/visibility rules block it)
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const options: any = {
            body: `${notification.medicineName} - ${notification.dosage} เม็ด\n${notification.message}`,
            tag: `medicine-${notification.id}`,
            icon: '/asset/CareClockLOGO.PNG',
            badge: '/asset/CareClockLOGO.PNG',
            requireInteraction: true,
            vibrate: notification.vibrationEnabled ? [200, 100, 200] : undefined,
            data: { url: `${window.location.origin}/?notification_id=${notification.id}`, medicineId: notification.medicineId, notificationId: notification.id },
          };
          const notif = new Notification(notification.title, options);
          notif.onclick = () => {
            window.focus();
            notif.close();
            if (this.callbacks.onShowModal) {
              this.callbacks.onShowModal({
                medicineId: notification.medicineId,
                medicineName: notification.medicineName,
                dosage: notification.dosage,
                medicineImageUrl: notification.medicineImageUrl,
                title: notification.title,
                message: notification.message,
                timeType: notification.timeType,
                scheduledTime: notification.scheduledTime,
              });
            }
          };
        }
      } catch (fallbackErr) {
        console.warn('In-page Notification fallback failed', fallbackErr);
      }
    }
  }

  private async recordNotificationShown(medicineId: number, status: string) {
    try {
      console.log(`Notification shown for medicine ${medicineId} with status: ${status}`);
    } catch (error) {
      console.error('Failed to record notification shown:', error);
    }
  }

  public async playAlarmSound(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      this.soundPlaying = true;
      if (this.alarmSound) await this.alarmSound.play();
      if ((this as any).playWebAudioBeep) (this as any).playWebAudioBeep();
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

  public stopAlarmSound(): void {
    if (typeof window === 'undefined') return;
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

  private triggerVibration(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([500, 300, 500, 300, 500]);
    }
  }

  public async initializeAudioWithUserInteraction(): Promise<void> {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
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

  public async testSoundPlayback(): Promise<boolean> {
    try {
      console.log('Testing sound playback...');
      await this.initializeAudioWithUserInteraction();
      await this.playAlarmSound();
      console.log('Sound test completed successfully');
      return true;
    } catch (error) {
      console.error('Sound test failed:', error);
      return false;
    }
  }

  public addNotification(notification: ScheduledNotification) {
    const existingIndex = this.notifications.findIndex(n => n.id === notification.id);
    if (existingIndex >= 0) {
      this.notifications[existingIndex] = notification;
    } else {
      this.notifications.push(notification);
    }
    this.saveNotificationsToStorage();
  }

  public removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotificationsToStorage();
  }

  public getActiveNotifications(): ScheduledNotification[] {
    return this.notifications.filter(n => n.isActive);
  }

  private saveNotificationsToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('scheduled-notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  private loadNotificationsFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem('scheduled-notifications');
      if (stored) this.notifications = JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
      this.notifications = [];
    }
  }

  private registerServiceWorkerListener() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          const { notificationId, medicineId } = event.data;
          if (this.callbacks.onNotificationClick) this.callbacks.onNotificationClick(notificationId);
          if (this.callbacks.onShowModal) {
            const notification = this.notifications.find(n => n.id === notificationId || n.medicineId === medicineId);
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

  public async syncNotifications(serverNotifications: any[]) {
    try {
      const localNotifications: ScheduledNotification[] = serverNotifications.map(notif => {
        // --- Extract HH:mm regardless of whether backend returns ISO string or plain time ---
        let timeStr = '';
        try {
          if (typeof notif.scheduledTime === 'string') {
            if (/^\d{2}:\d{2}/.test(notif.scheduledTime)) {
              // e.g. "06:15:00" or "06:15"
              timeStr = notif.scheduledTime.substring(0,5);
            } else {
              const d = new Date(notif.scheduledTime);
              if (!isNaN(d.getTime())) {
                timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
              }
            }
          } else if (notif.scheduledTime instanceof Date) {
            timeStr = notif.scheduledTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
          }
        } catch (err) {
          console.warn('Failed to parse scheduledTime', notif.scheduledTime, err);
        }
        if (!/^\d{2}:\d{2}$/.test(timeStr)) {
          // fallback to 00:00 to avoid false triggering
          timeStr = '00:00';
        }

        return {
          id: `${notif.id}-${notif.timeType}`,
          medicineId: notif.medicineId,
          medicineName: notif.medicine?.medicineName || 'Unknown Medicine',
          title: notif.title,
          message: notif.message || '',
          scheduledTime: timeStr,
          timeType: notif.timeType,
          isActive: notif.isActive,
          dosage: notif.medicine?.dosage || 1,
          soundEnabled: true,
          vibrationEnabled: true,
          medicineImageUrl: notif.medicine?.medicineImageUrl
        } as ScheduledNotification;
      });
      this.notifications = localNotifications;
      this.saveNotificationsToStorage();
      console.log(`Synced ${localNotifications.length} notifications`);
    } catch (error) {
      console.error('Failed to sync notifications:', error);
    }
  }

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public destroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = null;
    this.stopAlarmSound();
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  public async handleNotificationAction(notificationId: string, action: 'taken' | 'skipped', medicineId?: number): Promise<boolean> {
    try {
      let notification = this.notifications.find(n => n.id === notificationId);
      if (!notification && medicineId) {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5);
        const candidates = this.notifications.filter(n => n.medicineId === medicineId && n.scheduledTime === currentTime);
        if (candidates.length > 0) notification = candidates[0];
      }
      if (notification) {
        console.log(`Medicine ${notification.medicineName} was ${action} at ${new Date().toLocaleString()}`);
        await this.logConsumption(notification.medicineId, action, notification.timeType);
        if (typeof localStorage !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            const key = `consumption-${today}-${notification.medicineId}-${notification.timeType}`;
            localStorage.setItem(key, JSON.stringify({
              medicineId: notification.medicineId,
              medicineName: notification.medicineName,
              action,
              timestamp: new Date().toISOString(),
              timeType: notification.timeType
            }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to handle notification action:', error);
      return false;
    }
  }

  private async logConsumption(medicineId: number, action: 'taken' | 'skipped', timeType: string) {
    try {
      const response = await fetch('/api/medicines/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicineId, action, timeType, timestamp: new Date().toISOString() })
      });
      if (!response.ok) console.warn('Failed to log consumption to backend');
    } catch (error) {
      console.warn('Failed to log consumption to backend:', error);
    }
  }

  public cleanup() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = null;
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
// --- จุดแก้ไขที่สำคัญ ---
// เราจะ export เฉพาะ class และ interface เพื่อให้ component ที่ใช้ 'use client' import ได้
// และจะสร้าง instance ภายใน Provider หรือที่อื่นๆ ที่เป็น client-side เท่านั้น
// แต่เนื่องจากมีหลายไฟล์ที่เรียกใช้ singleton instance นี้อยู่แล้ว เราจะคงไว้ตามเดิมแต่เพิ่มการป้องกัน
let instance: NotificationManager | null = null;
if (typeof window !== 'undefined') {
  instance = NotificationManager.getInstance();
}

export const notificationManager = instance!;
