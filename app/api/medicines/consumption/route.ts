import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Record medicine consumption (taken/skipped)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      phoneNumber, 
      medicineId, 
      notificationId,
      status, // 'taken' or 'skipped'
      dosageTaken,
      notes 
    } = body

    if (!phoneNumber || !medicineId || !status) {
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
    }

    const now = new Date()

    // Record consumption
    const consumption = await prisma.medicineConsumption.create({
      data: {
        patientId: user.id,
        medicineId: parseInt(medicineId),
        notificationId: notificationId ? parseInt(notificationId) : null,
        scheduledAt: now, // For now, use current time as scheduled time
        consumedAt: status === 'taken' ? now : null,
        dosageTaken: dosageTaken || (status === 'taken' ? medicine.dosage : 0),
        status,
        notes
      }
    })

    // Update medicine stock if taken
    if (status === 'taken' && dosageTaken) {
      await prisma.medicine.update({
        where: { id: parseInt(medicineId) },
        data: {
          currentStock: Math.max(0, medicine.currentStock - dosageTaken)
        }
      })
    }

    return NextResponse.json({
      message: 'Consumption recorded successfully',
      consumption
    })

  } catch (error) {
    console.error('Error recording consumption:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch consumption statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phoneNumber = searchParams.get('phoneNumber')
    const medicineId = searchParams.get('medicineId') // Optional: filter by specific medicine

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
    }

    let whereClause: any = { patientId: user.id }
    if (medicineId) {
      whereClause.medicineId = parseInt(medicineId)
    }

    // Get consumption statistics grouped by medicine
    const consumptions = await prisma.medicineConsumption.groupBy({
      by: ['medicineId', 'status'],
      where: whereClause,
      _count: {
        status: true
      }
    })    // Get medicine details for the statistics
    const medicineIds = Array.from(new Set(consumptions.map((c: any) => c.medicineId)))
    const medicines = await prisma.medicine.findMany({
      where: {
        id: { in: medicineIds },
        patientId: user.id
      },
      select: {
        id: true,
        medicineName: true,
        medicineImageUrl: true,
        currentStock: true,
        dosage: true
      }
    })

    // Format statistics
    const statistics = medicines.map((medicine: any) => {
      const medicineConsumptions = consumptions.filter((c: any) => c.medicineId === medicine.id)
      
      const taken = medicineConsumptions.find((c: any) => c.status === 'taken')?._count.status || 0
      const skipped = medicineConsumptions.find((c: any) => c.status === 'skipped')?._count.status || 0
      const missed = medicineConsumptions.find((c: any) => c.status === 'missed')?._count.status || 0
      const pending = medicineConsumptions.find((c: any) => c.status === 'pending')?._count.status || 0

      return {
        medicine,
        statistics: {
          taken,
          skipped,
          missed,
          pending,
          total: taken + skipped + missed + pending
        }
      }
    })

    return NextResponse.json({ 
      statistics 
    })

  } catch (error) {
    console.error('Error fetching consumption statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
