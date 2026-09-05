#!/bin/bash
# Mac/Linux用: bash download_images.sh で実行
cd "$(dirname "$0")/.." && mkdir -p images && cd images
while read url; do curl -sO "$url" && echo "saved: $(basename $url)"; done < ../tools/images_list.txt
echo "完了"
