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

    // Find the user
    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }    // Fetch all notifications with medicine details
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

    return NextResponse.json({ 
      notifications 
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
      scheduledTime, 
      timeType,
      groupId,
      timezone 
    } = body

    console.log('Received notification data:', {
      scheduledTime,
      timeType,
      timezone: timezone || 'Thailand (all users)',
      userAgent: request.headers.get('user-agent')
    })

    if (!phoneNumber || !medicineId || !title || !scheduledTime || !timeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify medicine belongs to user
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: parseInt(medicineId),
        patientId: user.id
      }
    })

    if (!medicine) {
      return NextResponse.json(
        { error: 'Medicine not found or does not belong to user' },
        { status: 404 }
      )
    }    // Handle timezone and convert scheduledTime
    let scheduledDateTime: Date
    try {
      // Simple approach: Always treat input as HH:mm in user's local timezone
      const today = new Date()
      const [hours, minutes] = scheduledTime.split(':').map(Number)
      
      // Validate time format
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return NextResponse.json(
          { error: 'Invalid time format. Please use HH:mm format (e.g., 08:30)' },
          { status: 400 }
        )
      }
      
      // Create date object - this will be in server's timezone but that's okay
      // because we'll always format it back with the user's timezone when displaying
      scheduledDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0)
      
      console.log('Time processing:', {
        input: scheduledTime,
        parsed: { hours, minutes },
        created: scheduledDateTime,
        timezone: 'Asia/Bangkok (Thailand)',
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
      
      // Validate the final date
      if (isNaN(scheduledDateTime.getTime())) {
        throw new Error('Invalid date created')
      }
      
    } catch (timeError) {
      console.error('Error parsing scheduled time:', timeError, 'Input:', scheduledTime)
      return NextResponse.json(
        { error: 'Invalid time format. Please provide a valid time.' },
        { status: 400 }
      )
    }

    // Create notification
    const notification = await prisma.medicineNotification.create({
      data: {
        patientId: user.id,
        medicineId: parseInt(medicineId),
        title,
        message: message || `เวลากินยา ${medicine.medicineName}`,
        scheduledTime: scheduledDateTime,
        timeType,
        groupId: groupId || null // Add groupId to database
      }
    })

    console.log('Created notification:', {
      id: notification.id,
      title: notification.title,
      scheduledTime: notification.scheduledTime,
      scheduledTimeFormatted: notification.scheduledTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      timeType: notification.timeType,
      note: 'All users are in Thailand timezone'
    })

    return NextResponse.json({
      message: 'Notification created successfully',
      notification
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    // Find the user
    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify notification belongs to user
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
    }    // Convert time string (HH:mm) to DateTime if scheduledTime is provided
    let scheduledDateTime = existingNotification.scheduledTime
    if (scheduledTime) {
      try {
        const today = new Date()
        const [hours, minutes] = scheduledTime.split(':').map(Number)
        
        // Validate time format
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return NextResponse.json(
            { error: 'Invalid time format. Please use HH:mm format (e.g., 08:30)' },
            { status: 400 }
          )
        }
        
        scheduledDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0)
      } catch (timeError) {
        console.error('Error parsing scheduled time:', timeError)
        return NextResponse.json(
          { error: 'Invalid time format. Please use HH:mm format (e.g., 08:30)' },
          { status: 400 }
        )
      }
    }

    // Update notification
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

    // Find the user
    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify notification belongs to user and delete
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

    // Find the user
    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update notification status
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
