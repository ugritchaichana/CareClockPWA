import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// GET - Fetch medicines for a user
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

    // First find the user
    const user = await prisma.patient.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }    // Fetch medicines for this user
    const medicines = await prisma.medicine.findMany({
      where: { 
        patientId: user.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    })    // Transform data to match frontend interface
    const transformedMedicines = medicines.map((medicine: any) => ({
      id: medicine.id,
      medicineName: medicine.medicineName,
      medicineDetails: medicine.medicineDetails,
      consumptionType: medicine.consumptionType,
      quantity: medicine.quantity,
      currentStock: medicine.currentStock, // Add currentStock to response
      dosage: medicine.dosage,
      consumptionTimes: {
        morning: medicine.morning,
        afternoon: medicine.afternoon,
        evening: medicine.evening,
        beforeBed: medicine.beforeBed
      },
      medicineImageUrl: medicine.medicineImageUrl,
      createdAt: medicine.createdAt?.toISOString() ?? ''
    }))

    return NextResponse.json({ 
      medicines: transformedMedicines 
    })

  } catch (error) {
    console.error('Error fetching medicines:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new medicine
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const phoneNumber = formData.get('phoneNumber') as string
    const medicineName = formData.get('medicineName') as string
    const medicineDetails = formData.get('medicineDetails') as string
    const consumptionType = formData.get('consumptionType') as string
    const quantity = parseInt(formData.get('quantity') as string)
    const dosage = parseInt(formData.get('dosage') as string)
    const consumptionTimesJson = formData.get('consumptionTimes') as string
    const medicineImage = formData.get('medicineImage') as File | null

    // Parse consumption times
    const consumptionTimes = JSON.parse(consumptionTimesJson)

    if (!phoneNumber || !medicineName || !medicineDetails || !consumptionType) {
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

    let medicineImageUrl = null    // Upload image to Supabase storage if provided
    if (medicineImage) {
      const fileExtension = medicineImage.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      
      const { data, error } = await supabase.storage
        .from('medicine-images')
        .upload(fileName, medicineImage)

      if (error) {
        console.error('Supabase Storage Error:', error)
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        )
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('medicine-images').getPublicUrl(fileName)

      medicineImageUrl = publicUrl
    }    // Create medicine record
    console.log('Creating medicine with data:', {
      patientId: user.id,
      medicineName,
      medicineDetails,
      consumptionType,
      quantity,
      dosage,
      morning: consumptionTimes.morning,
      afternoon: consumptionTimes.afternoon,
      evening: consumptionTimes.evening,
      beforeBed: consumptionTimes.beforeBed,
      medicineImageUrl
    })

    let medicine
    try {      medicine = await prisma.medicine.create({
        data: {
          patientId: user.id,
          medicineName,
          medicineDetails,
          consumptionType,
          quantity,
          currentStock: quantity, // Initialize currentStock with the total quantity
          dosage,
          morning: consumptionTimes.morning,
          afternoon: consumptionTimes.afternoon,
          evening: consumptionTimes.evening,
          beforeBed: consumptionTimes.beforeBed,
          medicineImageUrl
        }
      })
      console.log('Medicine created successfully:', medicine)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save medicine to database', details: dbError },
        { status: 500 }
      )
    }    return NextResponse.json({
      message: 'Medicine added successfully',
      medicine: {
        id: medicine.id,
        medicineName: medicine.medicineName,
        medicineDetails: medicine.medicineDetails,
        consumptionType: medicine.consumptionType,
        quantity: medicine.quantity,
        currentStock: medicine.currentStock, // Include currentStock in response
        dosage: medicine.dosage,
        consumptionTimes: {
          morning: medicine.morning,
          afternoon: medicine.afternoon,
          evening: medicine.evening,
          beforeBed: medicine.beforeBed
        },
        medicineImageUrl: medicine.medicineImageUrl,
        createdAt: medicine.createdAt?.toISOString() ?? ''
      }
    })

  } catch (error) {
    console.error('Error adding medicine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update medicine
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const medicineId = formData.get('medicineId') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const medicineName = formData.get('medicineName') as string
    const medicineDetails = formData.get('medicineDetails') as string
    const consumptionType = formData.get('consumptionType') as string
    const quantity = parseInt(formData.get('quantity') as string)
    const dosage = parseInt(formData.get('dosage') as string)
    const consumptionTimesJson = formData.get('consumptionTimes') as string
    const medicineImage = formData.get('medicineImage') as File | null

    // Parse consumption times
    const consumptionTimes = JSON.parse(consumptionTimesJson)

    if (!medicineId || !phoneNumber || !medicineName || !medicineDetails || !consumptionType) {
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
    const existingMedicine = await prisma.medicine.findFirst({
      where: {
        id: parseInt(medicineId),
        patientId: user.id
      }
    })

    if (!existingMedicine) {
      return NextResponse.json(
        { error: 'Medicine not found or does not belong to user' },
        { status: 404 }
      )
    }

    let medicineImageUrl = existingMedicine.medicineImageUrl

    // Upload new image if provided
    if (medicineImage) {
      const fileExtension = medicineImage.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      
      const { data, error } = await supabase.storage
        .from('medicine-images')
        .upload(fileName, medicineImage)

      if (error) {
        console.error('Supabase Storage Error:', error)
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        )
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('medicine-images').getPublicUrl(fileName)

      medicineImageUrl = publicUrl

      // Delete old image if exists (optional)
      if (existingMedicine.medicineImageUrl) {
        const oldFileName = existingMedicine.medicineImageUrl.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('medicine-images')
            .remove([oldFileName])
        }
      }
    }

    // Update medicine record
    const medicine = await prisma.medicine.update({
      where: { id: parseInt(medicineId) },
      data: {
        medicineName,
        medicineDetails,
        consumptionType,
        quantity,
        dosage,
        morning: consumptionTimes.morning,
        afternoon: consumptionTimes.afternoon,
        evening: consumptionTimes.evening,
        beforeBed: consumptionTimes.beforeBed,
        medicineImageUrl
      }
    })

    return NextResponse.json({
      message: 'Medicine updated successfully',
      medicine: {
        id: medicine.id,
        medicineName: medicine.medicineName,
        medicineDetails: medicine.medicineDetails,
        consumptionType: medicine.consumptionType,
        quantity: medicine.quantity,
        dosage: medicine.dosage,
        consumptionTimes: {
          morning: medicine.morning,
          afternoon: medicine.afternoon,
          evening: medicine.evening,
          beforeBed: medicine.beforeBed
        },
        medicineImageUrl: medicine.medicineImageUrl,
        createdAt: medicine.createdAt?.toISOString() ?? ''
      }
    })

  } catch (error) {
    console.error('Error updating medicine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete medicine
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const medicineId = searchParams.get('medicineId')
    const phoneNumber = searchParams.get('phoneNumber')

    if (!medicineId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Medicine ID and phone number are required' },
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

    // Find medicine to get image URL for deletion
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

    // Delete medicine record (this will also cascade delete related notifications and consumption records)
    await prisma.medicine.delete({
      where: { id: parseInt(medicineId) }
    })

    // Delete image from storage if exists
    if (medicine.medicineImageUrl) {
      const fileName = medicine.medicineImageUrl.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('medicine-images')
          .remove([fileName])
      }
    }

    return NextResponse.json({
      message: 'Medicine deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting medicine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
