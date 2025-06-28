-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "prefix" VARCHAR(20) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "age" INTEGER NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "medicalRight" VARCHAR(100),
    "chronicDiseases" TEXT,
    "drugAllergy" TEXT,
    "profileImageUrl" TEXT,
    "registeredAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "medicineName" VARCHAR(200) NOT NULL,
    "medicineDetails" TEXT,
    "consumptionType" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "dosage" INTEGER NOT NULL,
    "morning" BOOLEAN DEFAULT false,
    "afternoon" BOOLEAN DEFAULT false,
    "evening" BOOLEAN DEFAULT false,
    "beforeBed" BOOLEAN DEFAULT false,
    "medicineImageUrl" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_notifications" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT,
    "scheduledTime" TIME(6) NOT NULL,
    "timeType" VARCHAR(20) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "group_id" VARCHAR(100),

    CONSTRAINT "medicine_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_consumption" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "notificationId" INTEGER,
    "scheduledAt" TIMESTAMP(6) NOT NULL,
    "consumedAt" TIMESTAMP(6),
    "dosageTaken" INTEGER,
    "status" VARCHAR(20) DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
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

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_phoneNumber_key" ON "patients"("phoneNumber");

-- CreateIndex
CREATE INDEX "idx_patients_phonenumber" ON "patients"("phoneNumber");

-- CreateIndex
CREATE INDEX "idx_medicine_isactive" ON "medicine"("isActive");

-- CreateIndex
CREATE INDEX "idx_medicine_patientid" ON "medicine"("patientId");

-- CreateIndex
CREATE INDEX "idx_medicine_notifications_isactive" ON "medicine_notifications"("isActive");

-- CreateIndex
CREATE INDEX "idx_medicine_notifications_medicineid" ON "medicine_notifications"("medicineId");

-- CreateIndex
CREATE INDEX "idx_medicine_notifications_patientid" ON "medicine_notifications"("patientId");

-- CreateIndex
CREATE INDEX "idx_medicine_notifications_timetype" ON "medicine_notifications"("timeType");

-- CreateIndex
CREATE INDEX "idx_medicine_consumption_medicineid" ON "medicine_consumption"("medicineId");

-- CreateIndex
CREATE INDEX "idx_medicine_consumption_patientid" ON "medicine_consumption"("patientId");

-- CreateIndex
CREATE INDEX "idx_medicine_consumption_scheduledat" ON "medicine_consumption"("scheduledAt");

-- CreateIndex
CREATE INDEX "idx_medicine_consumption_status" ON "medicine_consumption"("status");

-- CreateIndex
CREATE INDEX "idx_prescriptions_patientid" ON "prescriptions"("patientId");

-- AddForeignKey
ALTER TABLE "medicine" ADD CONSTRAINT "medicine_patientid_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medicine_notifications" ADD CONSTRAINT "medicine_notifications_medicineid_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medicine_notifications" ADD CONSTRAINT "medicine_notifications_patientid_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medicine_consumption" ADD CONSTRAINT "medicine_consumption_medicineid_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medicine_consumption" ADD CONSTRAINT "medicine_consumption_notificationid_fkey" FOREIGN KEY ("notificationId") REFERENCES "medicine_notifications"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medicine_consumption" ADD CONSTRAINT "medicine_consumption_patientid_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientid_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
