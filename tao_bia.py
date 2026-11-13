#!/usr/bin/env python3
"""Tạo ảnh bìa sách cho app: render trang bìa của PDF -> bia/bia_<ID sách>.jpg (rộng 240px, ~20-30KB).
Chạy:  python3 tao_bia.py            (dùng đường dẫn mặc định bên dưới, sửa nếu PDF để chỗ khác)
Ảnh bìa là bản quyền nhà xuất bản → thư mục bia/ nằm trong .gitignore (không đưa lên git). Không có ảnh thì app tự vẽ bìa.
Cần: poppler (pdftoppm) và Pillow."""
import os, subprocess, sys
from PIL import Image
ROOT = os.path.dirname(os.path.abspath(__file__))
H = os.path.expanduser('~')
# ID sách -> (file PDF, số trang bìa)
BOOKS = {
    1: (f'{H}/Downloads/時代華語 1課程.pdf', 1),
    3: (f'{H}/Documents/Phồn thể/當代中文課程1 - 課本.pdf', 1),
    2: (f'{H}/Downloads/當代中文課程2 - 課本.pdf', 1),
}
os.makedirs(os.path.join(ROOT, 'bia'), exist_ok=True)
for bid, (pdf, page) in BOOKS.items():
    if not os.path.exists(pdf):
        print(f'Sách {bid}: không thấy {pdf} — bỏ qua (app sẽ tự vẽ bìa)'); continue
    tmp = os.path.join(ROOT, 'bia', f'_t{bid}')
    subprocess.run(['pdftoppm', '-r', '110', '-f', str(page), '-l', str(page), '-png', '-singlefile', pdf, tmp], check=True)
    im = Image.open(tmp + '.png').convert('RGB'); os.remove(tmp + '.png')
    w, h = im.size
    # bìa dạng trang đơn dọc: giữ nguyên; nếu là trang ngang (2 trang ghép) lấy nửa phải
    if w > h * 1.15:
        im = im.crop((w // 2, 0, w, h)); w, h = im.size
    # cắt viền trắng/đen quanh trang
    from PIL import ImageChops
    bg = Image.new('RGB', im.size, im.getpixel((2, 2)))
    box = ImageChops.difference(im, bg).convert('L').point(lambda p: 255 if p > 24 else 0).getbbox()
    if box and (box[2] - box[0]) > w * .6: im = im.crop(box)
    im.thumbnail((240, 320))
    out = os.path.join(ROOT, 'bia', f'bia_{bid}.jpg'); im.save(out, quality=78, optimize=True)
    print(f'Sách {bid}: {im.size[0]}x{im.size[1]} -> {out} ({os.path.getsize(out)//1024} KB)')
