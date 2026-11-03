#!/usr/bin/env python3
"""Build bộ cài 'Halken nhắc Babie học tiếng Trung'.
Chạy:  python3 build.py
Kết quả: dist/Babie_hoc_tieng_Trung.zip  (gửi file này cho bồ, bồ bấm đúp file bên trong là cập nhật)
"""
import json, os, glob, shutil, base64, textwrap, zipfile, io, re

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
data = {'books': [books[k] for k in sorted(books)]}
total = sum(len(l['words']) for b in data['books'] for l in b['lessons'])
print(f'{len(data["books"])} cuốn, {total} từ')

# ---- 2. Tạo trang HTML ----
html = open(os.path.join(ROOT, 'src', 'template.html'), encoding='utf8').read()
html = html.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False))
cfg_path = os.path.join(ROOT, 'config.json')
cfg = json.load(open(cfg_path, encoding='utf8')) if os.path.exists(cfg_path) else {}
report_url = cfg.get('report_url', '').strip()
html = html.replace("/*__REPORT__*/''", json.dumps(report_url))
print('Báo cáo email:', 'BẬT -> ' + report_url[:60] + '...' if report_url else 'TẮT (chưa điền report_url trong config.json)')

# ---- 3. Gói payload ----
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('On_Tieng_Trung/On_Tieng_Trung.html', html)
    z.write(os.path.join(ROOT, 'windows', 'Doi_gio_nhac_hoc.bat'), 'On_Tieng_Trung/Doi_gio_nhac_hoc.bat')
    for f in glob.glob(os.path.join(ROOT, 'windows', 'he_thong', '*')):
        if os.path.basename(f) != 'che_do.txt':
            z.write(f, 'On_Tieng_Trung/he_thong/' + os.path.basename(f))
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
with zipfile.ZipFile(os.path.join(DIST, 'Babie_hoc_tieng_Trung.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('BAM_DUP_VAO_DAY_DE_CAI.bat', bat)
print('Xong ->', os.path.join(DIST, 'Babie_hoc_tieng_Trung.zip'))
print('Xem thử trên Mac: open dist/On_Tieng_Trung.html')
