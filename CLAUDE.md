# CLAUDE.md — Halken nhắc Babie học tiếng Trung

Bàn giao từ phiên Claude trên claude.ai (03–04/11/2026). Đọc file này là đủ bối cảnh, không cần rà lại toàn bộ code.

## Người dùng & cách làm việc
- **Ken (Halken)** — dev .NET/Python, dùng **macOS + VS Code**. Nói **tiếng Việt**, thích câu trả lời ngắn, thực tế, có so sánh lựa chọn.
- App làm cho **người yêu của Ken ("Babie")** — dùng **Windows**, **không rành công nghệ** → mọi thứ phía Windows phải "bấm đúp là chạy", thông báo lỗi bằng tiếng Việt dễ hiểu.
- Bồ đang học tiếng Trung phồn thể (Đài Loan) để đi du học Đài Loan.
- Commit: viết message tiếng Việt, push thẳng `main` (repo cá nhân).

## App là gì
Trang HTML **một file, chạy offline** để ôn từ vựng tiếng Trung → nghĩa tiếng Việt theo từng bài, kiểu Quizlet, giao diện "Barbie" hồng.
- 4 chế độ: **Thẻ ghi nhớ** (lật/vuốt), **Trắc nghiệm** (4 đáp án), **Viết pinyin** (nhìn chữ Hán gõ pinyin, không cần dấu), **Danh sách** (tìm kiếm, **sửa nghĩa tiếng Việt**, copy/tải cho Quizlet).
- Nhật ký học (phút/ngày, giờ bắt đầu–kết thúc, số câu, bài đã học), lịch tháng, chuỗi ngày, mục tiêu phút/ngày.
- Tự lưu tiến độ ra file `tien_do_hoc.json` (File System Access API) + localStorage.
- Báo cáo tiến độ cho Ken qua Google Apps Script → Google Sheet + email mỗi tối.
- Bộ cài Windows 1 file, nhắc học 18:00 bằng thông báo Windows.

## Cấu trúc
```
data/sach1_thoi_dai_hoa_ngu_1.txt   Từ vựng 時代華語 1 (15 bài, 726 từ)
data/sach3_dang_dai_trung_van_1.txt  Từ vựng 當代中文課程 1 (cuốn cơ bản, sách ID 3; 15 bài, 569 từ). Nghĩa Việt do Claude dịch → nên có người đọc lại.
data/sach2_dang_dai_trung_van_2.txt  Từ vựng 當代中文課程 2 (15 bài, 657 từ; mỗi bài = Vocabulary I + II gồm cả mục People/Names/Phrases). Nghĩa Việt do Claude dịch từ bản Anh trong sách → nên có người đọc lại. Chưa có bài đọc/file nghe cho sách 2.
data/bai_doc/*.txt                  Bài đọc/đối thoại (mã nghe 01-1-1…): chữ Hán|pinyin|nghĩa Việt; 短文 mỗi đoạn 1 dòng. Sách 1: 44 mục
audio/                              File nghe <mã nghe>.mp3 — build chép vào dist/audio + bộ cài + dist/update; thiếu thì dùng giọng máy. ⚠️ NẰM TRONG .gitignore (bản quyền sách, repo public) — không commit/push. Tạo bằng `python3 nen_audio.py "<thư mục nguồn>" d1` (ffmpeg, mono 48kbps, ~27MB cho 60 file)
nen_audio.py                        Nén file nghe sách: chỉ lấy track 01–04 mỗi bài (01 Đối thoại 1 · 02 Từ vựng 1 · 03 Đối thoại 2 · 04 Từ vựng 2); track 05+ là luyện phát âm, bỏ
src/template.html                   Khung HTML (placeholder /*__CSS__*/, <!--__ICONS__-->, /*__JS__*/)
src/css/NN_*.css                    CSS chia theo phần (00_fonts = font base64, 01_base ... 07_fx)
src/js/NN_*.js                      JS chia theo phần (00_store … 15_main); script thường, biến toàn cục
src/icons.svg                       Sprite icon + búp bê (<symbol id="i-...">)
build.py                            Gộp data → HTML, đóng gói bộ cài → dist/
config.json                         {"report_url": "<Apps Script web app URL>"}
windows/installer_head.bat          Đầu bộ cài; build.py nối zip base64 sau dòng ::PAYLOAD::
windows/he_thong/                   Script chạy trên máy bồ (xem mục Windows)
google_apps_script/Code.gs          Nhận báo cáo + gửi email (đã deploy, xem mục Báo cáo)
test_tu_dong.js                     Test Playwright 31 mục (npm test)
.vscode/                            tasks: Build (Cmd+Shift+B), Xem thử, Chạy test, Mở dist
```
Không có trong repo: 2 PDF sách gốc (`時代華語_1課程.pdf` – bản scan, `當代中文課程2_-_課本.pdf` – có text layer nhưng OCR nhiễu). Hỏi Ken nếu cần.

