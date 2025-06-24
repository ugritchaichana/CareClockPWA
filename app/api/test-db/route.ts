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
    const newCareData = await prisma.careData.create({
      data: {
        data: body,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data saved to Supabase successfully',
      id: newCareData.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save data to Supabase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
