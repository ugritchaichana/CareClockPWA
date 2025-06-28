import { localStorageService } from './localStorage';

// --- Type Definitions (ควรจะตรงกับโครงสร้างข้อมูลจริง) ---
export interface PatientData {
  phoneNumber: string;
  prefix: string;
  firstName: string;
  lastName: string;
  age: number;
  medicalRight: string;
  chronicDiseases: string | null;
  drugAllergy: string | null;
  profileImageUrl: string | null;
  registeredAt?: string;
}

export interface Medicine {
  id: number;
  // ... other medicine fields
}

export interface Notification {
  id: number;
  // ... other notification fields
}

interface AppData {
  patient: PatientData | null;
  medicines: Medicine[];
  notifications: Notification[];
}

const APP_DATA_KEY = 'app-data';

// --- Core Functions ---

/**
 * ดึงข้อมูลทั้งหมดจาก Local Storage
 */
const getAppData = (): AppData => {
  return localStorageService.getItem<AppData>(APP_DATA_KEY) ?? {
    patient: null,
    medicines: [],
    notifications: [],
  };
};

/**
 * บันทึกข้อมูลทั้งหมดลง Local Storage
 */
const setAppData = (data: AppData) => {
  localStorageService.setItem(APP_DATA_KEY, data);
};

/**
 * ดึงข้อมูลทั้งหมดจาก Server และอัปเดต Local Storage
 * ฟังก์ชันนี้จะเป็นหัวใจของการ Sync ข้อมูล
 */
export const fetchAllDataAndStore = async (): Promise<void> => {
  const patientData = localStorageService.getItem<{ phoneNumber: string }>('patient-data');
  if (!patientData?.phoneNumber) {
    console.log('No patient data, skipping fetch.');
    return;
  }

  try {
    console.log('Fetching all data from server...');
    const [medicinesRes, notificationsRes] = await Promise.all([
      fetch(`/api/medicines?phoneNumber=${patientData.phoneNumber}`),
      fetch(`/api/notifications?phoneNumber=${patientData.phoneNumber}`),
    ]);

    if (!medicinesRes.ok || !notificationsRes.ok) {
      throw new Error('Failed to fetch data from server');
    }

    const medicinesData = await medicinesRes.json();
    const notificationsData = await notificationsRes.json();

    const currentData = getAppData();
    const newData: AppData = {
      ...currentData, // เก็บข้อมูลผู้ใช้เดิมไว้ก่อน
      medicines: medicinesData.medicines || [],
      notifications: notificationsData.notifications || [],
    };

    setAppData(newData);
    console.log('Local storage updated successfully.');
    
    // ยิง custom event เพื่อบอกให้ส่วนอื่นๆ ของแอปรู้ว่าข้อมูลอัปเดตแล้ว
    window.dispatchEvent(new Event('appDataUpdated'));

  } catch (error) {
    console.error('Error fetching and storing data:', error);
  }
};

/**
 * ดึงข้อมูลผู้ป่วยจาก Local Storage
 */
export const getPatientData = (): PatientData | null => {
  // patient-data ยังคงแยกเก็บเพื่อความสะดวกในการเข้าถึง phoneNumber
  return localStorageService.getItem<PatientData>('patient-data');
};

/**
 * ดึงข้อมูลยาทั้งหมดจาก Local Storage
 */
export const getMedicines = (): Medicine[] => {
  return getAppData().medicines;
};

/**
 * ดึงข้อมูลการแจ้งเตือนทั้งหมดจาก Local Storage
 */
export const getNotifications = (): Notification[] => {
  return getAppData().notifications;
};


// --- ตัวอย่างฟังก์ชันสำหรับ CUD (Create, Update, Delete) ---

/**
 * อัปเดตยา (Optimistic Update)
 * @param updatedMedicine - ข้อมูลยาที่ถูกแก้ไข
 */
