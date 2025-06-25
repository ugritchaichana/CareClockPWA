-- ========================================
-- CareClockPWA Database Setup Script
-- ========================================
-- This script creates all necessary tables for the medicine management system
-- Run this script in Supabase SQL Editor

-- 1. Create patients table (users)
CREATE TABLE IF NOT EXISTS public.patients (
    id SERIAL PRIMARY KEY,
    prefix VARCHAR(20) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    "phoneNumber" VARCHAR(20) UNIQUE NOT NULL,
    "medicalRight" VARCHAR(100),
    "chronicDiseases" TEXT,
    "drugAllergy" TEXT,
    "profileImageUrl" TEXT,
    "registeredAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create medicine table (medicine information)
CREATE TABLE IF NOT EXISTS public.medicine (
    id SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL,
    "medicineName" VARCHAR(200) NOT NULL,
    "medicineDetails" TEXT,
    "consumptionType" VARCHAR(100) NOT NULL, -- ก่อนอาหาร, หลังอาหาร, พร้อมอาหาร
    quantity INTEGER NOT NULL, -- จำนวนยาทั้งหมด
    "currentStock" INTEGER NOT NULL DEFAULT 0, -- จำนวนที่เหลืออยู่
    dosage INTEGER NOT NULL, -- ขนาดการกิน (เม็ด/ครั้ง)
    morning BOOLEAN DEFAULT false,
    afternoon BOOLEAN DEFAULT false,
    evening BOOLEAN DEFAULT false,
    "beforeBed" BOOLEAN DEFAULT false,
    "medicineImageUrl" TEXT,
    "isActive" BOOLEAN DEFAULT true, -- ใช้งานอยู่หรือไม่
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medicine_patientId_fkey 
        FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON DELETE CASCADE
);

-- 3. Create medicine_notifications table (แจ้งเตือนการกินยา)
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

-- 4. Create medicine_consumption table (บันทึกการกินยา)
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

-- 5. Create prescriptions table (ใบสั่งยา)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    "imageUrl" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" VARCHAR(50),
    "prescriptionDate" DATE,
    "doctorName" VARCHAR(100),
    "hospitalName" VARCHAR(200),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prescriptions_patientId_fkey 
        FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON DELETE CASCADE
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_phoneNumber ON public.patients("phoneNumber");

-- Medicine indexes
CREATE INDEX IF NOT EXISTS idx_medicine_patientId ON public.medicine("patientId");
CREATE INDEX IF NOT EXISTS idx_medicine_isActive ON public.medicine("isActive");

-- Medicine notifications indexes
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_patientId ON public.medicine_notifications("patientId");
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_medicineId ON public.medicine_notifications("medicineId");
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_timeType ON public.medicine_notifications("timeType");
CREATE INDEX IF NOT EXISTS idx_medicine_notifications_isActive ON public.medicine_notifications("isActive");

-- Medicine consumption indexes
CREATE INDEX IF NOT EXISTS idx_medicine_consumption_patientId ON public.medicine_consumption("patientId");
CREATE INDEX IF NOT EXISTS idx_medicine_consumption_medicineId ON public.medicine_consumption("medicineId");
CREATE INDEX IF NOT EXISTS idx_medicine_consumption_scheduledAt ON public.medicine_consumption("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_medicine_consumption_status ON public.medicine_consumption(status);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patientId ON public.prescriptions("patientId");

-- ========================================
-- CREATE SAMPLE DATA (OPTIONAL)
-- ========================================

-- Insert sample patient (ใช้สำหรับทดสอบ - ลบได้)
-- INSERT INTO public.patients (
--     prefix, "firstName", "lastName", age, "phoneNumber", "medicalRight"
-- ) VALUES (
--     'นาย', 'สมชาย', 'ใจดี', 35, '0812345678', 'สิทธิ์บัตรทอง'
-- ) ON CONFLICT ("phoneNumber") DO NOTHING;

-- ========================================
-- USEFUL QUERIES FOR DEVELOPMENT
-- ========================================

-- Get all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Get medicine with remaining stock
-- SELECT m.*, (m."currentStock") as remaining 
-- FROM public.medicine m 
-- WHERE m."patientId" = 1 AND m."isActive" = true;

-- Get medicine consumption statistics
-- SELECT 
--     m."medicineName",
--     m."medicineImageUrl",
--     COUNT(CASE WHEN mc.status = 'taken' THEN 1 END) as taken_count,
--     COUNT(CASE WHEN mc.status = 'skipped' THEN 1 END) as skipped_count,
--     COUNT(CASE WHEN mc.status = 'missed' THEN 1 END) as missed_count,
--     COUNT(*) as total_scheduled
-- FROM public.medicine m
-- LEFT JOIN public.medicine_consumption mc ON m.id = mc."medicineId"
-- WHERE m."patientId" = 1
-- GROUP BY m.id, m."medicineName", m."medicineImageUrl";

-- ========================================
-- STORAGE BUCKETS (Run separately if needed)
-- ========================================

-- Create storage buckets in Supabase Storage (run in Storage section)
-- Bucket: medicine-images (for medicine photos)
-- Bucket: profile-images (for user profile photos)
-- Bucket: prescription-images (for prescription documents)
