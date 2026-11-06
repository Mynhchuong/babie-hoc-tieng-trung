#!/usr/bin/env python3
"""Build bộ cài 'Halken nhắc Babie học tiếng Trung'.
Chạy:  python3 build.py
Kết quả: dist/Babie_hoc_tieng_Trung.zip  (gửi file này cho bồ, bồ bấm đúp file bên trong là cập nhật)
"""
import json, os, glob, shutil, base64, textwrap, zipfile, io, re, time, hashlib

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')

# ---- 1. Đọc từ vựng: mỗi file trong data/ là 1 cuốn sách ----
# Dòng "#<sách>|<bài>|<tên bài chữ Hán>|<tên bài tiếng Việt>"  rồi các dòng "chữ Hán|pinyin|nghĩa"
BOOK_NAMES = {1: ('時代華語 1', '時代華語1'), 2: ('當代中文課程 2', '當代中文2')}
books = {}
for path in sorted(glob.glob(os.path.join(ROOT, 'data', '*.txt'))):
    cur = None
    for line in open(path, encoding='utf8'):
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        if line.startswith('#'):
            b, n, t, tv = line[1:].split('|')
            b = int(b)
            name, short = BOOK_NAMES.get(b, (f'Sách {b}', f'Sách{b}'))
            bk = books.setdefault(b, {'id': b, 'name': name, 'short': short, 'lessons': []})
            cur = {'n': int(n), 'title': t, 'titleVi': tv, 'words': []}
            bk['lessons'].append(cur)
        else:
            parts = line.split('|')
            assert len(parts) == 3, f'Sai định dạng ({path}): {line}'
            cur['words'].append(parts)
# ---- 1b. Bài đọc: data/bai_doc/*.txt ----
# Dòng "@<sách>|<bài>|<mã nghe>|<loại>|<tên chữ Hán>|<tên tiếng Việt>" rồi các dòng "người nói|chữ Hán|pinyin|nghĩa"
# (người nói = '*' là chú thích hành động, để trống là bài đọc không có người nói). File nghe: audio/<mã nghe>.mp3
n_read = 0
for path in sorted(glob.glob(os.path.join(ROOT, 'data', 'bai_doc', '*.txt'))):
    cur = None
    for line in open(path, encoding='utf8'):
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        if line.startswith('@'):
            b, n, code, kind, t, tv = line[1:].split('|')
            lesson = next((l for l in books[int(b)]['lessons'] if l['n'] == int(n)), None)
            assert lesson, f'Bài đọc {code}: không có bài {n} trong sách {b}'
            cur = {'id': code, 'kind': kind, 'title': t, 'titleVi': tv, 'lines': []}
            lesson.setdefault('readings', []).append(cur)
            n_read += 1
        else:
            parts = line.split('|')
            assert cur and len(parts) == 4, f'Sai định dạng ({path}): {line}'
            cur['lines'].append(parts)
data = {'books': [books[k] for k in sorted(books)]}
total = sum(len(l['words']) for b in data['books'] for l in b['lessons'])
print(f'{len(data["books"])} cuốn, {total} từ, {n_read} bài đọc')

# ---- 2. Tạo trang HTML ----
# src/template.html chỉ là khung; CSS/JS/icon nằm file riêng, build nhúng lại thành 1 file chạy offline.
# Thứ tự file = thứ tự tên (00_, 01_, ...) vì JS dùng biến toàn cục và CSS phụ thuộc thứ tự.
def read_all(sub, ext):
    files = sorted(glob.glob(os.path.join(ROOT, 'src', sub, '*.' + ext)))
    return ''.join(open(f, encoding='utf8').read() for f in files)

html = open(os.path.join(ROOT, 'src', 'template.html'), encoding='utf8').read()
html = html.replace('/*__CSS__*/\n', read_all('css', 'css'))
html = html.replace('<!--__ICONS__-->\n', open(os.path.join(ROOT, 'src', 'icons.svg'), encoding='utf8').read())
html = html.replace('/*__JS__*/\n', read_all('js', 'js'))
html = html.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False))
cfg_path = os.path.join(ROOT, 'config.json')
cfg = json.load(open(cfg_path, encoding='utf8')) if os.path.exists(cfg_path) else {}
VER = time.strftime('%Y%m%d-%H%M%S')
html = html.replace("/*__VER__*/'dev'", json.dumps(VER))
# Địa chỉ nơi đặt bản cập nhật (config.json "update_url"); để trống = chưa bật tự cập nhật
update_url = cfg.get('update_url', '').strip().rstrip('/')
html = html.replace("/*__UPDATE__*/''", json.dumps(update_url))
# Ghi chú "có gì mới" của bản này (file thay_doi.txt ở gốc repo, dòng đầu tiên) — hiện 1 dòng sau khi app tự cập nhật
notes = ''
if os.path.exists(os.path.join(ROOT, 'thay_doi.txt')):
    notes = next((l.strip() for l in open(os.path.join(ROOT, 'thay_doi.txt'), encoding='utf8') if l.strip() and not l.startswith('#')), '')[:160]
