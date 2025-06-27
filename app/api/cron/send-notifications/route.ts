import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.NEXT_PUBLIC_APP_URL || 'https://care-clock.vercel.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
    // ป้องกันการเรียกใช้จากภายนอกโดยเช็ค 'Authorization' header
    // ควรตั้งค่า CRON_SECRET ใน Environment Variables ของ Vercel
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const currentUTCHours = now.getUTCHours();
        const currentUTCMinutes = now.getUTCMinutes();
        
        // สร้างเวลาเป้าหมายเป็น UTC และใช้วันที่ 1970-01-01 
        // เพื่อให้ตรงกับข้อมูล @db.Time() ที่ Prisma บันทึกไว้ในฐานข้อมูล
        const targetTimeUTC = new Date(Date.UTC(1970, 0, 1, currentUTCHours, currentUTCMinutes, 0));

        // ค้นหาการแจ้งเตือนทั้งหมดที่ถึงเวลาส่งในนาทีนี้
        const notificationsToSend = await prisma.medicineNotification.findMany({
            where: {
                isActive: true,
                scheduledTime: targetTimeUTC, // เปรียบเทียบเวลาแบบตรงๆ
            },
            include: {
                patient: {
                    include: {
                        pushSubscriptions: true,
                    }
                },
                medicine: true
            }
        });

        if (notificationsToSend.length === 0) {
            return NextResponse.json({ message: 'No notifications to send at this time.' });
        }

        const sendPromises = notificationsToSend.flatMap((notification) => {
            const payload = JSON.stringify({
                title: notification.title,
                body: `ถึงเวลากินยา ${notification.medicine.medicineName} (${notification.medicine.dosage} เม็ด)`,
                icon: '/asset/CareClockLOGO.PNG',
                badge: '/asset/CareClockLOGO.PNG',
                data: {
                    url: `/?notification_id=${notification.id}` // URL ที่จะเปิดเมื่อคลิก
                }
            });

            // ส่งแจ้งเตือนไปยังทุก subscription ของผู้ป่วยคนนั้น
            return notification.patient.pushSubscriptions.map((sub: any) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    },
                    payload
                ).catch((err: any) => {
                    console.error(`Failed to send push to ${sub.endpoint}. Error: ${err.message}`);
                    if (err.statusCode === 410) {
                        return prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                })
            );
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, message: `Sent ${notificationsToSend.length} notifications.` });

    } catch (error) {
        console.error('Cron job execute error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
