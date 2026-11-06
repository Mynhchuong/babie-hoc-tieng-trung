#!/bin/sh
# Đẩy bản cập nhật (dist/update) lên nhánh gh-pages của repo -> GitHub Pages phục vụ cho máy của bồ.
# CHỈ ANH (Halken) chạy tay: lệnh này CÔNG BỐ app lên mạng. Dùng khi đã bật GitHub Pages (Settings -> Pages -> nhánh gh-pages).
# Sau đó điền config.json: "update_url": "https://<tên-github>.github.io/<tên-repo>"  rồi python3 build.py và gửi bộ cài mới 1 lần.
set -e
cd "$(dirname "$0")"
python3 build.py
tmp=$(mktemp -d)
cp -R dist/update/. "$tmp"/
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" commit -q -m "Cap nhat app $(date +%Y%m%d-%H%M%S)"
git -C "$tmp" push -f "$(git remote get-url origin)" gh-pages
rm -rf "$tmp"
echo "Xong. Máy bồ sẽ tự nhận bản mới trong tối đa 2 giờ (hoặc menu Start -> Cập nhật app ngay)."
