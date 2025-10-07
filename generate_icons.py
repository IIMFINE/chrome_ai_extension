#!/usr/bin/env python3
"""
生成简单的 PNG 图标
如果系统没有安装 librsvg 或 ImageMagick，可以使用这个 Python 脚本
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    def create_icon(size, filename):
        # 创建渐变背景
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 绘制圆角矩形背景（渐变紫色）
        radius = max(3, size // 8)
        # 简化版：使用单色而不是渐变
        color = (102, 126, 234, 255)  # #667eea
        draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=color)
        
        # 绘制简单的机器人图标
        if size >= 32:
            # 绘制播放三角形
            triangle_size = size // 4
            triangle_x = size // 4
            triangle_y = size // 3
            draw.polygon([
                (triangle_x, triangle_y),
                (triangle_x + triangle_size, triangle_y + triangle_size // 2),
                (triangle_x, triangle_y + triangle_size)
            ], fill=(255, 255, 255, 230))
            
            # 绘制圆点
            circle_x = triangle_x + triangle_size + size // 8
            circle_y = triangle_y + triangle_size // 2
            circle_r = max(2, size // 16)
            draw.ellipse([
                circle_x - circle_r, circle_y - circle_r,
                circle_x + circle_r, circle_y + circle_r
            ], fill=(255, 255, 255, 230))
        elif size >= 16:
            # 小图标简化版
            # 三角形
            draw.polygon([
                (size//3, size//3),
                (size*2//3, size//2),
                (size//3, size*2//3)
            ], fill=(255, 255, 255, 230))
            
        # 保存
        img.save(filename, 'PNG')
        print(f"✅ 已创建: {filename}")
    
    # 创建 icons 目录
    os.makedirs('icons', exist_ok=True)
    
    # 生成不同尺寸的图标
    create_icon(16, 'icons/icon16.png')
    create_icon(48, 'icons/icon48.png')
    create_icon(128, 'icons/icon128.png')
    
    print("\n🎉 所有图标已成功生成！")
    
except ImportError:
    print("❌ 未安装 Pillow 库")
    print("请运行: pip install Pillow")
    print("\n或者使用在线工具手动转换 SVG 图标：")
    print("  - https://cloudconvert.com/svg-to-png")
    print("  - https://convertio.co/svg-png/")
except Exception as e:
    print(f"❌ 生成图标时出错: {e}")
