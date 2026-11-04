# Halken nhắc Babie học tiếng Trung — mã nguồn

## Mở bằng VS Code
- `Cmd+Shift+B` → **Build bộ cài** (ra `dist/Babie_hoc_tieng_Trung.zip`)
- `Cmd+Shift+P` → *Tasks: Run Task* → **Xem thử app** / **Chạy test tự động** / **Mở thư mục dist**
- Lần đầu chạy test: `npm install && npx playwright install chromium`

## Cập nhật bản mới (3 bước)
1. Sửa cái cần sửa:
   - Từ vựng: `data/*.txt` (mỗi cuốn 1 file)
   - Giao diện / chức năng: `src/template.html`
   - Nhắc học Windows: `windows/he_thong/*.ps1`
2. Build:  `python3 build.py`  → xem thử `open dist/On_Tieng_Trung.html`
3. Gửi `dist/Babie_hoc_tieng_Trung.zip` cho bồ → bồ mở zip, bấm đúp file bên trong. Xong.

Cài đè không mất gì: tiến độ (lưu trong trình duyệt + file tien_do_hoc.json), giờ nhắc học đều giữ nguyên.

## Báo cáo tiến độ qua email
Xem `google_apps_script/HUONG_DAN.md`. Điền URL vào `config.json` rồi build lại.

## ⚠️ Quy tắc dữ liệu (để không lệch tiến độ)
Mỗi từ có mã `sách-bài-thứ tự` (VD `1-3-5`). Tiến độ, ★ đánh dấu, nghĩa đã sửa gắn theo mã này.
- ✅ Thêm từ mới: **thêm vào cuối bài**.
- ✅ Sửa nghĩa / pinyin: sửa tại chỗ, thoải mái.
- ✅ Thêm cuốn mới: tạo file mới trong `data/` với số sách mới (VD `#2|1|...`).
- ❌ Không chèn giữa, không xóa, không đổi thứ tự từ trong bài đã có.

## Định dạng file từ vựng
```
#1|3|買生日禮物|Mua quà sinh nhật
買|mǎi|mua
禮物|lǐwù|quà
```
Dòng `#sách|bài|tên bài|tên tiếng Việt` mở đầu một bài. Dòng bắt đầu bằng `//` là ghi chú.

## Cấu trúc
- `src/template.html` — toàn bộ app (HTML/CSS/JS, font + icon nhúng sẵn, chạy offline). `/*__DATA__*/null` được build thay bằng từ vựng.
- `windows/installer_head.bat` — phần đầu bộ cài; build.py nối zip (base64) vào sau dòng `::PAYLOAD::`.
- `windows/he_thong/cai_dat_tu_dong.ps1` — cài vào `%LOCALAPPDATA%\BabieHocTiengTrung`, tạo shortcut Desktop + Start, đăng ký Task Scheduler 18:00.
- `windows/he_thong/nhac_hoc.ps1` — thông báo Windows lúc nhắc (fallback: bảng to giữa màn hình).
- `windows/he_thong/cai_dat.ps1` — cửa sổ "Đổi giờ nhắc học".
