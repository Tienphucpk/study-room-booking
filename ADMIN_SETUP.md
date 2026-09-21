# Thiết lập tài khoản quản trị

Mã ứng dụng không chứa mật khẩu quản trị. Tạo tài khoản trong Firebase Console để không lộ bí mật trong Git:

1. Vào **Firebase Authentication → Users → Add user**, tạo email/mật khẩu quản trị.
2. Sao chép `UID` của user vừa tạo.
3. Vào **Firestore Database → Users**, tạo document có ID chính là UID đó và đặt các trường:

```json
{
  "uid": "UID_CUA_ADMIN",
  "email": "email-admin-cua-ban",
  "displayName": "VKU Admin",
  "role": "admin"
}
```

4. Publish nội dung của `firestore.rules` trong Firebase Console → Firestore Database → Rules.
5. Đăng nhập lại bằng tài khoản trên. Trong Hồ sơ sẽ xuất hiện mục **Quản trị → Thêm và quản lý phòng**.

Chỉ role `admin` mới có quyền ghi collection `Rooms`; ứng dụng không cho người dùng tự gán role.
