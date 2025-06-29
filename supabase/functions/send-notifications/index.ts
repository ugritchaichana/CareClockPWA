import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";
import * as webpush from "webpush";

serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const vapidKeys = {
      publicKey: Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
      privateKey: Deno.env.get("VAPID_PRIVATE_KEY"),
    };

    // --- จุดที่แก้ไข ---
    const supabase = createClient(
      Deno.env.get("NEXT_PUBLIC_SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } } // เพิ่ม option นี้
    );
    // --- สิ้นสุดจุดที่แก้ไข ---

    const appServer = await webpush.ApplicationServer.new({
      contactInformation: `mailto:${Deno.env.get("VAPID_EMAIL") || "support@example.com"}`,
      vapidKeys,
    });

    const bkkNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const start = new Date(bkkNow);
    start.setSeconds(0, 0);
    const end = new Date(bkkNow);
    end.setSeconds(59, 999);

    const { data, error } = await supabase
      .from("medicine_notifications")
      .select(`
        id,
        title,
        scheduledTime,
        patient:patients (
          pushSubscriptions:push_subscriptions (id, endpoint, p256dh, auth)
        ),
        medicine:medicine (medicineName, dosage)
      `)
      .eq("isActive", true)
      .gte("scheduledTime", start.toISOString())
      .lte("scheduledTime", end.toISOString());

    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ message: "No notifications to send." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const promises = data.flatMap((n) => {
      const payload = JSON.stringify({
        title: n.title,
        body: `ถึงเวลากินยา ${n.medicine.medicineName} (${n.medicine.dosage} เม็ด)`,
        icon: "/asset/CareClockLOGO.PNG",
        data: { url: `/?notification_id=${n.id}` },
      });
      return n.patient.pushSubscriptions.map(async (sub) => {
        try {
          const subscriber = appServer.subscribe({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          });
          await subscriber.pushTextMessage(payload, {});
        } catch (err) {
          console.error(`Push fail ${sub.endpoint}`, err);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, message: `Sent ${data.length} notifications.` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cron job error:", err);
    return new Response(String(err?.message || err), { status: 500 });
  }
});