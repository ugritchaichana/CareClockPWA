// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { subscription, phoneNumber } = await request.json();

    if (!subscription?.endpoint || !phoneNumber) {
      return NextResponse.json({ error: 'Missing subscription or phoneNumber' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({ where: { phoneNumber } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    // บันทึกหรืออัปเดต subscription โดยใช้ endpoint เป็น unique key
    // Prisma Client ที่อัปเดตแล้วจะรู้จัก 'pushSubscription'
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        patientId: patient.id,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        patientId: patient.id,
      },
    });

    return NextResponse.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}