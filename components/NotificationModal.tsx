'use client'

import { useState, useEffect, useRef } from 'react'

export interface NotificationModalData {
  medicineId: number
  medicineName: string
  dosage: number
  medicineImageUrl?: string
  title: string
  message?: string
  timeType: string
  scheduledTime: string
}

interface NotificationModalProps {
  isOpen: boolean
  data: NotificationModalData | null
  onTake: () => void
  onSkip: () => void
  onDismiss: () => void
  soundEnabled?: boolean
  vibrationEnabled?: boolean
}

// Theme colors - match notification.tsx
const themeColors = {
  bgGradient: 'linear-gradient(135deg, #FFF6F6 0%, #FFDFDF 50%, #AEDEFC 100%)',
  pink: '#FB929E',
  lightPink: '#FFDFDF',
  lightBlue: '#AEDEFC',
  white: '#FFF6F6',
  textPrimary: '#575757',
  textSecondary: '#757575',
}

export default function NotificationModal({
  isOpen,
  data,
  onTake,
  onSkip,
  onDismiss,
  soundEnabled = true,
  vibrationEnabled = true
}: NotificationModalProps) {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)

  // Get time type label in Thai
  const getTimeTypeLabel = (timeType: string) => {
    switch (timeType) {
      case 'morning': return 'เช้า'
      case 'afternoon': return 'กลางวัน'
      case 'evening': return 'เย็น'
      case 'beforeBed': return 'ก่อนนอน'
      default: return timeType
    }
  }

  // Format time to Thai time
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Bangkok'
      })
    } catch {
      return timeString
    }
  }

  // Initialize audio context for iOS
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        // @ts-ignore - AudioContext exists in browser
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error)
    }
  }

  // Play alarm sound continuously
  const playAlarmSound = async () => {
    if (!soundEnabled) return

    try {
      await initializeAudio()

      // Try Web Audio API first (better for iOS)
      if (audioContextRef.current && !oscillatorRef.current) {
        const createOscillator = () => {
          if (!audioContextRef.current) return

          const oscillator = audioContextRef.current.createOscillator()
          const gainNode = audioContextRef.current.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContextRef.current.destination)
          
          // Create alarm pattern: 800Hz for 500ms, pause 200ms, repeat
          oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
          gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
          
          oscillator.start()
          oscillatorRef.current = oscillator
          
          // Stop after 500ms and restart
          setTimeout(() => {
            try {
              if (oscillatorRef.current) {
                oscillatorRef.current.stop()
                oscillatorRef.current = null
              }
              // Restart after 200ms pause if still playing
              if (isPlaying) {
                setTimeout(() => {
                  if (isPlaying) createOscillator()
                }, 200)
              }
            } catch (e) {
              console.warn('Error stopping oscillator:', e)
            }
          }, 500)
        }

        createOscillator()
        setIsPlaying(true)
      }

      // Fallback to HTML Audio with loop
      if (!audioRef.current) {
        // Create a simple beep sound data URL
        const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuR2e/CbSIGLIHO8diJOAkZaLvt559NEQ1Qp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuR2e/CbSIGLIHO8diJOAkZaLvt559NEQ1Qp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuR2e/CbSIGLIHO8diJOAkZaLvt559NEQ1Qp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuR2e/CbSIF'
        
        audioRef.current = new Audio(beepSound)
        audioRef.current.loop = true
        audioRef.current.volume = 0.7
      }
      
      if (audioRef.current.paused) {
        await audioRef.current.play()
        setIsPlaying(true)
      }
      
    } catch (error) {
      console.warn('Failed to play alarm sound:', error)
      
      // Last resort: Speech Synthesis (works on iOS)
      try {
        const speakAlarm = () => {
          if (!isPlaying) return
          
          const utterance = new SpeechSynthesisUtterance('เตือนกินยา')
          utterance.lang = 'th-TH'
          utterance.volume = 0.5
          utterance.rate = 1.2
          utterance.onend = () => {
            // Repeat every 3 seconds
            if (isPlaying) {
              setTimeout(speakAlarm, 3000)
            }
          }
          speechSynthesis.speak(utterance)
        }
        speakAlarm()
        setIsPlaying(true)
      } catch (e) {
        console.warn('Speech synthesis also failed:', e)
      }
    }
  }

  // Stop alarm sound
  const stopAlarmSound = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current = null
      }
      
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      
      // Stop speech synthesis
      speechSynthesis.cancel()
      
      setIsPlaying(false)
    } catch (error) {
      console.warn('Failed to stop alarm sound:', error)
    }
  }

  // Vibrate device
  const vibrate = () => {
    if (!vibrationEnabled) return
    
    try {
      if ('vibrate' in navigator) {
        // Vibration pattern: vibrate 500ms, pause 200ms, vibrate 500ms
        navigator.vibrate([500, 200, 500, 200, 500])
      }
    } catch (error) {
      console.warn('Vibration failed:', error)
    }
  }

  // Handle modal open
  useEffect(() => {
    if (isOpen && data) {
      setTimeLeft(300) // Reset to 5 minutes
      
      // Start countdown
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto dismiss after 5 minutes
            onDismiss()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Start alarm sound and vibration
      playAlarmSound()
      vibrate()

      // Repeat vibration every 30 seconds
      const vibrationInterval = setInterval(() => {
        if (isPlaying) {
          vibrate()
        }
      }, 30000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        clearInterval(vibrationInterval)
        stopAlarmSound()
      }
    }
  }, [isOpen, data])

  // Handle modal close
  useEffect(() => {
    if (!isOpen) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      stopAlarmSound()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      stopAlarmSound()
    }
  }, [])

  // Format countdown display
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4">
      <div 
        className="bg-white rounded-3xl p-6 max-w-sm w-full mx-auto shadow-2xl border-4"
        style={{ 
          borderColor: themeColors.pink,
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-pulse">💊</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>
            ⏰ เวลากินยาแล้ว!
          </h2>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xl font-bold text-red-600">
              {formatCountdown(timeLeft)}
            </span>
            <span className="text-sm text-gray-600">นาที</span>
          </div>
          <div className="text-sm text-gray-500">
            จะปิดอัตโนมัติใน {formatCountdown(timeLeft)} นาที
          </div>
        </div>

        {/* Medicine Info */}
        <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: themeColors.white }}>
          <div className="text-center">
            {data.medicineImageUrl && (
              <img 
                src={data.medicineImageUrl} 
                alt={data.medicineName}
                className="w-24 h-24 object-cover rounded-2xl mx-auto mb-3 border-2"
                style={{ borderColor: themeColors.lightPink }}
              />
            )}
            <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>
              {data.medicineName}
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium" style={{ color: themeColors.textSecondary }}>
                📊 ขนาด: {data.dosage} เม็ด
              </p>
              <p className="font-medium" style={{ color: themeColors.textSecondary }}>
                ⏰ เวลา: {getTimeTypeLabel(data.timeType)} ({formatTime(data.scheduledTime)})
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {data.message && (
          <div className="mb-6 p-3 rounded-2xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800 text-center font-medium">
              💬 {data.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              stopAlarmSound()
              onTake()
            }}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              minHeight: '64px'
            }}
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-2xl">✅</span>
              <span>กินยาแล้ว</span>
            </span>
          </button>
          
          <button
            onClick={() => {
              stopAlarmSound()
              onSkip()
            }}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              minHeight: '64px'
            }}
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-2xl">⏭️</span>
              <span>ข้ามการกินยา</span>
            </span>
          </button>

          <button
            onClick={() => {
              stopAlarmSound()
              onDismiss()
            }}
            className="w-full py-3 rounded-2xl font-semibold text-base border-2 transition-all duration-300 transform active:scale-95"
            style={{
              borderColor: themeColors.textSecondary,
              color: themeColors.textSecondary,
              backgroundColor: 'transparent',
              minHeight: '48px'
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <span>❌</span>
              <span>ปิดการแจ้งเตือน</span>
            </span>
          </button>
        </div>

        {/* Sound Status */}
        {isPlaying && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <span className="animate-pulse">🔊</span>
              <span>กำลังเล่นเสียงแจ้งเตือน</span>
            </p>
          </div>
        )}

        {/* Instructions for elderly users */}
        <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            👆 กดปุ่มเพื่อตอบการแจ้งเตือน<br/>
            หรือรอ {formatCountdown(timeLeft)} นาที เพื่อปิดอัตโนมัติ
          </p>
        </div>
      </div>
    </div>
  )
}