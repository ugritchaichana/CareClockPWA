# 📱 คู่มือการทดสอบ PWA บน iOS สำหรับ CareClock

## 🎯 จุดประสงค์
คู่มือนี้จะช่วยให้คุณทดสอบความถูกต้องและประสิทธิภาพของ PWA CareClock บนอุปกรณ์ iOS

## 📋 รายการตรวจสอบก่อนทดสอบ

### ✅ ความต้องการพื้นฐาน
- [ ] อุปกรณ์ iOS (iPhone หรือ iPad)
- [ ] Safari browser (ต้องใช้ Safari เท่านั้น)
- [ ] iOS 11.3 ขึ้นไป
- [ ] การเชื่อมต่ออินเทอร์เน็ต
- [ ] พื้นที่ว่างบน Home Screen

### ✅ การตั้งค่า iOS
- [ ] เปิด JavaScript ใน Safari
- [ ] อนุญาต Notifications ในการตั้งค่า
- [ ] เปิด Location Services (ถ้าจำเป็น)

## 🚀 ขั้นตอนการทดสอบ

### 1. 🌐 การเข้าถึงเว็บไซต์
```
1. เปิด Safari บน iOS
2. ไปที่ URL: https://your-domain.com
3. รอให้หน้าเว็บโหลดเสร็จ
4. ตรวจสอบว่าหน้าเว็บแสดงผลถูกต้อง
```

### 2. 📲 การติดตั้ง PWA
```
1. กดปุ่ม Share (ไอคอนสี่เหลี่ยม + ลูกศร) ใน Safari
2. เลื่อนหาตัวเลือก "Add to Home Screen"
3. กดเลือก "Add to Home Screen"
4. แก้ไขชื่อแอพ (ถ้าต้องการ)
5. กด "Add" เพื่อติดตั้ง
6. ตรวจสอบไอคอนแอพบน Home Screen
```

### 3. 🔍 การทดสอบหน้าทดสอบ
```
1. ไปที่ /test/pwa-ios ใน browser
2. กด "Run All Tests"
3. ตรวจสอบผลการทดสอบ:
   ✅ Service Worker registration
   ✅ Notification support
   ✅ Vibration support
   ✅ Audio support
   ✅ Offline capability
   ✅ iOS specific features
```

### 4. 🔔 การทดสอบ Notifications
```
1. เปิดแอพจาก Home Screen
2. ไปที่หน้า "การแจ้งเตือน"
3. กดปุ่ม "ตั้งแจ้งเตือนใหม่"
4. เลือกยาและตั้งเวลา
5. อนุญาต Notifications เมื่อถูกถาม
6. รอให้เวลาผ่านไปและดูการแจ้งเตือน
```

### 5. 📱 การทดสอบ Offline Mode
```
1. เปิดแอพใน standalone mode
2. ปิด WiFi และ Mobile Data
3. ลองใช้งานแอพ
4. ตรวจสอบว่าหน้า offline แสดงขึ้น
5. เปิดอินเทอร์เน็ตและ sync ข้อมูล
```

### 6. 🎵 การทดสอบเสียงและการสั่น
```
1. ไปที่หน้าทดสอบ /test/ios-notification
2. ทดสอบเสียงแจ้งเตือน
3. ทดสอบการสั่น
4. ตรวจสอบการทำงานร่วมกัน
```

## 🧪 รายการการทดสอบแบบละเอียด

### A. การทดสอบ UI/UX
- [ ] หน้าจอแสดงผลถูกต้องในทุกขนาด
- [ ] ปุ่มมีขนาดเหมาะสมสำหรับการสัมผัส
- [ ] การเลื่อนหน้าจอราบรื่น
- [ ] การ transition และ animation ทำงานถูกต้อง
- [ ] สีและ theme ตรงตามที่ออกแบบ
- [ ] Font แสดงผลถูกต้อง (Thai + English)

### B. การทดสอบ Navigation
- [ ] การนำทางระหว่างหน้าต่างๆ
- [ ] Bottom navigation ทำงานถูกต้อง
- [ ] Back button และ gesture navigation
- [ ] การ deep linking (ถ้ามี)

### C. การทดสอบ Forms
- [ ] การกรอกข้อมูลผู้ใช้
- [ ] การเพิ่มยา
- [ ] การตั้งเวลาแจ้งเตือน
- [ ] การอัพโหลดรูปภาพ
- [ ] Validation ของข้อมูล