html = html.replace("/*__NOTES__*/''", json.dumps(notes, ensure_ascii=False))
report_url = cfg.get('report_url', '').strip()
html = html.replace("/*__REPORT__*/''", json.dumps(report_url))
print('Tự cập nhật:', 'BẬT -> ' + update_url if update_url else 'TẮT (chưa điền update_url trong config.json)')
print('Báo cáo email:', 'BẬT -> ' + report_url[:60] + '...' if report_url else 'TẮT (chưa điền report_url trong config.json)')

# ---- 3. Gói payload ----
# File nghe của bài đọc: audio/01-1-1.mp3 ... (mp3/m4a/wav/ogg) -> chép vào bộ cài và dist/audio
AUDIO = sorted(f for f in glob.glob(os.path.join(ROOT, 'audio', '*')) if f.lower().endswith(('.mp3', '.m4a', '.wav', '.ogg')))
print(f'File nghe: {len(AUDIO)}')
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('On_Tieng_Trung/On_Tieng_Trung.html', html)
    z.write(os.path.join(ROOT, 'windows', 'Doi_gio_nhac_hoc.bat'), 'On_Tieng_Trung/Doi_gio_nhac_hoc.bat')
    for f in glob.glob(os.path.join(ROOT, 'windows', 'he_thong', '*')):
        if os.path.basename(f) != 'che_do.txt':
            z.write(f, 'On_Tieng_Trung/he_thong/' + os.path.basename(f))
    z.writestr('On_Tieng_Trung/he_thong/cap_nhat.json', json.dumps({'url': update_url}))
    for f in AUDIO:
        z.write(f, 'On_Tieng_Trung/audio/' + os.path.basename(f))
    for b in data['books']:
        for l in b['lessons']:
            txt = '\n'.join(f'{h} ({p})\t{v}' for h, p, v in l['words'])
            z.writestr(f"On_Tieng_Trung/Quizlet_Sach{b['id']}/Bai_{l['n']:02d}.txt", '﻿' + txt)

# ---- 4. Bộ cài 1 file (.bat tự giải nén) ----
head = open(os.path.join(ROOT, 'windows', 'installer_head.bat'), encoding='ascii').read()
b64 = base64.b64encode(buf.getvalue()).decode()
bat = head.replace('\r\n', '\n').replace('\n', '\r\n') + '\r\n'.join(textwrap.wrap(b64, 1000)) + '\r\n'

os.makedirs(DIST, exist_ok=True)
with open(os.path.join(DIST, 'On_Tieng_Trung.html'), 'w', encoding='utf8') as f:
    f.write(html)
shutil.rmtree(os.path.join(DIST, 'audio'), ignore_errors=True)
if AUDIO:
    os.makedirs(os.path.join(DIST, 'audio'))
    for f in AUDIO:
        shutil.copy(f, os.path.join(DIST, 'audio'))
# Gói cập nhật: đẩy NGUYÊN thư mục dist/update lên nơi đặt update_url (GitHub Pages / Cloudflare Pages…)
UPD = os.path.join(DIST, 'update')
shutil.rmtree(UPD, ignore_errors=True)
os.makedirs(os.path.join(UPD, 'audio'))
def _sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest().upper()
with open(os.path.join(UPD, 'On_Tieng_Trung.html'), 'w', encoding='utf8') as f:
    f.write(html)
man_files = [{'p': 'On_Tieng_Trung.html', 'h': _sha(os.path.join(UPD, 'On_Tieng_Trung.html')), 's': os.path.getsize(os.path.join(UPD, 'On_Tieng_Trung.html'))}]
for f in AUDIO:
    shutil.copy(f, os.path.join(UPD, 'audio'))
    q = os.path.join(UPD, 'audio', os.path.basename(f))
    man_files.append({'p': 'audio/' + os.path.basename(f), 'h': _sha(q), 's': os.path.getsize(q)})
with open(os.path.join(UPD, 'manifest.json'), 'w', encoding='utf8') as f:   # không BOM
    json.dump({'ver': VER, 'files': man_files}, f, ensure_ascii=False, indent=1)
with open(os.path.join(UPD, '_headers'), 'w', encoding='ascii') as f:       # cho phép app (mở từ file) hỏi phiên bản mới
    f.write('/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: no-cache\n')
open(os.path.join(UPD, '.nojekyll'), 'w').close()
print(f'Gói cập nhật: dist/update ({len(man_files)} file, bản {VER})')
with zipfile.ZipFile(os.path.join(DIST, 'Babie_hoc_tieng_Trung.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('BAM_DUP_VAO_DAY_DE_CAI.bat', bat)
print('Xong ->', os.path.join(DIST, 'Babie_hoc_tieng_Trung.zip'))
print('Xem thử trên Mac: open dist/On_Tieng_Trung.html')
