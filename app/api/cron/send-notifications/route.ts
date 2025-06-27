// app/api/cron/send-notifications/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush, { PushSubscription } from 'web-push'; // แก้ไขการ import เล็กน้อย

// ตั้งค่า web-push ด้วย VAPID keys ของคุณ
webpush.setVapidDetails(
  'mailto:support@careclock.com', // ใช้อีเมลของคุณ หรืออีเมลสำหรับ support
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
        const currentHours = now.getUTCHours() + 7; // ปรับเป็นเวลาไทย (UTC+7)
        const currentMinutes = now.getUTCMinutes();
        
        // สร้างเวลาเป้าหมายโดยใช้ปี 1970 เพื่อเปรียบเทียบเฉพาะเวลา
        // เนื่องจาก Prisma เก็บ @db.Time() เป็นเวลาแบบไม่มีวันที่
        const targetTime = new Date(Date.UTC(1970, 0, 1, currentHours, currentMinutes, 0));

        // ค้นหาการแจ้งเตือนทั้งหมดที่ถึงเวลาส่งในนาทีนี้
        const notificationsToSend = await prisma.medicineNotification.findMany({
            where: {
                isActive: true,
                scheduledTime: {
                    // ใช้ gte และ lt เพื่อหาเวลาในช่วง 1 นาทีนั้น
                    gte: new Date(Date.UTC(1970, 0, 1, currentHours, currentMinutes, 0)),
                    lt: new Date(Date.UTC(1970, 0, 1, currentHours, currentMinutes + 1, 0))
                }
            },
            include: {
                patient: {
                    include: {
                        // โค้ดส่วนนี้ถูกต้องเมื่อ Prisma Client ถูก generate ใหม่
                        pushSubscriptions: true, 
                    }
                },
                medicine: true
            }
        });

        if (notificationsToSend.length === 0) {
            return NextResponse.json({ message: 'No notifications to send at this time.' });
        }

        const sendPromises = notificationsToSend.flatMap(notification => {
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
            return notification.patient.pushSubscriptions.map((sub: { id: number, endpoint: string, p256dh: string, auth: string }) => // <-- เพิ่ม Type ให้ sub
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    },
                    payload
                ).catch((err: any) => { // <-- เพิ่ม Type ให้ err
                    console.error(`Failed to send push to ${sub.endpoint}. Error: ${err.message}`);
                    if (err.statusCode === 410) {
                        // ถ้า subscription หมดอายุ (status 410) ให้ลบออกจาก DB
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