export const updateMedicine = async (updatedMedicine: Medicine) => {
  const currentData = getAppData();
  
  // 1. Optimistic Update: อัปเดต Local Storage ทันที
  const newMedicines = currentData.medicines.map(m => 
    m.id === updatedMedicine.id ? updatedMedicine : m
  );
  setAppData({ ...currentData, medicines: newMedicines });
  window.dispatchEvent(new Event('appDataUpdated')); // แจ้งเตือน UI

  // 2. Background Sync: ส่งข้อมูลไปที่ Server
  try {
    const response = await fetch('/api/medicines', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMedicine), // ส่งข้อมูลยาที่อัปเดตไป
    });

    if (!response.ok) {
      throw new Error('Failed to update medicine on server');
    }
    console.log('Medicine updated on server successfully.');

    // 3. Re-sync (Optional but recommended): ดึงข้อมูลล่าสุดกลับมาเพื่อให้แน่ใจว่าตรงกัน
    await fetchAllDataAndStore();

  } catch (error) {
    console.error('Failed to sync medicine update:', error);
    // TODO: Implement rollback logic if server update fails
    // อาจจะต้องแจ้งเตือนผู้ใช้ว่าการบันทึกข้อมูลล้มเหลว
  }
};

/**
 * ลบยา (Optimistic Delete)
 * @param medicineId - ID ของยาที่ต้องการลบ
 */
export const deleteMedicine = async (medicineId: number) => {
    const currentData = getAppData();

    // 1. Optimistic Update:
    const newMedicines = currentData.medicines.filter(m => m.id !== medicineId);
    // ควรจะลบ notification ที่เกี่ยวข้องออกไปด้วย
    const newNotifications = currentData.notifications.filter(n => (n as any).medicineId !== medicineId);
    setAppData({ ...currentData, medicines: newMedicines, notifications: newNotifications });
    window.dispatchEvent(new Event('appDataUpdated'));

    // 2. Background Sync:
    try {
        const patientData = getPatientData();
        if(!patientData) throw new Error("No patient data found for deletion");

        const response = await fetch(`/api/medicines?medicineId=${medicineId}&phoneNumber=${patientData.phoneNumber}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete medicine on server');
        
        console.log('Medicine deleted on server successfully.');
        // ไม่ต้อง re-sync เพราะเราลบข้อมูลใน local ไปแล้ว และถือว่าสำเร็จ
    } catch (error) {
        console.error('Failed to sync medicine delete:', error);
        // TODO: Rollback logic
    }
}

/**
 * อัปเดตข้อมูลผู้ใช้ (Optimistic Update)
 * @param updatedPatient - ข้อมูลผู้ใช้ที่ถูกแก้ไข
 */
export const updatePatient = async (updatedPatient: PatientData) => {
    // 1. Optimistic Update: อัปเดต Local Storage ทันที
    localStorageService.setItem('patient-data', updatedPatient);
    
    const currentAppData = getAppData();
    setAppData({ ...currentAppData, patient: updatedPatient });
    window.dispatchEvent(new Event('appDataUpdated'));

    // 2. Background Sync:
    try {
        const response = await fetch('/api/user/update', {
            method: 'PUT',
            body: updatedPatient as any, // FormData จะถูกส่งไปใน body
        });

        if (!response.ok) throw new Error('Failed to update patient on server');

        console.log('Patient updated on server successfully.');
        // ดึงข้อมูลทั้งหมดมาใหม่เพื่อให้แน่ใจว่าทุกอย่างตรงกัน
        await fetchAllDataAndStore();
    } catch (error) {
        console.error('Failed to sync patient update:', error);
        // TODO: Rollback logic
    }
};

/**
 * ลงทะเบียนผู้ใช้ใหม่
 * @param newPatientData - ข้อมูลผู้ใช้ใหม่จากฟอร์ม
 */
export const registerPatient = async (newPatientData: FormData) => {
    // สำหรับการลงทะเบียน เราจะส่งข้อมูลไปที่ server ก่อน
    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            body: newPatientData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Registration failed: ${errorText}`);
        }

        const result = await response.json();
        console.log('Patient registered successfully.');

        // หลังจากลงทะเบียนสำเร็จ ให้ดึงข้อมูลทั้งหมดมาเก็บ
        localStorageService.setItem('patient-data', result.data);
        await fetchAllDataAndStore();

        return result.data; // ส่งข้อมูลผู้ใช้กลับไป
    } catch (error) {
        console.error('Failed to register patient:', error);
        throw error; // โยน error ต่อเพื่อให้ UI จัดการ
    }
};

export const dataService = {
  fetchAllDataAndStore,
  getPatientData,
  getMedicines,
  getNotifications,
  updateMedicine,
  deleteMedicine,
  updatePatient,
  registerPatient,
}; 