### D. การทดสอบ Storage
- [ ] ข้อมูลถูกบันทึกใน localStorage
- [ ] ข้อมูลคงอยู่หลังปิดแอพ
- [ ] การ sync ข้อมูลกับเซิร์ฟเวอร์
- [ ] การจัดการข้อมูลเมื่อพื้นที่เต็ม

### E. การทดสอบ Performance
- [ ] เวลาในการโหลดแอพ
- [ ] ความเร็วในการ navigate
- [ ] การใช้งาน memory
- [ ] Battery usage
- [ ] ความราบรื่นของ animation

## 🔧 การแก้ไขปัญหาที่พบบ่อย

### ❌ แอพไม่สามารถติดตั้งได้
**สาเหตุ:**
- ใช้ browser ที่ไม่ใช่ Safari
- iOS version เก่าเกินไป
- manifest.json ไม่ถูกต้อง

**วิธีแก้:**
- ใช้ Safari เท่านั้น
- อัพเดท iOS
- ตรวจสอบ manifest.json

### ❌ Notifications ไม่ทำงาน
**สาเหตุ:**
- ไม่ได้อนุญาต notifications
- แอพไม่ได้เปิดใน standalone mode
- ไม่มี user interaction

**วิธีแก้:**
- อนุญาต notifications ในการตั้งค่า
- เปิดแอพจาก Home Screen
- ต้องมี user interaction ก่อน

### ❌ เสียงไม่ออก
**สาเหตุ:**
- โหมดเงียบเปิดอยู่
- ไม่มี user interaction
- Audio context ไม่ได้ initialize

**วิธีแก้:**
- ปิดโหมดเงียบ
- กดหน้าจอก่อน
- ใช้ audio initialization

### ❌ การสั่นไม่ทำงาน
**สาเหตุ:**
- ทดสอบบน simulator
- การตั้งค่าการสั่นถูกปิด

**วิธีแก้:**
- ทดสอบบนอุปกรณ์จริง
- เปิดการตั้งค่าการสั่น

## 📊 รายงานผลการทดสอบ

### ✅ สิ่งที่ควรทำงานได้:
- [x] การติดตั้ง PWA
- [x] Standalone mode
- [x] Offline functionality
- [x] Local storage
- [x] Touch interactions
- [x] Responsive design
- [x] Basic notifications
- [x] Audio playback
- [x] Vibration (บนอุปกรณ์จริง)

### ⚠️ ข้อจำกัดบน iOS:
- [ ] Background sync จำกัด
- [ ] Push notifications จำกัด
- [ ] Service worker มีข้อจำกัด
- [ ] File system access จำกัด
- [ ] Camera access มีข้อจำกัด

## 🎯 เป้าหมายการทดสอบ

### Primary Goals:
1. ✅ แอพติดตั้งและเปิดได้
2. ✅ UI/UX ทำงานถูกต้อง
3. ✅ การแจ้งเตือนพื้นฐานทำงาน
4. ✅ ข้อมูลถูกบันทึก

### Secondary Goals:
1. ✅ Offline mode ทำงาน
2. ✅ Performance ดี
3. ✅ Audio และ vibration ทำงาน
4. ✅ ไม่มี error ใน console

## 🚀 URL สำหรับการทดสอบ

### หน้าหลัก:
- https://your-domain.com/

### หน้าทดสอบ:
- https://your-domain.com/test/pwa-ios
- https://your-domain.com/test/ios-notification

### หน้าแต่ละ feature:
- https://your-domain.com/page/userinfo
- https://your-domain.com/page/medicine
- https://your-domain.com/page/notification
- https://your-domain.com/page/summary

---

## 💡 Tips การทดสอบ

1. **ใช้ Safari เท่านั้น** - Chrome บน iOS ไม่รองรับ PWA ครบ
2. **ทดสอบบนอุปกรณ์จริง** - Simulator มีข้อจำกัด
3. **เปิด Debug Console** - เพื่อดู error logs
4. **ทดสอบใน Network ต่างๆ** - WiFi, 4G, Offline
5. **ทดสอบหลายอุปกรณ์** - iPhone, iPad ต่างรุ่น
6. **บันทึกผลการทดสอบ** - เพื่อการปรับปรุง

**Happy Testing! 🎉**
