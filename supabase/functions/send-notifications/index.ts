import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"
import webpush from "web-push"

// Type definitions for clarity
interface PushSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Medicine {
  medicineName: string;
  dosage: number;
}

interface NotificationPayload {
  id: number;
  title: string;
  patient: {
    pushSubscriptions: PushSubscription[];
  };
  medicine: Medicine;
}

serve(async (req) => {
  // 1. ตรวจสอบ Authorization Header
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 2. ตั้งค่า Web Push และ Supabase Client
    const vapidKeys = {
      publicKey: Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!,
      privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
    }
    webpush.setVapidDetails(
      `mailto:${Deno.env.get('VAPID_EMAIL') || 'support@example.com'}`,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    )

    const supabaseClient = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Query หาการแจ้งเตือนที่ถึงเวลา
    const now = new Date()
    const currentUTCHours = now.getUTCHours()
    const currentUTCMinutes = now.getUTCMinutes()

    const targetTime = `${String(currentUTCHours).padStart(2, '0')}:${String(currentUTCMinutes).padStart(2, '0')}:00`

    const { data: notificationsToSend, error: queryError } = await supabaseClient
      .from('medicine_notifications')
      .select(`
        id,
        title,
        patient:patients (
          pushSubscriptions:push_subscriptions (id, endpoint, p256dh, auth)
        ),
        medicine:medicines (medicineName, dosage)
      `)
      .eq('isActive', true)
      .eq('scheduledTime', targetTime)

    if (queryError) {
      throw queryError
    }

    if (!notificationsToSend || notificationsToSend.length === 0) {
      return new Response(JSON.stringify({ message: 'No notifications to send at this time.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. ส่ง Push Notification
    const sendPromises = (notificationsToSend as unknown as NotificationPayload[]).flatMap((notification) => {
      const payload = JSON.stringify({
        title: notification.title,
        body: `ถึงเวลากินยา ${notification.medicine.medicineName} (${notification.medicine.dosage} เม็ด)`,
        icon: '/asset/CareClockLOGO.PNG',
        data: { url: `/?notification_id=${notification.id}` },
      })

      return notification.patient.pushSubscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        ).catch(async (err: any) => { // Type 'any' is acceptable here for error handling
          console.error(`Failed to send push to ${sub.endpoint}. Status: ${err.statusCode}`)
          if (err.statusCode === 410) {
            await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
          }
        })
      )
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true, message: `Sent ${notificationsToSend.length} notifications.` }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Cron job execute error:', error)
    return new Response(String(error?.message || error), { status: 500 })
  }
})