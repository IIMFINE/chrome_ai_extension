#!/bin/bash
# 生成 PNG 图标的脚本

echo "正在生成 PNG 图标..."

# 检查是否安装了 rsvg-convert (librsvg)
if command -v rsvg-convert &> /dev/null; then
    echo "使用 rsvg-convert 转换图标..."
    rsvg-convert -w 16 -h 16 icons/icon16.svg -o icons/icon16.png
    rsvg-convert -w 48 -h 48 icons/icon48.svg -o icons/icon48.png
    rsvg-convert -w 128 -h 128 icons/icon128.svg -o icons/icon128.png
    echo "✅ PNG 图标生成完成！"
elif command -v convert &> /dev/null; then
    echo "使用 ImageMagick 转换图标..."
    convert -background none -size 16x16 icons/icon16.svg icons/icon16.png
    convert -background none -size 48x48 icons/icon48.svg icons/icon48.png
    convert -background none -size 128x128 icons/icon128.svg icons/icon128.png
    echo "✅ PNG 图标生成完成！"
else
    echo "❌ 未找到图标转换工具"
    echo "请安装以下工具之一："
    echo "  - librsvg: sudo apt-get install librsvg2-bin"
    echo "  - ImageMagick: sudo apt-get install imagemagick"
    echo ""
    echo "或者使用在线工具手动转换："
    echo "  - https://cloudconvert.com/svg-to-png"
    echo "  - https://convertio.co/svg-png/"
    exit 1
fi
