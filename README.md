# CareClock

Progressive Web Application ที่ออกแบบมาเพื่อการใช้งานบนมือถือ 100% ด้วย Next.js และ Supabase

## 🚀 คุณสมบัติหลัก

- **📱 Mobile-First Design**: ออกแบบเพื่อมือถือเป็นหลัก
- **💾 LocalStorage**: เก็บข้อมูลในเครื่องได้
- **🔄 Offline Support**: ใช้งานได้แม้ไม่มีอินเทอร์เน็ต
- **⚡ แอปพลิเคชัน**: ติดตั้งเป็นแอพได้
- **🗄️ Supabase Integration**: เชื่อมต่อฐานข้อมูล Supabase
- **🎨 Tailwind CSS**: ใช้ Tailwind สำหรับ Styling

## 🛠️ เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชั่น | คำอธิบาย |
|-----------|---------|----------|
| Next.js | 14.2.5 | React Framework |
| React | 18.3.1 | UI Library |
| TypeScript | 5.5.3 | Type Safety |
| MongoDB | 6.8.0 | Database |
| Mongoose | 8.5.1 | ODM |
| Tailwind CSS | 3.4.4 | CSS Framework |
| Next-PWA | 5.6.0 | Progressive Web App Plugin |

## 📦 การติดตั้ง

1. **ติดตั้ง Dependencies**
```cmd
npm install
```

2. **ตั้งค่า Environment Variables**
สร้างไฟล์ `.env.local` และเพิ่ม:
```env
DATABASE_URL=postgresql://username:password@host:port/database
MONGODB_DB=careclock
NEXT_PUBLIC_APP_NAME=CareClock
NEXT_PUBLIC_APP_VERSION=1.0.0
```

3. **รันโปรเจค**
```cmd
npm run dev
```

## 📋 Scripts

```cmd
npm run dev        # Development mode
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## 🚀 การ Deploy

### แนะนำ: Vercel (ฟรี)
1. Push โค้ดไปยัง GitHub
2. ไปที่ [vercel.com](https://vercel.com)
3. เชื่อมต่อกับ GitHub repository
4. เพิ่ม Environment Variable: `DATABASE_URL`
5. Deploy!

### ทางเลือกอื่น:
- **Netlify** - ฟรี, เหมาะสำหรับ Static Sites
- **Railway** - $5/month, รองรับ full-stack + database
- **DigitalOcean** - $5/month, managed hosting

### ขั้นตอนการ Deploy:
```bash
# 1. Test build locally
pnpm build

# 2. Deploy to Vercel
npx vercel login
npx vercel

# 3. Set environment variables in Vercel dashboard
```

### MongoDB Atlas Setup สำหรับ Production:
1. **Network Access** → Add IP → `0.0.0.0/0` (Allow all)
2. **Database Access** → Ensure readWrite permissions
3. **Copy connection string** for `DATABASE_URL`

## 📁 โครงสร้างโปรเจค
npm run build      # Production build
npm run start      # Production server
npm run lint       # Code linting
```

## 📱 การใช้งานแอปพลิเคชัน

1. เปิดเว็บไซต์ในมือถือ
2. คลิก "ติดตั้งแอพ" เมื่อมี prompt ขึ้นมา
3. แอพจะถูกติดตั้งใน Home Screen
4. ใช้งานได้แบบออฟไลน์

---

**CareClock** - แอปพลิเคชันเว็บที่ออกแบบมาเพื่อมือถือ 📱