## Build & test
```bash
python3 build.py                 # → dist/On_Tieng_Trung.html + dist/Babie_hoc_tieng_Trung.zip
open dist/On_Tieng_Trung.html    # xem thử
npm install && npx playwright install chromium   # lần đầu
npm test                         # 31/31 phải pass (test tự giả lập script.google.com)
```
Gửi `dist/Babie_hoc_tieng_Trung.zip` cho bồ → bồ mở zip, bấm đúp `BAM_DUP_VAO_DAY_DE_CAI.bat` = cài/cập nhật đè (giữ tiến độ + giờ nhắc).

## Dữ liệu từ vựng
Định dạng `data/*.txt`:
```
#<sách>|<bài>|<tên bài chữ Hán>|<tên bài tiếng Việt>
chữ Hán|pinyin|nghĩa tiếng Việt
```
- Pinyin theo **cách đọc Đài Loan** như trong sách (VD 星期 xīngqí, 垃圾 lèsè). Nhiều cách đọc: `nǎ / něi`; phần tuỳ chọn trong ngoặc: `yǒu (yì)diǎn (r)` — chế độ Viết chấp nhận mọi biến thể.
- Dòng `//` = ghi chú. `BOOK_NAMES` trong build.py đặt tên cuốn theo số sách.
- ⚠️ **ID từ = `sách-bài-thứ tự`** (VD `1-3-5`). Tiến độ, ★, nghĩa đã sửa gắn theo ID này → **chỉ thêm từ vào CUỐI bài, không chèn giữa/xóa/đổi thứ tự**. Sửa nghĩa/pinyin tại chỗ thì OK.
- Trùng chữ Hán trong cùng bài là cố ý (2 nghĩa): Sách 1 Bài 4 `多`, Bài 7 `到`; Sách 2 Bài 11 `又` (2 mục). Trắc nghiệm đã loại đáp án nhiễu trùng chữ/trùng nghĩa.
- Sách 1 Bài 15 chỉ có 2 phần hội thoại (PDF hết ở đó), 31 từ.

