import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json({ status: 'error', message: 'Phone number is required' }, { status: 400 });
    }

    const user = await prisma.patient.findUnique({
      where: { phoneNumber },
    });

    if (user) {
      return NextResponse.json({ status: 'success', data: user });
    } else {
      return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ status: 'error', message: 'An error occurred during login.' }, { status: 500 });
  }
}
