import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$connect();
    const collections = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      collections: collections,
      database: 'postgres',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Supabase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test creating a simple log entry or use existing model
    // Since we don't have careData model, let's create a test patient instead
    const testPatient = await prisma.patient.create({
      data: {
        prefix: 'นาย',
        firstName: 'ทดสอบ',
        lastName: 'ระบบ',
        age: 30,
        phoneNumber: `test_${Date.now()}`,
        medicalRight: 'ประกันสังคม',
        chronicDiseases: 'ไม่มี',
        drugAllergy: 'ไม่มี',
        profileImageUrl: null
      },
    });

    // Clean up test data immediately
    await prisma.patient.delete({
      where: { id: testPatient.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Database test completed successfully - Created and deleted test patient',
      testData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing database:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
