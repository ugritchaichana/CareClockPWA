-- ========================================
-- CareClockPWA Database Setup Script
-- ========================================
-- Copy และ paste script นี้ใน Supabase SQL Editor แล้วกด RUN

-- 1. เพิ่ม currentStock column ให้ตาราง medicine ที่มีอยู่
ALTER TABLE public.medicine 
ADD COLUMN IF NOT EXISTS "currentStock" INTEGER NOT NULL DEFAULT 0;

-- 2. สร้างตาราง medicine_notifications (การแจ้งเตือนยา)
CREATE TABLE IF NOT EXISTS public.medicine_notifications (
    id SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    "scheduledTime" TIME NOT NULL, -- เวลาที่ต้องแจ้งเตือน (เช่น 08:00, 13:00)
    "timeType" VARCHAR(20) NOT NULL, -- morning, afternoon, evening, beforeBed
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medicine_notifications_patientId_fkey 
        FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON DELETE CASCADE,
    CONSTRAINT medicine_notifications_medicineId_fkey 
        FOREIGN KEY ("medicineId") REFERENCES public.medicine(id) ON DELETE CASCADE
);

-- 3. สร้างตาราง medicine_consumption (บันทึกการกินยา)
CREATE TABLE IF NOT EXISTS public.medicine_consumption (
    id SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "notificationId" INTEGER,
    "scheduledAt" TIMESTAMP(6) NOT NULL, -- วันและเวลาที่ควรกิน
    "consumedAt" TIMESTAMP(6), -- วันและเวลาที่กินจริง (null = ยังไม่กิน)
    "dosageTaken" INTEGER, -- จำนวนที่กินจริง
    status VARCHAR(20) DEFAULT 'pending', -- pending, taken, skipped, missed
    notes TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medicine_consumption_patientId_fkey 
        FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON DELETE CASCADE,
    CONSTRAINT medicine_consumption_medicineId_fkey 
        FOREIGN KEY ("medicineId") REFERENCES public.medicine(id) ON DELETE CASCADE,
    CONSTRAINT medicine_consumption_notificationId_fkey 
        FOREIGN KEY ("notificationId") REFERENCES public.medicine_notifications(id) ON DELETE SET NULL
);

-- 4. สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_patientId ON public.medicine_notifications("patientId");
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_medicineId ON public.medicine_notifications("medicineId");
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_timeType ON public.medicine_notifications("timeType");
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_isActive ON public.medicine_notifications("isActive");

CREATE INDEX IF NOT EXISTS idx_medicine_consumption_patientId ON public.medicine_consumption("patientId");
CREATE INDEX IF NOT EXISTS idx_medicine_consumption_medicineId ON public.medicine_consumption("medicineId");
CREATE INDEX IF NOT EXISTS idx_medicine_consumption_scheduledAt ON public.medicine_consumption("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_medicine_consumption_status ON public.medicine_consumption(status);

-- 5. Update existing medicines to set currentStock = quantity
UPDATE public.medicine 
SET "currentStock" = quantity 
WHERE "currentStock" = 0 OR "currentStock" IS NULL;

-- ========================================
-- ตรวจสอบการสร้างตาราง
-- ========================================
-- รันคำสั่งนี้เพื่อดูว่าตารางถูกสร้างแล้วหรือยัง
SELECT 
    table_name, 
    table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('medicine', 'medicine_notifications', 'medicine_consumption', 'patients')
ORDER BY table_name;
