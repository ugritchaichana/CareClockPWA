import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const type = searchParams.get('type');

    if (type === 'patient-data' && phoneNumber) {
      const patient = await prisma.patient.findUnique({
        where: { phoneNumber },
      });

      if (patient) {
        return NextResponse.json({
          message: 'Patient data found',
          data: patient,
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ 
      message: 'Invalid request type',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, action, phoneNumber, data } = body;

    if (type === 'patient-data') {
      if (action === 'update') {
        const updatedPatient = await prisma.patient.update({
          where: { phoneNumber },
          data: data, // Correctly pass the data object
        });
        return NextResponse.json({
          message: 'Patient data updated successfully',
          data: updatedPatient,
          timestamp: new Date().toISOString(),
        });
      } else {
        const newPatient = await prisma.patient.create({
          data: {
            phoneNumber,
            ...data, // Spread the data object to match the schema
          },
        });
        return NextResponse.json({
          message: 'Patient data saved successfully',
          data: newPatient,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const newCareData = await prisma.careData.create({
      data: {
        data: body,
      },
    });

    return NextResponse.json({
      message: 'Data saved successfully',
      data: newCareData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const type = searchParams.get('type');

    if (type === 'patient-data' && phoneNumber) {
      await prisma.patient.delete({
        where: { phoneNumber },
      });
      return NextResponse.json({
        message: 'Patient data deleted successfully',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
