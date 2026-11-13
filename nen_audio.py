#!/usr/bin/env python3
"""Nén file nghe của sách vào audio/ (mono 48kbps — đủ rõ cho giọng nói, nhỏ gấp ~3 lần).
Chạy:  python3 nen_audio.py "<thư mục chứa 01-01.mp3 ...>" d1
  d1 = tiền tố sách (d1 = 當代中文課程 1, d2 = 當代中文課程 2): file ra là audio/d1-01-01.mp3
Chỉ lấy 4 track đầu của mỗi bài (01 Đối thoại 1 · 02 Từ vựng 1 · 03 Đối thoại 2 · 04 Từ vựng 2);
các track 05+ là bài luyện phát âm, không có chữ trong app nên bỏ qua. Cần ffmpeg (brew install ffmpeg).
File nghe là bản quyền của sách → thư mục audio/ nằm trong .gitignore, đừng đưa lên git.
"""
import sys, os, subprocess
src, prefix = sys.argv[1], sys.argv[2]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio')
os.makedirs(out, exist_ok=True)
n = tot = 0
for lesson in range(1, 16):
    for t in range(1, 5):
        f = os.path.join(src, f'{lesson:02d}-{t:02d}.mp3')
        if not os.path.exists(f):
            continue
        o = os.path.join(out, f'{prefix}-{lesson:02d}-{t:02d}.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '22050', '-b:a', '48k', '-codec:a', 'libmp3lame', o], check=True)
        n += 1; tot += os.path.getsize(o)
print(f'Xong {n} file, {tot/1e6:.1f} MB -> {out}')
