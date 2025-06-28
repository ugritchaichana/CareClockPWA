// ======================================================================
// File: app/api/notifications/route.ts (ฉบับแก้ไขสมบูรณ์)
// นี่คือโค้ดที่ถูกต้องสำหรับ API Route ของ Next.js
// ======================================================================
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phoneNumber = searchParams.get('phoneNumber')

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const user = await prisma.patient.findUnique({ where: { phoneNumber } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const notifications = await prisma.medicineNotification.findMany({
      where: { 
        patientId: user.id
      },
      include: {
        medicine: {
          select: {
            id: true,
            medicineName: true,
            dosage: true,
            currentStock: true,
            medicineImageUrl: true,
            consumptionType: true
          }
        }
      },
      orderBy: { 
        scheduledTime: 'asc' 
      }
    })

    // 👈 **แก้ไขตรงนี้**
    // แปลงค่า Date object ให้เป็น ISO string ก่อนส่ง response
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      scheduledTime: notification.scheduledTime.toISOString(),
    }));

    return NextResponse.json({ 
      notifications: formattedNotifications 
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      phoneNumber, 
      medicineId, 
      title, 
      message, 
      scheduledTime, // e.g., "07:42" (This is Thailand Time)
      timeType,
      groupId
    } = body

    if (!phoneNumber || !medicineId || !title || !scheduledTime || !timeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.patient.findUnique({ where: { phoneNumber } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const medicine = await prisma.medicine.findFirst({
        where: { id: parseInt(medicineId), patientId: user.id }
    });

    if (!medicine) {
        return NextResponse.json({ error: 'Medicine not found or does not belong to user' }, { status: 404 });
    }

    // --- Timezone Correction Logic ---
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    
    const dateOnServer = new Date(); 
    dateOnServer.setHours(hours, minutes, 0, 0);

    const serverTimezoneOffset = dateOnServer.getTimezoneOffset();
    const thailandTimezoneOffset = -420;
    
    const dateInUTC = new Date(dateOnServer.getTime() - (serverTimezoneOffset - thailandTimezoneOffset) * 60 * 1000);
    
    const scheduledDateTimeToSave = dateInUTC;

    const notification = await prisma.medicineNotification.create({
      data: {
        patientId: user.id,
        medicineId: parseInt(medicineId),
        title,
        message: message || `ถึงเวลากินยา ${medicine.medicineName}`,
        scheduledTime: scheduledDateTimeToSave,
        timeType,
        groupId: groupId || null
      }
    });

    return NextResponse.json({
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update notification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      notificationId, 
      phoneNumber, 
      title, 
      message, 
      scheduledTime, 
      timeType,
      isActive 
    } = body

    if (!notificationId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Notification ID and phone number are required' },
        { status: 400 }
      )
    }

    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingNotification = await prisma.medicineNotification.findFirst({
      where: {
        id: parseInt(notificationId),
        patientId: user.id
      }
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found or does not belong to user' },
        { status: 404 }
      )
    }
    
    let scheduledDateTime = existingNotification.scheduledTime;
    if (scheduledTime) {
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const dateOnServer = new Date();
        dateOnServer.setHours(hours, minutes, 0, 0);

        const serverTimezoneOffset = dateOnServer.getTimezoneOffset();
        const thailandTimezoneOffset = -420;
        
        const dateInUTC = new Date(dateOnServer.getTime() - (serverTimezoneOffset - thailandTimezoneOffset) * 60 * 1000);
        scheduledDateTime = dateInUTC;
    }

    const notification = await prisma.medicineNotification.update({
      where: { id: parseInt(notificationId) },
      data: {
        title: title || existingNotification.title,
        message: message || existingNotification.message,
        scheduledTime: scheduledDateTime,
        timeType: timeType || existingNotification.timeType,
        isActive: isActive !== undefined ? isActive : existingNotification.isActive
      }
    })

    return NextResponse.json({
      message: 'Notification updated successfully',
      notification
    })

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('notificationId')
    const phoneNumber = searchParams.get('phoneNumber')

    if (!notificationId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Notification ID and phone number are required' },
        { status: 400 }
      )
    }

    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const deletedNotification = await prisma.medicineNotification.deleteMany({
      where: {
        id: parseInt(notificationId),
        patientId: user.id
      }
    })

    if (deletedNotification.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found or does not belong to user' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notification deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update notification status (isActive)
export async function PATCH(request: NextRequest) {
  try {
    const { phoneNumber, notificationId, isActive } = await request.json()

    if (!phoneNumber || !notificationId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Phone number, notification ID, and isActive status are required' },
        { status: 400 }
      )
    }

    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedNotification = await prisma.medicineNotification.updateMany({
      where: {
        id: parseInt(notificationId),
        patientId: user.id
      },
      data: {
        isActive: isActive
      }
    })

    if (updatedNotification.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found or does not belong to user' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notification status updated successfully',
      isActive: isActive
    })

  } catch (error) {
    console.error('Error updating notification status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
