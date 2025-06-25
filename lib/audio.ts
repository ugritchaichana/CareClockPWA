// Audio utilities for PWA notifications
export class AlarmAudio {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private stopCallback: (() => void) | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to create audio context:', error);
    }
  }

  // Create a beep sound
  private createBeep(frequency: number = 800, duration: number = 0.3, volume: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);

      setTimeout(resolve, duration * 1000);
    });
  }

  // Play alarm pattern (multiple beeps)
  public async playAlarmPattern(): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;

    try {
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Play alarm pattern: 3 quick beeps, pause, repeat 3 times
      for (let cycle = 0; cycle < 3 && this.isPlaying; cycle++) {
        // 3 quick beeps
        for (let beep = 0; beep < 3 && this.isPlaying; beep++) {
          await this.createBeep(880, 0.2, 0.4); // High pitch beep
          if (this.isPlaying) await this.sleep(100); // Short pause between beeps
        }
        
        if (this.isPlaying && cycle < 2) {
          await this.sleep(800); // Longer pause between cycles
        }
      }
    } catch (error) {
      console.error('Failed to play alarm pattern:', error);
    } finally {
      this.isPlaying = false;
      if (this.stopCallback) {
        this.stopCallback();
        this.stopCallback = null;
      }
    }
  }

  // Play urgent alarm (continuous beeping)
  public async playUrgentAlarm(): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;

    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Continuous urgent beeping for 10 seconds
      const endTime = Date.now() + 10000; // 10 seconds
      
      while (Date.now() < endTime && this.isPlaying) {
        await this.createBeep(1000, 0.15, 0.5); // High frequency, short beeps
        if (this.isPlaying) await this.sleep(150);
      }
    } catch (error) {
      console.error('Failed to play urgent alarm:', error);
    } finally {
      this.isPlaying = false;
      if (this.stopCallback) {
        this.stopCallback();
        this.stopCallback = null;
      }
    }
  }

  // Play gentle reminder (softer beeps)
  public async playGentleReminder(): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;

    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Gentle 2-tone pattern
      for (let i = 0; i < 2 && this.isPlaying; i++) {
        await this.createBeep(600, 0.4, 0.2); // Lower frequency, softer
        if (this.isPlaying) await this.sleep(200);
        await this.createBeep(800, 0.4, 0.2);
        if (this.isPlaying) await this.sleep(1000);
      }
    } catch (error) {
      console.error('Failed to play gentle reminder:', error);
    } finally {
      this.isPlaying = false;
      if (this.stopCallback) {
        this.stopCallback();
        this.stopCallback = null;
      }
    }
  }

  // Stop alarm
  public stopAlarm(): void {
    this.isPlaying = false;
  }

  // Set callback for when alarm stops
  public onStop(callback: () => void): void {
    this.stopCallback = callback;
  }

  // Helper function to sleep
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if audio is supported
  public static isSupported(): boolean {
    try {
      return !!(window.AudioContext || (window as any).webkitAudioContext);
    } catch {
      return false;
    }
  }
}

// Pre-built alarm types
export const AlarmTypes = {
  GENTLE: 'gentle',
  NORMAL: 'normal',
  URGENT: 'urgent'
} as const;

export type AlarmType = typeof AlarmTypes[keyof typeof AlarmTypes];