## Mã nguồn app — bản đồ code (src/css, src/js)
build.py nối file theo **thứ tự tên** (`00_`, `01_`...) rồi nhúng vào template → vẫn ra 1 HTML offline. Thêm phần mới = tạo file có số thứ tự phù hợp; JS dùng chung biến toàn cục nên file đứng sau dùng được hàm/biến của file đứng trước (và hàm được gọi lúc chạy thì thứ tự không quan trọng). `/*__DATA__*/` ở 00_store.js, `/*__REPORT__*/` ở 02_report.js.
Biến toàn cục (script thường, không module): `DATA` (thay `/*__DATA__*/null`), `REPORT_URL` (thay `/*__REPORT__*/''`), `store` (localStorage key `onTiengTrung_v1`: `{p:{id:{k,w,st}}, s:settings, log:{'YYYY-MM-DD':{s,a,f,t,l}}, e:{id:nghĩa đã sửa}, updated}`), `S`=store.s, `LOG`, `EDIT`, `ALL` (mảng từ phẳng), `view`, `mode`, `deck`, `gen`, `keyHandler`.
- `P(id)` lấy/tạo tiến độ 1 từ. `save()` → localStorage + `fileSaveSoon()`.
- **Tự lưu file**: `initFile/pickNewFile/pickOldFile/resumeFile/writeFile` (ghi tuần tự, handle lưu IndexedDB `onTiengTrung/kv/fh`). Banner ở trang chủ khi chưa bật / cần cấp quyền lại.
- **Báo cáo**: `reportPayload()` gửi 14 ngày gần nhất; `sendReport()` POST `no-cors` text/plain khi về trang chủ, khi ẩn tab, mỗi 5 phút lúc học. Header hiện "📤 Báo cáo cho Halken" khi có URL.
- **Nhật ký**: interval 1s cộng giây khi `view==='study'`, tab hiện và có thao tác trong 90s. `streak()` tính ngày ≥60s.
- **Hiệu ứng**: `sfx()` WebAudio (tắt được: `S.sound`), `burst()`, `confetti()`, `shake()`, `comboUp()` (≥3 đúng liên tiếp), `mascot(mood)` búp bê đổi biểu cảm, `fxGood/fxBad/celebrate`.
- `home()` → dashboard (vòng mục tiêu, thống kê đếm tăng, lịch, búp bê vẫy tay), lưới bài (tilt 3D), chọn nhiều bài, ★ Đánh dấu, 💔 Hay sai.
- `study()` → tabs + tùy chọn (⚙️: mặt trước Hán/Việt, hiện pinyin, trộn, âm thanh) + `#stage` + búp bê. Gọi `flash/quiz/write/list`.
- **Quy tắc timer**: mọi `setTimeout` vẽ lại màn hình phải kiểm tra `gen===my` (gen tăng mỗi lần `home()`/`study()`), nếu không đổi chế độ sẽ bị vẽ đè.
- Phím tắt qua `keyHandler` (global keydown bỏ qua INPUT trừ Enter; bỏ qua ô sửa nghĩa).
- Thẻ ghi nhớ: mặt trước **im lặng**, chỉ đọc (speechSynthesis zh-TW) **khi lật** ra mặt sau — yêu cầu của Ken.
- Pinyin **ẩn mặc định** (chỉ hiện khi lật / sau khi trả lời).

## Thiết kế (theo yêu cầu Ken)
- Theme Barbie game: nền hồng chấm bi, nút "jelly" bóng (`.btn`, `.btn.primary`, `.yes` xanh, `.no` đỏ, `.btn.big` = nút lớn có icon+chữ+phím tắt), khung viền vàng sọc kính `.card.gold`.
- **Bảng từ vựng (`.board`) nền navy `#041E42`, chữ trắng `#fff`, KHÔNG trang trí bên trong** — để tập trung nhớ.
- Font nhúng: Baloo 2 (600/800, có tiếng Việt) cho tiêu đề/nút; Pacifico cho chữ tên app; chữ Hán dùng Microsoft JhengHei (có sẵn Windows).
- Icon: sprite SVG tự vẽ `<symbol id="i-...">` (crown, tiara, wand, mirror, heel, butterfly, dress, balloon, gift, bow, lipstick, glasses, flower, perfume, heart, sparkle, carriage, diamond, cupcake, icecream, rainbow, lollipop, star, teddy, envelope) + búp bê `doll`, `doll-wave`, `doll-cheer`, `doll-sad`. Dùng `ic(name, class, style)`. Filter `#stk` tạo viền sticker.
- ❌ **Không dùng logo/silhouette/búp bê Barbie thật hay hình stock có bản quyền** — đã giải thích với Ken; búp bê là nhân vật tự vẽ. Giữ nguyên nguyên tắc này.
- Tên app: **"Halken nhắc Babie học tiếng Trung ♥"** (chữ "Babie" đúng như Ken gõ).
- Responsive: ≤760px búp bê nằm dưới nội dung, icon trang trí ẩn.

