// app/context/NotificationProvider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NotificationModal, { NotificationModalData } from '@/components/NotificationModal';
import { localStorageService } from '@/lib/localStorage';

// --- Type Definitions ---
interface PatientData {
  phoneNumber: string;
}

interface NotificationDataFromAPI {
  id: number;
  medicineId: number;
  title: string;
  message?: string;
  scheduledTime: string; // ISO 8601 format from DB
  timeType: string;
  isActive: boolean;
  medicine: {
    medicineName: string;
    dosage: number;
    medicineImageUrl?: string;
  };
}

interface NotificationContextType {}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// --- Helper Function ---
// ฟังก์ชันสำหรับแปลง VAPID public key จาก base64 string ไปเป็น Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// --- Provider Component ---
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [modalData, setModalData] = useState<NotificationModalData | null>(null);
  const [activeTimers, setActiveTimers] = useState<NodeJS.Timeout[]>([]);

  const hideModal = useCallback(() => {
    setModalData(null);
  }, []);

  const showModal = useCallback((data: NotificationModalData) => {
    setTimeout(() => {
        setModalData(currentModal => {
            if (currentModal) {
                console.log('A notification modal is already active. New notification ignored.');
                return currentModal;
            }
            return data;
        });
    }, 0);
  }, []);

  const recordConsumption = async (action: 'taken' | 'skipped') => {
    if (!modalData) return;
    try {
        const patientData = localStorageService.getItem<PatientData>('patient-data');
        if (!patientData?.phoneNumber) return;

        await fetch('/api/medicines/consumption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phoneNumber: patientData.phoneNumber,
                medicineId: modalData.medicineId,
                status: action,
                dosageTaken: action === 'taken' ? modalData.dosage : 0,
            }),
        });
        console.log(`Consumption recorded: ${action}`);
    } catch (error) {
        console.error('Failed to record consumption', error);
    } finally {
        hideModal();
    }
  };

  const scheduleNotifications = useCallback((notifications: NotificationDataFromAPI[]) => {
    activeTimers.forEach(clearTimeout);
    const newTimers: NodeJS.Timeout[] = [];
    const now = new Date();

    notifications.forEach(notification => {
      if (!notification.isActive) return;

      const scheduledTime = new Date(notification.scheduledTime);
      const scheduledToday = new Date();
      scheduledToday.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);

      const delay = scheduledToday.getTime() - now.getTime();

      if (delay > 0) {
        const timer = setTimeout(() => {
          showModal({
            medicineId: notification.medicineId,
            medicineName: notification.medicine.medicineName,
            dosage: notification.medicine.dosage,
            medicineImageUrl: notification.medicine.medicineImageUrl,
            title: notification.title,
            message: notification.message,
            timeType: notification.timeType,
            scheduledTime: notification.scheduledTime,
          });
        }, delay);
        newTimers.push(timer);
      }
    });
    setActiveTimers(newTimers);
  }, [activeTimers, showModal]);

  // ฟังก์ชันสำหรับขออนุญาต Push Notification และส่ง Subscription ไปยัง Backend
  const subscribeUserToPush = useCallback(async (registration: ServiceWorkerRegistration, phoneNumber: string) => {
    try {
        const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });
        
        console.log('User is subscribed:', subscription);
        // ส่ง subscription object ไปที่ backend
        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription, phoneNumber }),
        });
    } catch (err) {
        console.error('Failed to subscribe the user: ', err);
    }
  }, []);

  // useEffect หลัก
  useEffect(() => {
    const patientData = localStorageService.getItem<PatientData>('patient-data');
    if (patientData?.phoneNumber) {
      // 1. ดึงข้อมูลการแจ้งเตือน (สำหรับแสดง Modal เมื่อเปิดแอป)
      fetch(`/api/notifications?phoneNumber=${patientData.phoneNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data.notifications) {
            scheduleNotifications(data.notifications);
          }
        })
        .catch(console.error);

      // 2. จัดการ Push Subscription (สำหรับแจ้งเตือนเมื่อปิดแอป)
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.pushManager.getSubscription().then(subscription => {
            if (subscription === null) {
              console.log('Not subscribed to push notifications, starting subscription...');
              subscribeUserToPush(registration, patientData.phoneNumber);
            } else {
              console.log('User is already subscribed.');
              // ส่งข้อมูลไปอัปเดตที่ server เพื่อให้แน่ใจว่าข้อมูลเป็นปัจจุบัน
              fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription, phoneNumber: patientData.phoneNumber }),
              });
            }
          });
        });
      }
    }

    // Cleanup function
    return () => {
      activeTimers.forEach(clearTimeout);
    };
  }, [activeTimers, scheduleNotifications, subscribeUserToPush]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      <NotificationModal
        isOpen={!!modalData}
        data={modalData}
        onTake={() => recordConsumption('taken')}
        onSkip={() => recordConsumption('skipped')}
        onDismiss={hideModal}
      />
    </NotificationContext.Provider>
  );
}