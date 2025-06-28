// app/context/NotificationProvider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import NotificationModal, { NotificationModalData } from '@/components/NotificationModal';
import { dataService, getNotifications } from '@/lib/dataService';

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
  const activeTimers = useRef<NodeJS.Timeout[]>([]);

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
      const patientData = dataService.getPatientData();
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

  const scheduleNotifications = useCallback(() => {
    const notifications = getNotifications();
    activeTimers.current.forEach(clearTimeout);
    const newTimers: NodeJS.Timeout[] = [];
    const now = new Date();

    notifications.forEach((notification: any) => {
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
    activeTimers.current = newTimers;
  }, [showModal]);

  // ฟังก์ชันสำหรับขออนุญาต Push Notification และส่ง Subscription ไปยัง Backend
  const subscribeUserToPush = useCallback(async (registration: ServiceWorkerRegistration, phoneNumber: string) => {
    try {
        // 1) Ensure Notification permission (push subscribe จะ trigger แต่ขอชัดเจนไว้ก่อน)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission not granted');
          return;
        }

        // 2) Get VAPID public key (env หรือ fallback fetch)
        let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          try {
            const res = await fetch('/api/push/public-key');
            if (res.ok) {
              const json = await res.json();
              publicKey = json.publicKey;
            }
          } catch (e) {
            console.error('Failed to fetch public VAPID key', e);
          }
        }

        if (!publicKey) {
          console.error('No VAPID public key found, cannot subscribe');
          return;
        }

        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        console.log('User is subscribed:', subscription);
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, phoneNumber }),
        });
    } catch (err) {
        console.error('Failed to subscribe the user: ', err);
    }
  }, []);

  // useEffect หลัก: จัดการ data fetching, push subscription, และ background sync
  useEffect(() => {
    const patientData = dataService.getPatientData();

    const handleInitialSetup = async () => {
      if (patientData?.phoneNumber) {
        // 1. ดึงข้อมูลครั้งแรกเมื่อเปิดแอป
        await dataService.fetchAllDataAndStore();
        scheduleNotifications();

        // 2. จัดการ Push Subscription
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription === null) {
            console.log('Not subscribed to push notifications, starting subscription...');
            subscribeUserToPush(registration, patientData.phoneNumber);
          } else {
            console.log('User is already subscribed.');
            // ส่งข้อมูลไปอัปเดตเพื่อให้แน่ใจว่า server มีข้อมูลล่าสุด
            fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription, phoneNumber: patientData.phoneNumber }),
            });
          }
        }
      }
    };

    handleInitialSetup();

    // 3. ตั้งค่าการ Sync ข้อมูลทุกๆ 1 นาที
    const syncInterval = setInterval(() => {
      console.log('Periodic sync...');
      dataService.fetchAllDataAndStore();
    }, 60 * 1000); // 1 นาที

    // 4. ตั้งค่า Listener เพื่อ re-schedule ทันทีเมื่อข้อมูลเปลี่ยน
    window.addEventListener('appDataUpdated', scheduleNotifications);

    // Cleanup function
    return () => {
      activeTimers.current.forEach(clearTimeout);
      clearInterval(syncInterval);
      window.removeEventListener('appDataUpdated', scheduleNotifications);
    };
  }, [scheduleNotifications, subscribeUserToPush]);

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