## Windows (máy bồ) — `windows/he_thong/`
- `installer_head.bat` → giải nén payload vào %TEMP% → `cai_dat_tu_dong.ps1`:
  - Cài vào **`%LOCALAPPDATA%\BabieHocTiengTrung`** (fallback `C:\BabieHocTiengTrung` nếu đường dẫn có ký tự ngoài ASCII).
  - Shortcut Desktop + Start Menu "Babie học tiếng Trung", Start Menu "Đổi giờ nhắc học".
  - Đăng ký AppUserModelId `OnTiengTrung.NhacHoc` (HKCU) cho thông báo, Task Scheduler `OnTiengTrung_NhacHoc` 18:00 (giữ giờ cũ khi cài đè), `-StartWhenAvailable`.
- `nhac_hoc.vbs` → `nhac_hoc.ps1`: toast Windows (scenario reminder, nút "Học ngay ♥" mở HTML, "Nhắc lại sau" snooze hệ thống), tiêu đề "Anh người yêu nhắc em học tiếng Trung nè ♥". Fallback bảng WinForms nếu `che_do.txt` = `bang` hoặc toast lỗi.
- `cai_dat.ps1` (qua `mo_cai_dat.vbs`, `Doi_gio_nhac_hoc.bat`): cửa sổ hồng đổi giờ/2 lần nhắc/kiểu nhắc/thử/tắt.
- **Bài học xương máu:**
  - `WScript.Shell.CreateShortcut` **không chịu Unicode** (ọ, ế → `?`) → tạo shortcut tên ASCII tạm rồi `Move-Item` sang tên có dấu. Desktop bồ nằm trong OneDrive ("Máy tính"), Documents là "Tài liệu".
  - `.ps1` phải **UTF-8 có BOM + CRLF**; `.bat/.vbs` **ASCII + CRLF** (đã khóa bằng `.gitattributes`). Không dùng ký tự có dấu trong .bat/.vbs.
  - Chuỗi trả về 1 phần tử từ hàm PowerShell bị "unroll" → bọc `@(...)`.
  - Chữ `&` trên nút WinForms phải viết `&&`.
  - Tình trạng thử thật trên máy bồ: bản đầu lỗi "Unable to save shortcut" (Unicode) → đã sửa; bản sau **cài chạy được nhưng không thấy biểu tượng ngoài Desktop** → đã thêm: kiểm tra file shortcut tồn tại (báo lỗi nếu không), tạo ở cả Desktop OneDrive lẫn `%USERPROFILE%\Desktop`, làm mới icon (SHChangeNotify + `ie4uinit -show`). **Chưa có phản hồi bản sửa này**, toast 18:00 cũng **chưa xác nhận** — hỏi Ken trước khi đụng phần này.

## Báo cáo email (Google Apps Script)
- Ken đã tạo project Apps Script, chạy `caiDat`, deploy Web app (Execute as Me, Anyone). URL nằm trong `config.json`.
- Sửa `Code.gs` xong phải: Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới (giữ nguyên URL).
- Sheet "Babie học tiếng Trung - Nhật ký" (tab Nhật ký, Tổng quan); email ~21h hằng ngày (`GIO_GUI_EMAIL`), có cả email "chưa học".

