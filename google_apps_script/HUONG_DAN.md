# Bật báo cáo tiến độ qua email (làm 1 lần, ~5 phút)

1. Vào https://script.google.com → **New project** (Dự án mới). Đặt tên: `Babie hoc tieng Trung`.
2. Xóa hết code mẫu, dán toàn bộ nội dung `Code.gs` vào → bấm 💾 Save.
3. Chọn hàm **caiDat** trên thanh công cụ → bấm **Run**.
   - Google hỏi quyền → *Review permissions* → chọn tài khoản → *Advanced* → *Go to Babie hoc tieng Trung (unsafe)* → *Allow*.
     (Báo "unsafe" vì script do chính bạn viết, chưa được Google duyệt — bình thường.)
   - Xong: Google Drive có thêm Sheet "Babie học tiếng Trung - Nhật ký", và đã hẹn gửi email mỗi tối ~21h.
4. **Deploy → New deployment** → bánh răng ⚙ chọn **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   → **Deploy** → copy **Web app URL** (dạng `https://script.google.com/macros/s/.../exec`).
5. Dán URL vào `config.json`:
   ```json
   { "report_url": "https://script.google.com/macros/s/XXXX/exec" }
   ```
6. `python3 build.py` → gửi `dist/Babie_hoc_tieng_Trung.zip` cho bồ cài đè.

Thử email ngay: trong Apps Script chọn hàm **thuGuiEmail** → Run.

## Ghi chú
- App chỉ gửi khi máy có mạng; mất mạng thì lần sau gửi bù (luôn gửi kèm 14 ngày gần nhất).
- Gửi những gì: ngày học, số phút, số câu, giờ bắt đầu/kết thúc, tên bài đã học, số từ đã thuộc, chuỗi ngày. Không gửi gì khác.
- Trên app có hiện dòng "📤 Báo cáo cho Halken" để bồ biết.
- Đổi giờ email: sửa `GIO_GUI_EMAIL` trong Code.gs → chạy lại `caiDat`.
- Nếu sửa Code.gs sau khi đã deploy: Deploy → Manage deployments → ✏️ → Version: New version → Deploy (URL giữ nguyên).
