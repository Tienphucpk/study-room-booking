# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** VKU Smart Campus - Study Room Booking Mobile & Web App  
**Team / Student Name:** Võ Tấn Phúc (Tienphucpk)  
**Submission Date:** 21/09/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. **Võ Tấn Phúc** – Student ID: `23ITBxxx` – Role: `Fullstack Mobile & Cloud Architecture` – Contribution: `100%`
* **📱 Standalone APK Direct Download:** [https://expo.dev/artifacts/eas/RDgErAEEnwMFHwxPWiMV4bkEnYqaBGP2AoNek8Lge40.apk](https://expo.dev/artifacts/eas/RDgErAEEnwMFHwxPWiMV4bkEnYqaBGP2AoNek8Lge40.apk)
* **🌐 Expo Build & QR Install Page:** [https://expo.dev/accounts/tubadench28/projects/study-room-booking/builds/d6eb9929-4a6d-489d-bd24-51134e0612b7](https://expo.dev/accounts/tubadench28/projects/study-room-booking/builds/d6eb9929-4a6d-489d-bd24-51134e0612b7)
* **🐙 GitHub Repository:** [https://github.com/Tienphucpk/study-room-booking](https://github.com/Tienphucpk/study-room-booking)
* **🎥 Video Demo (Optional):** *(Dán link YouTube/Drive video quay màn hình nếu có)*

---

## 2. FEATURE IMPLEMENTATION CHECKLIST
| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| **1** | **User Authentication & Role Management** | ✅ Complete | Hỗ trợ Firebase Auth (Email/Mật khẩu & Google OAuth). Phân quyền người dùng tự động: `student` và `admin`. Tự động khôi phục phiên đăng nhập. |
| **2** | **Real-Time Room Discovery & Multi-Filtering** | ✅ Complete | Đồng bộ danh mục phòng học theo thời gian thực qua Firestore `onSnapshot`. Bộ lọc đa tiêu chí: Tòa nhà (A, B, C, V), sức chứa (2–20 chỗ), tiện ích (Máy chiếu, PC cấu hình cao, Điều hòa, Bảng). |
| **3** | **Conflict-Free Slot Booking (Concurrency Safety)** | ✅ Complete | Sử dụng Firestore `runTransaction` để khóa và kiểm tra trùng lịch tức thời, ngăn chặn 100% tình trạng hai sinh viên cùng đặt một phòng vào cùng một khung giờ. |
| **4** | **QR Check-in & Dynamic Time Window** | ✅ Complete | Tự động tạo mã QR độc bản cho mỗi vé đặt phòng (`react-native-qrcode-svg`). Thuật toán kiểm tra cổng check-in thông minh: chỉ mở trước giờ học 15 phút đến hết khung giờ. |
| **5** | **Cyber Obsidian UI & Responsive Desktop Framing** | ✅ Complete | Giao diện hiện đại phong cách Cyber Obsidian & Electric Violet. Hỗ trợ đa nền tảng: trên di động hiển thị toàn màn hình, trên máy tính tự động đóng khung mô phỏng Smartphone (Mobile Phone Frame Container) chống tràn màn hình. |
| **6** | **Admin Dashboard & Sample Data Seeder** | ✅ Complete | Giao diện quản trị thêm phòng mới, kiểm tra tính hợp lệ dữ liệu và nút nạp nhanh dữ liệu phòng mẫu (Seed Data) vào Firestore. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1. Directory Structure
```text
study-room-booking/
├── assets/                 # App icon, splash screen & static graphics
├── src/
│   ├── app/                # Expo Router File-based Navigation
│   │   ├── _layout.tsx     # Root Layout, Theme Provider & Responsive Desktop Frame
│   │   ├── index.tsx       # Main Screen (Room Discovery, My Bookings & QR Tickets)
│   │   ├── admin.tsx       # Admin Room Creation & Database Seeder
│   │   ├── profile.tsx     # Student Profile, Settings & Sign Out
│   │   └── room/[roomId].tsx # Detailed Room View, Date Strip & Time Slot Grid
│   ├── components/         # Reusable UI Components
│   │   ├── AuthGate.tsx    # Session Validation & Cross-platform Login/Register Form
│   │   ├── RoomCard.tsx    # High-contrast Room Card with Live Availability Badges
│   │   └── QRCheckInModal.tsx # Bottom Sheet displaying Dynamic QR Check-In Code
│   ├── services/           # Firebase SDK, Auth, Firestore Queries & Transactions
│   ├── stores/             # Zustand State Store (Session, Filters, Bookings)
│   ├── theme/              # Design Tokens (Colors, Radius, Spacing, Typography)
│   └── utils/              # Check-in time calculation, Filtering algorithms
├── eas.json                # EAS Build profile configurations (Standalone APK)
└── app.json                # Expo SDK 57 project configuration
```

### 3.2. State Management & Data Flow
- **Zustand (`useBookingStore`):** Quản lý trạng thái toàn cục (Global State) siêu nhẹ, bao gồm: thông tin phiên đăng nhập (`session`), bộ lọc phòng đang áp dụng (`filters`), danh sách phòng đệm và các lịch đặt phòng cá nhân.
- **Firebase Firestore Listener:** Thiết lập kết nối hai chiều (Real-time Snapshot), tự động cập nhật lại danh sách phòng và trạng thái trống/bận trên UI ngay khi có người khác vừa đặt phòng thành công.

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS
* **Screenshot 1: Màn hình Đăng nhập & Đăng ký (Cyber Obsidian Auth Screen)**  
  *Giao diện nền tối Obsidian, 2 quả cầu hào quang phát sáng và form đăng nhập bo tròn.*
* **Screenshot 2: Trang chủ danh mục phòng học & Lọc đa tiêu chí**  
  *Thanh tìm kiếm dạng viên thuốc, dải chip chọn Tòa A/B/C/V và thẻ phòng học kèm chấm trạng thái Xanh/Đỏ.*
* **Screenshot 3: Màn hình chi tiết phòng & Chọn khung giờ đặt chỗ**  
  *Dải chọn ngày dạng thẻ đứng và lưới các khung giờ học với màu tím Neon khi được chọn.*
* **Screenshot 4: Thẻ vé điện tử & Modal quét mã QR Check-in**  
  *Vé đặt phòng phong cách Boarding pass và mã QR sắc nét kèm thông báo đếm ngược thời gian check-in 15 phút.*

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### 5.1. Thách thức 1: Xung đột Native Module Google Sign-In trên Expo Go & Web
- **Vấn đề:** Thư viện `@react-native-google-signin` phụ thuộc vào mã nhị phân native C++/Java. Khi khởi chạy trên môi trường Expo Go hoặc trình duyệt Web, lệnh `import` tĩnh gây lỗi crash `TurboModuleRegistry.getEnforcing(...)` ngay khi mở ứng dụng.
- **Giải pháp:** Áp dụng kỹ thuật **Dynamic Lazy-loading**. Đưa lời gọi import native vào hàm điều kiện `require()` và kiểm tra an toàn bằng `Constants.appOwnership !== 'expo' && Platform.OS !== 'web'`. Nhờ đó, ứng dụng hoạt động mượt mà 100% trên cả Expo Go, Web máy tính lẫn bản build Standalone APK.

### 5.2. Thách thức 2: Xử lý tranh chấp đặt phòng (Race Condition) & Lệch múi giờ
- **Vấn đề:** Khi nhiều sinh viên cùng bấm đặt một phòng vào cùng một giây, việc đọc/ghi thông thường (non-atomic write) sẽ gây trùng lịch. Ngoài ra, việc dùng `toISOString().split('T')[0]` gây lệch ngày do chênh lệch múi giờ UTC và giờ địa phương Việt Nam (GMT+7).
- **Giải pháp:** Sử dụng `runTransaction` của Firestore để khóa tài liệu trong quá trình kiểm tra và ghi vé đặt phòng nguyên tử (Atomic). Đồng thời chuẩn hóa ngày theo múi giờ địa phương bằng `new Date().toLocaleDateString('en-CA')`.

### 5.3. Thách thức 3: Giao diện Web bị kéo giãn và nút Đăng xuất không hoạt động trên trình duyệt
- **Vấn đề:** Khi chạy bản Web trên màn hình máy tính lớn, giao diện di động bị kéo tràn 1920px. Đồng thời, `Alert.alert` của React Native Web chỉ gọi `window.alert` và nuốt mất sự kiện `onPress` của các nút bấm xác nhận, khiến chức năng Đăng xuất và Hủy đặt phòng không bấm được.
- **Giải pháp:** Tại `RootLayout`, bọc ứng dụng trong **Khung mô phỏng điện thoại thông minh (Phone Mockup Frame)** tự động căn giữa với độ rộng tối đa 440px khi kích thước màn hình > 520px. Đồng thời phân nhánh xử lý tương thích cho Web bằng `window.confirm` để gọi `signOutUser()` và `logout()` tức thì.