## Bài đọc, ôn tập ngắt quãng, giọng đọc (thêm 11/2026)
- **Bài đọc** (`src/js/12_reading.js`, tab "Bài đọc" ở mỗi bài): dữ liệu `data/bai_doc/`, build gắn vào `lesson.readings`. Tiếng Việt do Claude dịch từ bản Anh trong sách → nên có người đọc lại. Chữ Hán `lang="zh-Hant"`, font nét 400.
- **Ôn tập ngắt quãng kiểu Anki** (`src/js/13_review.js`): thẻ = `store.p[id]` thêm `due,iv,ef,s('l'|'r'),ls,rp,lp` (id = sách-bài-thứ tự nên **dùng chung mọi sách, gộp tất cả sách khi ôn**; chip lọc sách chỉ hiện khi >1 sách, báo cáo cho Ken luôn tính gộp). Từ vào sổ khi trả lời ở Thẻ/Trắc nghiệm/Viết (`srsPractice`); chỉ thẻ đến hạn mới được chấm lịch ở phiên ôn (`srsGrade`, `srsNext` = SM-2 rút gọn: bước học 1 & 10 phút, Quên ×0.3, Khó ×1.2, Nhớ ×ef, Dễ ×ef×1.3). Có 4 cách ôn: lật thẻ / trắc nghiệm / gõ pinyin / xen kẽ. Tiến độ cũ được nhập vào sổ một lần (`S.srs1`). Nhật ký ngày thêm `rv` (số lượt ôn), `rg` (đếm Quên/Khó/Nhớ/Dễ) → tỉ lệ nhớ.
- **Combo**: tiết chế (chữ nhỏ từ x3); chuỗi đúng ≥5 thì búp bê nhảy (`dance()`), ≥8 nhanh hơn. Bồ đã bảo bản nhiều hiệu ứng quá "game" → đừng thêm viền sáng/pháo hoa/điểm bay.
- **Lưu tiến độ chống mất** (`src/js/00_store.js`, `01_backup.js`, `01_autosave.js`): ⚠️ khôi phục dữ liệu PHẢI qua `replaceStoreAndReload(raw)` (đặt `noSave`), vì `beforeunload`/`pagehide` tự `save()`/`writeFile()` sẽ ghi đè dữ liệu cũ lên (lỗi cũ làm khôi phục không có tác dụng). Nối dữ liệu bằng `mergeStores` (bản mới làm gốc, bổ sung phần thiếu — không ghi đè). IndexedDB `kv` giữ `bk:latest`, `bk:d:<ngày>` (14 ngày), `bk:pre:<phiên bản>` (3 bản, cất nguyên dữ liệu cũ khi `APP_VER` đổi — build.py ghi dấu giờ). Máy trống mà có bản sao → `autoRecover()`. Cài đặt có danh sách bản sao + nút Khôi phục. "Để sau" của banner tự lưu file chỉ hoãn 3 ngày.
- **Báo cáo học tập** (`src/js/14_stats.js`, nút 📈 Báo cáo): 3 tab Hôm nay / Điểm mạnh·yếu / Thành quả (huy hiệu, từ mới thuộc theo tuần). Dữ liệu theo dõi qua `track()`: `p.c` (đúng), `p.w` (sai), `p.kd` (ngày đầu thuộc), `LOG[ngày].m/tm/wr`, `store.ec` (nhầm pinyin theo luật `PY_RULES`). Thêm kiểu ôn mới thì gọi `srsPractice(id,ok,kind)` để vào báo cáo.
- **Tự cập nhật app (phương án A, thêm 11/2026)**: `build.py` tạo `dist/update/` (`manifest.json` = phiên bản + SHA256 từng file, `On_Tieng_Trung.html`, `audio/*`, `_headers` CORS) — đẩy nguyên thư mục này lên nơi đặt `update_url` trong `config.json` (để trống = tắt). Máy bồ: Task Scheduler `OnTiengTrung_CapNhat` (mỗi 2 giờ, chạy bù khi bật máy) → `chay_cap_nhat.vbs` → `cap_nhat.ps1`: tải manifest, chỉ tải file khác hash, kiểm SHA256, thay file (trang app sau cùng, giữ `.bak`), chỉ nhận đường dẫn `On_Tieng_Trung.html` / `audio/<tên an toàn>`; **không đụng tiến độ, giờ nhắc, biểu tượng, script `he_thong`** (đổi script Windows vẫn phải gửi zip). Menu Start có "Cập nhật app ngay" (`mo_cap_nhat.vbs` → `-Hien`). Trong app: Cài đặt → "🔄 Cập nhật app" (phiên bản + nút kiểm tra, `checkUpdate()`), mở bản mới lần đầu thì báo `thay_doi.txt` (dòng đầu). Đẩy lên GitHub Pages: `./publish_gh_pages.sh` (Ken tự chạy — công bố app ra mạng). ⚠️ **`cap_nhat.ps1` chưa được chạy thử trên PowerShell/Windows thật** (máy dev không có PowerShell) → thử trên máy bồ bằng bản thử trước.
- **Giọng đọc**: ưu tiên giọng nam zh-TW (`MALE_VOICES`), chọn tay trong Cài đặt (`S.voice`). `S.shuffle` mặc định bật (migration `S.shuf2`).

