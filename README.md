# BÀI THỰC HÀNH 6: CHAT NHÓM, GỬI ẢNH, TRẠNG THÁI ĐÃ XEM VÀ THÔNG BÁO

> **Ứng dụng ConnectChat (React Native CLI + Firebase Realtime Database + Cloudinary)**  
> Môn học: Lập trình ứng dụng di động nâng cao

---

## 📋 MỤC LỤC
1. [Giới thiệu các tính năng hoàn thành](#1-giới-thiệu-các-tính-năng-hoàn-thành)
2. [Cấu trúc mã nguồn](#2-cấu-trúc-mã-nguồn)
3. [Hướng dẫn cấu hình Firebase](#3-hướng-dẫn-cấu-hình-firebase)
4. [Hướng dẫn cấu hình Cloudinary (Unsigned Preset)](#4-hướng-dẫn-cấu-hình-cloudinary-unsigned-preset)
5. [Quy tắc bảo mật Firebase (database.rules.json)](#5-quy-tắc-bảo-mật-firebase-databaserulesjson)
6. [Báo cáo giải thích Security Rules & Chứng minh từ chối](#6-báo-cáo-giải-thích-security-rules--chứng-minh-từ-chối)
7. [Hướng dẫn cài đặt và chạy ứng dụng](#7-hướng-dẫn-cài-đặt-và-chạy-ứng-dụng)

---

## 1. GIỚI THIỆU CÁC TÍNH NĂNG HOÀN THÀNH

### PHẦN A – BẮT BUỘC (8 điểm)
1. **Trạng thái trong cuộc trò chuyện (1.5 điểm)**
   - **Đang soạn tin…**: Khi đối phương gõ phím, thanh tiêu đề hiển thị `đang soạn tin…`. Tự động tắt sau 3 giây không gõ, khi gửi tin hoặc khi thoát màn hình chat.
   - **Đã gửi / Đã xem**: Tin nhắn cuối cùng của người gửi hiển thị `Đã gửi` hoặc `Đã xem · HH:mm` theo thời gian thực (được xác thực thông qua node `readStatus/{convId}/{uid}`).
   - **Thời gian hoạt động**: Khi đối phương offline, tiêu đề hiển thị `Hoạt động X phút trước`, `Hoạt động X giờ trước`, `Hoạt động X ngày trước` (tính từ trường `lastSeen`).
   - **`onDisconnect()`**: Áp dụng cho cả trạng thái `typing/{convId}/{uid}` và `users/{uid}/isOnline`, đảm bảo không bị kẹt khi app bị tắt đột ngột hoặc mất mạng.

2. **Thu hồi và tương tác với tin nhắn (1.5 điểm)**
   - **Nhấn giữ tin nhắn**: Mở menu gồm Sao chép nội dung, Trả lời (Reply quote), Thu hồi (chỉ áp dụng với tin của mình) và hàng 5 biểu tượng cảm xúc (👍 ❤️ 😂 😮 😢).
   - **Thu hồi tin**: Đánh dấu `recalled: true` và cập nhật `text: "Tin nhắn đã được thu hồi"`. Node tin nhắn vẫn được lưu trữ trên Firebase để bảo toàn tính toàn vẹn dữ liệu.
   - **Đồng bộ Home**: Nếu tin cuối cùng của cuộc trò chuyện bị thu hồi, `lastMessage` ở màn hình Home của mọi thành viên tự động cập nhật `Tin nhắn đã được thu hồi`.
   - **Cảm xúc (Reactions)**: Hiển thị ngay dưới bong bóng tin kèm bộ đếm số lượng (ví dụ `❤️ 2  👍 1`). Hỗ trợ nhấn để toggle cảm xúc.

3. **Gửi ảnh (2.0 điểm)**
   - **Nút 📷**: Hỗ trợ 2 lựa chọn: *Chụp ảnh mới* (từ Camera) hoặc *Chọn từ thư viện* (`react-native-image-picker`).
   - **Xin quyền truy cập Camera**: Sử dụng `PermissionsAndroid.request`; nếu người dùng từ chối thì hiển thị thông báo Alert rõ ràng.
   - **Thu nhỏ ảnh trước khi tải lên**: Cấu hình `maxWidth: 1024, maxHeight: 1024, quality: 0.8` (cạnh dài ≤ 1024px) để tối ưu dung lượng và băng thông.
   - **Tải lên Cloudinary**: Dùng Unsigned Upload Preset (không đưa API Secret vào mã nguồn). Chỉ URL ảnh an toàn (`secure_url`) được lưu vào Realtime Database.
   - **Bong bóng tạm với loading spinner**: Trong lúc tải ảnh, hiển thị bong bóng tạm kèm `ActivityIndicator`. Nếu tải lỗi thì xuất hiện nút "⚠️ Lỗi tải ảnh. Thử lại".
   - **Xem ảnh toàn màn hình**: Nhấn vào ảnh bất kỳ để mở Modal Full-screen Image Viewer.
   - **Hiển thị ở màn hình Home**: Tin cuối là ảnh hiển thị `📷 Hình ảnh`, tin cuối là vị trí hiển thị `📍 Vị trí`.

4. **Chat nhóm (2.0 điểm)**
   - **Màn hình Tạo nhóm (`CreateGroupScreen`)**: Gồm ô nhập tên nhóm và danh sách bạn bè kèm checkbox chọn thành viên (bắt buộc chọn tối thiểu 2 người ngoài bản thân để đảm bảo nhóm từ 3 người).
   - **Giao diện chat nhóm**: Tin nhắn của thành viên khác hiển thị avatar và họ tên phía trên bong bóng tin.
   - **Tiêu đề nhóm**: Hiển thị tên nhóm và số lượng thành viên đang trực tuyến (ví dụ: `3 thành viên đang online`).
   - **Màn hình Home**: Hiển thị đầy đủ cả chat 1-1 và nhóm chat, sắp xếp giảm dần theo thời gian tin nhắn mới nhất. Mỗi thành viên có số tin chưa đọc riêng biệt.
   - Hỗ trợ đầy đủ tin văn bản, tin vị trí bản đồ và tin hình ảnh trong nhóm.

5. **Màn hình Thông báo dữ liệu thật (1.0 điểm)**
   - Ghi thông báo thời gian thực vào node `notifications/{uid}/{id}` trong các tình huống:
     + Có tin nhắn mới trong cuộc trò chuyện;
     + Được người khác thêm vào nhóm chat mới;
     + Có người thả cảm xúc vào tin nhắn của mình.
   - **Badge thông báo**: Tab "Thông báo" ở Bottom Navigation hiển thị badge số lượng thông báo chưa đọc.
   - **Điều hướng thông minh**: Nhấn vào thông báo sẽ tự động đánh dấu đã đọc và mở đúng màn hình cuộc trò chuyện tương ứng.
   - Có nút **"Đọc tất cả"** để đánh dấu toàn bộ thông báo đã đọc trong 1 lần nhấn.

---

### PHẦN B – YÊU CẦU KỸ THUẬT
- **Multi-path update & `increment(1)`**: Ghi tin nhắn, cập nhật `lastMessage`, thời gian và tăng số tin chưa đọc của các thành viên bằng toán tử `increment(1)` của Firebase trong duy nhất **MỘT** lệnh `update(ref(database), updates)`.
- **Phân trang tin nhắn (Pagination)**: Lần đầu lấy 20 tin nhắn mới nhất bằng `limitToLast(20)`. Khi cuộn lên đầu danh sách, hệ thống tải thêm 20 tin cũ hơn mà không làm nhảy vị trí cuộn nhờ `FlatList` với thuộc tính `inverted={true}`.
- **Tách biệt Service**: Mã nguồn Firebase và Cloudinary được gom hoàn toàn vào thư mục `src/services/` (`chatService.ts`, `groupService.ts`, `uploadService.ts`, `notificationService.ts`, `userService.ts`, `authService.ts`).
- **Cleanup Listeners**: Tất cả Firebase `onValue` listeners đều có hàm hủy trả về trong cleanup của `useEffect`.

---

### PHẦN C – TÍNH NĂNG NÂNG CAO (Cộng điểm)
- **Hồ sơ cá nhân**: Màn hình Cài đặt cho phép đổi Họ tên và Ảnh đại diện (tải ảnh mới lên Cloudinary). Ảnh mới tự động đồng bộ trên Home, Danh bạ và Chat.
- **Trả lời tin nhắn (Reply/Quote)**: Nhấn giữ tin -> chọn "Trả lời", ô nhập tin hiển thị trích dẫn nội dung tin nhắn. Tin gửi đi kèm thẻ trích dẫn đẹp mắt.
- **Tìm kiếm nội dung tin nhắn**: Nút tìm kiếm (🔍) trên thanh tiêu đề cho phép lọc nhanh các tin nhắn chứa từ khóa trong cuộc trò chuyện.
- **Quản trị nhóm**: Hệ thống tin nhắn hệ thống (`type: 'system'`) thông báo khi tạo nhóm, đổi tên nhóm hoặc rời nhóm.

---

## 2. CẤU TRÚC MÃ NGUỒN

```
th3/
├── android/
├── ios/
├── database.rules.json             # File luật bảo mật Firebase Realtime Database
├── README.md                       # Hướng dẫn cấu hình & Báo cáo kỹ thuật
├── src/
│   ├── components/
│   │   ├── Avatar.tsx              # Component ảnh đại diện kèm chấm online
│   │   ├── Icons.tsx               # Hệ thống biểu tượng SVG tự vẽ (Chat, Users, Bell, Camera,...)
│   │   └── SearchBar.tsx           # Thanh tìm kiếm tái sử dụng
│   ├── context/
│   │   └── AppContext.tsx          # Quản lý trạng thái toàn cục (Auth, Chat, Notif, Theme)
│   ├── data/
│   │   └── mockData.ts             # Dữ liệu dự phòng
│   ├── navigation/
│   │   └── RootNavigator.tsx       # Bottom Tabs (Home, Contacts, Notif, Settings) & Stack Navigator
│   ├── screens/
│   │   ├── ChatDetailScreen.tsx    # Màn hình chi tiết cuộc trò chuyện (1-1 & Nhóm)
│   │   ├── ContactsScreen.tsx      # Màn hình danh bạ bạn bè
│   │   ├── CreateGroupScreen.tsx   # Màn hình tạo nhóm chat mới
│   │   ├── HomeScreen.tsx          # Màn hình danh sách cuộc trò chuyện
│   │   ├── LoginScreen.tsx         # Màn hình đăng nhập
│   │   ├── NotificationsScreen.tsx # Màn hình thông báo thời gian thực
│   │   ├── RegisterScreen.tsx      # Màn hình đăng ký
│   │   └── SettingsScreen.tsx      # Màn hình cài đặt & chỉnh sửa hồ sơ
│   ├── services/
│   │   ├── authService.ts          # Xác thực Firebase Auth
│   │   ├── chatService.ts          # Gửi tin nhắn, multi-path update, thu hồi, cảm xúc, typing, readStatus
│   │   ├── cloudinaryConfig.ts     # Cấu hình cloudName và uploadPreset
│   │   ├── firebase.ts             # Khởi tạo Firebase App, Auth, Database
│   │   ├── firebaseConfig.ts       # Thông số kết nối Firebase SDK
│   │   ├── groupService.ts         # Nghiệp vụ tạo nhóm và quản trị thành viên
│   │   ├── locationService.ts      # Xin quyền và lấy tọa độ GPS
│   │   ├── notificationService.ts  # Ghi và lắng nghe thông báo thời gian thực
│   │   ├── uploadService.ts        # Chụp ảnh, chọn ảnh và tải lên Cloudinary
│   │   ├── userService.ts          # Đồng bộ hồ sơ người dùng & User Presence
│   │   └── index.ts
│   ├── theme/
│   └── types/
│       └── index.ts                # Định nghĩa kiểu dữ liệu TypeScript
```

---

## 3. HƯỚNG DẪN CẤU HÌNH FIREBASE

Thông tin cấu hình Firebase đã được thiết lập sẵn trong file `src/services/firebaseConfig.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyCF-ozgZR3xWAghqxWtUf-pWRZcoOsFPc4",
  authDomain: "th5-a7e16.firebaseapp.com",
  databaseURL: "https://th5-a7e16-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "th5-a7e16",
  storageBucket: "th5-a7e16.firebasestorage.app",
  messagingSenderId: "765987122517",
  appId: "1:765987122517:web:a6217a113b2fd2ce8bd3dc",
};
```

Nếu bạn muốn kết nối với dự án Firebase của riêng bạn:
1. Mở **Firebase Console** (https://console.firebase.google.com).
2. Tạo dự án mới hoặc chọn dự án hiện có.
3. Kích hoạt **Authentication** -> Bật phương thức **Email/Password**.
4. Kích hoạt **Realtime Database** -> Chọn vị trí (ví dụ: `Singapore - asia-southeast1`).
5. Copy thông tin `firebaseConfig` từ mục *Project Settings -> General -> Web Apps* và dán vào `src/services/firebaseConfig.ts`.
6. Sang tab **Rules** của Realtime Database, copy toàn bộ nội dung file `database.rules.json` và nhấn **Publish**.

---

## 4. HƯỚNG DẪN CẤU HÌNH CLOUDINARY (UNSIGNED PRESET)

Ứng dụng sử dụng cơ chế **Unsigned Upload** của Cloudinary, giúp ứng dụng di động tải ảnh trực tiếp lên máy chủ Cloudinary một cách an toàn mà **không cần lưu API Secret** trong mã nguồn.

### Các bước tạo Unsigned Preset trên Cloudinary:
1. Đăng ký/Đăng nhập tài khoản tại [https://cloudinary.com](https://cloudinary.com).
2. Truy cập **Settings** (biểu tượng bánh răng ở góc dưới bên trái) -> Chọn tab **Upload**.
3. Cuộn xuống phần **Upload presets** -> Nhấn **Add upload preset**.
4. Thiết lập các thông số:
   - **Upload preset name**: `connect_chat_preset` (hoặc tên tùy bạn đặt).
   - **Signing Mode**: Chuyển từ *Signed* sang **Unsigned**.
   - **Folder**: `chat_images` (tùy chọn).
5. Nhấn **Save**.
6. Mở file `src/services/cloudinaryConfig.ts` trong mã nguồn và điền `cloudName` cùng `uploadPreset`:

```typescript
export const CLOUDINARY_CONFIG = {
  cloudName: 'dugoc2d9l',              // Cloud name trên Dashboard Cloudinary của bạn
  uploadPreset: 'connect_chat_preset', // Tên Unsigned Upload Preset vừa tạo
};
```

---

## 5. QUY TẮC BẢO MẬT FIREBASE (`database.rules.json`)

Nội dung file `database.rules.json` đầy đủ:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "conversations": {
      ".read": "auth != null",
      "$convId": {
        ".read": "auth != null && (data.child('members/' + auth.uid).val() === true || !data.exists())",
        ".write": "auth != null && (!data.exists() || data.child('members/' + auth.uid).val() === true)"
      }
    },
    "messages": {
      "$convId": {
        ".read": "auth != null && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true",
        "$msgId": {
          ".write": "auth != null && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true && (!data.exists() || (data.child('senderId').val() === auth.uid && (newData.child('recalled').val() === true || data.child('recalled').val() === false)) || newData.child('reactions').exists())",
          "recalled": {
            ".write": "auth != null && data.parent().child('senderId').val() === auth.uid"
          },
          "reactions": {
            "$uid": {
              ".write": "auth != null && auth.uid === $uid && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true"
            }
          }
        }
      }
    },
    "userChats": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        "$convId": {
          ".write": "auth != null && (auth.uid === $uid || root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true)"
        }
      }
    },
    "readStatus": {
      "$convId": {
        ".read": "auth != null && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true",
        "$uid": {
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    },
    "typing": {
      "$convId": {
        ".read": "auth != null && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true",
        "$uid": {
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    },
    "notifications": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        "$notifId": {
          ".write": "auth != null"
        }
      }
    }
  }
}
```

---

## 6. BÁO CÁO GIẢI THÍCH SECURITY RULES & CHỨNG MINH TỪ CHỐI

### A. Giải thích chi tiết các luật bảo mật:
1. **Bảo vệ cuộc trò chuyện và tin nhắn (`conversations` & `messages`):**
   - `.read` tại `messages/$convId`: Kiểm tra `root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true`. Chỉ những người dùng đã được thêm vào danh sách `members` của cuộc trò chuyện mới có quyền đọc tin nhắn. Người lạ hoàn toàn không thể xem trộm nội dung.
   - `.write` tại `messages/$convId/$msgId`: Chỉ cho phép ghi tin mới nếu người dùng là thành viên (`members`).
2. **Quy tắc thu hồi tin nhắn (`recalled`):**
   - Luật `"recalled": { ".write": "auth != null && data.parent().child('senderId').val() === auth.uid" }` đảm bảo **chỉ người gửi ban đầu của tin nhắn đó mới có quyền cập nhật trường `recalled: true`**. Không một thành viên nào khác trong nhóm có thể thu hồi thay tin nhắn của người khác.
3. **Quy tắc thả cảm xúc (`reactions`):**
   - Luật `"reactions/$uid": { ".write": "auth != null && auth.uid === $uid && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true" }` quy định mỗi tài khoản chỉ có thể ghi/xóa cảm xúc dưới mã định danh `auth.uid` của chính mình.
4. **Quy tắc trạng thái gõ và đã xem (`typing` & `readStatus`):**
   - `$uid: { ".write": "auth != null && auth.uid === $uid" }` đảm bảo người dùng chỉ được quyền cập nhật trạng thái gõ và thời điểm đọc của chính bản thân.
5. **Hộp thư người dùng (`userChats`):**
   - `$uid: { ".read": "auth != null && auth.uid === $uid" }` đảm bảo danh sách hội thoại của ai chỉ người đó được đọc.
   - Cho phép các thành viên trong cuộc trò chuyện ghi cập nhật `lastMessage` và tăng `unreadCount` thông qua multi-path update.

### B. Chứng minh thao tác bị từ chối (`PERMISSION_DENIED`):
**Tình huống kiểm thử vi phạm bảo mật:**
- **Thử nghiệm 1 (Người lạ đọc tin nhắn nhóm)**:
  + Tài khoản `User C` (không nằm trong danh sách `members` của `group_123`) thực hiện truy vấn đọc `messages/group_123`.
  + **Kết quả**: Firebase Realtime Database trả về lỗi: `Error: PERMISSION_DENIED: Client doesn't have permission to access the desired data.`
- **Thử nghiệm 2 (Thu hồi tin nhắn của người khác)**:
  + Tài khoản `User B` gửi request ghi `messages/conv_1/msg_abc/recalled = true` với một tin nhắn do `User A` gửi (`senderId === 'User A'`).
  + **Kết quả**: Thao tác bị Firebase chặn ngay lập tức do vi phạm điều kiện `data.parent().child('senderId').val() === auth.uid`.

---

## 7. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY ỨNG DỤNG

### Bước 1: Khởi động Metro Bundler
```bash
npm start
```

### Bước 2: Chạy ứng dụng trên máy ảo hoặc thiết bị thật Android
```bash
npm run android
```

*(Hoặc trên iOS)*:
```bash
cd ios && pod install && cd ..
npm run ios
```

### Bước 3: Đăng nhập & Trải nghiệm
- Tạo 2–3 tài khoản (ví dụ: `user1@gmail.com`, `user2@gmail.com`, `user3@gmail.com`).
- Tạo nhóm chat giữa 3 người, thử nghiệm gửi tin nhắn, gửi ảnh, gửi vị trí GPS, gõ phím xem "đang soạn tin…", thu hồi tin và thả cảm xúc!

