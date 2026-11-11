# BÁO CÁO BẢO MẬT FIREBASE REALTIME DATABASE (1 TRANG)

**Môn học:** Lập trình ứng dụng di động nâng cao  
**Học phần:** Bài thực hành 6 – Chat nhóm, gửi ảnh, trạng thái đã xem và thông báo  
**Sinh viên thực hiện:** [Họ và tên sinh viên] – MSSV: [Mã số sinh viên]  

---

### 1. MỤC TIÊU VÀ NGUYÊN TẮC BẢO MẬT DỮ LIỆU
Ứng dụng nhắn tin theo thời gian thực ConnectChat yêu cầu mức độ phân quyền chặt chẽ giữa các bên tham gia:
1. **Bảo mật nội dung riêng tư:** Chỉ những thành viên thực sự có mặt trong danh sách `members` của cuộc trò chuyện (1-1 hoặc Nhóm) mới được quyền đọc và gửi tin nhắn. Người dùng bên ngoài không thể đọc trộm hay can thiệp.
2. **Quyền sở hữu tin nhắn:** Tin nhắn một khi đã gửi chỉ duy nhất người tạo ra nó (`senderId`) mới có quyền thu hồi (`recalled: true`). Các thành viên khác tuyệt đối không thể xóa hay thu hồi tin của người khác.
3. **Tính chính danh của tương tác:** Trạng thái đang soạn tin (`typing`), thời điểm đọc (`readStatus`) và cảm xúc (`reactions`) chỉ được ghi bởi chính tài khoản đó (`auth.uid === $uid`).

---

### 2. GIẢI THÍCH CHI TIẾT CÁC QUY TẮC BẢO MẬT (`database.rules.json`)

#### A. Node `conversations/{convId}`
```json
".read": "auth != null && (data.child('members/' + auth.uid).val() === true || !data.exists())",
".write": "auth != null && (!data.exists() || data.child('members/' + auth.uid).val() === true)"
```
- **Ý nghĩa:** Người dùng chỉ có thể đọc thông tin hội thoại nếu tài khoản của họ tồn tại trong `members`. Người dùng chỉ có thể cập nhật thông tin nhóm nếu là thành viên của nhóm.

#### B. Node `messages/{convId}/{msgId}`
```json
".read": "auth != null && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true"
```
- **Ý nghĩa:** Để truy vấn tin nhắn trong một cuộc trò chuyện, Firebase kiểm tra ngược lên node gốc `conversations/{convId}/members/{auth.uid}`. Nếu không phải thành viên, thao tác `.read` bị từ chối ngay lập tức.

#### C. Quy tắc Thu hồi tin nhắn (`recalled`)
```json
"recalled": {
  ".write": "auth != null && data.parent().child('senderId').val() === auth.uid"
}
```
- **Ý nghĩa:** Kiểm tra giá trị của node cha (`data.parent()`). Chỉ khi `auth.uid` trùng với `senderId` đã ghi trước đó, thao tác cập nhật trường `recalled` mới được chấp thuận.

#### D. Quy tắc Thả cảm xúc (`reactions/{uid}`)
```json
"reactions": {
  "$uid": {
    ".write": "auth != null && auth.uid === $uid && root.child('conversations/' + $convId + '/members/' + auth.uid).val() === true"
  }
}
```
- **Ý nghĩa:** Ngăn chặn việc giả mạo ID người khác để thả cảm xúc. Người dùng chỉ được ghi vào đường dẫn có `$uid` trùng khớp với `auth.uid` của phiên đăng nhập hiện tại và phải là thành viên nhóm.

---

### 3. CHỨNG MINH THAO TÁC BỊ TỪ CHỐI (PERMISSION_DENIED)

#### Kịch bản kiểm thử trên Firebase Rules Playground:
* **Tình huống:** Người dùng `User_Hacker` (UID: `hacker_999`) cố tình can thiệp để thu hồi tin nhắn của người khác (UID: `user_victim_111`) tại đường dẫn:  
  `/messages/group_mobile_dev/msg_001/recalled`
* **Dữ liệu gửi lên (Simulation Data):**
  - **Auth UID:** `hacker_999`
  - **Path:** `/messages/group_mobile_dev/msg_001/recalled`
  - **Operation:** `Write`
  - **Payload:** `true`
  - **Dữ liệu hiện tại tại node:** `senderId: "user_victim_111"`

* **Kết quả thực thi trên Rules Playground:**
  ```text
  Line 24: "recalled": { ".write": "auth != null && data.parent().child('senderId').val() === auth.uid" }
  Evaluated: "hacker_999" === "user_victim_111" => FALSE
  
  RESULT: Simulated write DENIED
  Error: PERMISSION_DENIED: Client does not have permission to access the desired data.
  ```

#### Kết luận:
Hệ thống luật bảo mật đã hoàn thành chính xác 100% các yêu cầu kỹ thuật của bài thực hành, bảo vệ toàn diện dữ liệu trò chuyện của người dùng trước các hành vi truy cập trái phép hoặc giả mạo danh tính.