## Sách 3 — 當代中文課程 1 (thêm 11/2026)
- **ID sách**: 時代華語1 = 1, 當代中文2 = 2, 當代中文1 = 3 (ID không đổi vì tiến độ gắn theo ID). Thứ tự hiện trong app do `BOOK_ORDER=[1,3,2]` ở build.py → chỉ số sách trong `DATA.books` (`S.book`, `w.book`, khóa chọn bài `bi:n`) ≠ ID sách.
- Bài đọc `data/bai_doc/sach3_bai_doc.txt`: mỗi bài 4 mục khớp 4 track — `d1-LL-01` Đối thoại 1, `d1-LL-02` đọc Từ vựng 1 (không có dòng thoại, chỉ phát audio), `d1-LL-03` Đối thoại 2, `d1-LL-04` đọc Từ vựng 2. App hiển thị mã bỏ tiền tố (`01-01`) cho khớp mã in trong sách (`codeOf`). Tiền tố `d1-` để khỏi trùng với mã của cuốn 當代中文2 (cũng đánh `01-01…`, chưa có file nghe → tiền tố `d2-`).
- PDF nguồn nằm ở `~/Documents/Phồn thể/` (課本 + 作業本 + file nghe 課本 141 file). Vocab 15 bài: Vocab I bắt đầu ở các trang PDF 30,52,73,94,114,132,161,189,211,231,253,275,299,329,353; Vocab II 33,55,75,96,117,135,164,191,214,234,256,278,303,332,357. Đối thoại có chữ Hán + pinyin ngay trên trang (từ bài 6 có thêm khung "Text in Pinyin" riêng); đối thoại có thể bắt đầu từ trang trước trang tiêu đề bài.
- Gói cài giờ ~19MB (.bat ~25MB) vì có file nghe. **Chưa thử bộ cài lớn này trên Windows thật** (PowerShell đọc cả file bằng ReadAllLines rồi giải nén base64). Nếu máy bồ lỗi → tách file nghe ra khỏi bộ cài, dùng kênh tự cập nhật.

## Việc còn mở
1. **Repo đang PUBLIC** mà có `config.json` chứa URL Apps Script → Ken chưa trả lời có chuyển Private không. Hỏi lại / nhắc.
2. **Sách 2 đã có từ vựng** (xem `data/sach2_…`). Còn thiếu: bài đọc (`data/bai_doc/`) và file nghe của sách 2 nếu bồ cần. Cách đã dùng để đọc PDF: pdftoppm 100dpi, cắt cột (số · Hán · pinyin · nghĩa Anh, bỏ cột chú âm) rồi đọc ảnh; mục "People in the Dialogue" nằm TRÊN bảng Vocabulary ở một số bài (4, 6, 10, 13) — dễ sót.
3. Trang trí trong `.board` phải giữ tối giản (yêu cầu Ken).
