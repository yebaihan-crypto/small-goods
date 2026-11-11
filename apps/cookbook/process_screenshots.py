import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# 尺寸规格
TARGET_SIZES = {
    "6.7inch": (1290, 2796), # iPhone 15/14 Pro Max
    "6.5inch": (1284, 2778)  # iPhone 11 Pro Max / XS Max
}

# 截图配置列表
SCREENSHOT_CONFIGS = [
    {
        "file": "点菜.png",
        "title": "智能点菜 轻松挑选",
        "subtitle": "灵活挑选心仪菜品，定制属于你的每日美味餐单",
        "gradient": [(255, 126, 95), (254, 180, 123)] # 温暖暖橙渐变
    },
    {
        "file": "准备步骤.jpg",
        "title": "烹饪指引 细致步骤",
        "subtitle": "清晰食材清单与步骤图解，让烹饪变得简单又有趣",
        "gradient": [(74, 194, 154), (189, 255, 243)] # 清新薄荷绿渐变
    },
    {
        "file": "点菜order.jpg",
        "title": "高效下单 实时跟进",
        "subtitle": "一键便捷选择菜品，随时掌控用餐计划与准备进度",
        "gradient": [(106, 17, 203), (37, 117, 252)] # 优雅蓝紫渐变
    },
    {
        "file": "时间轴回顾.png",
        "title": "时光日记 美食留痕",
        "subtitle": "时间轴全景回顾，记录每一餐的点滴欢愉与记忆",
        "gradient": [(255, 94, 98), (255, 153, 102)] # 活力珊瑚橙渐变
    }
]

FONT_PATH = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_SUB_PATH = "/System/Library/Fonts/Hiragino Sans GB.ttc"

def create_gradient_image(width, height, color1, color2):
    """创建线性渐变背景"""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        # 纵向渐变比例
        alpha = int(255 * (y / float(height)))
        mask_data.extend([alpha] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def draw_rounded_image_with_shadow(img, target_width, corner_radius=40):
    """缩放图片并添加圆角和阴影效果"""
    ratio = target_width / float(img.width)
    target_height = int(img.height * ratio)
    img_resized = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    # 创建圆角遮罩
    mask = Image.new('L', (target_width, target_height), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.rounded_rectangle([0, 0, target_width, target_height], radius=corner_radius, fill=255)
    
    # 转换为RGBA
    img_rgba = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
    img_rgba.paste(img_resized, (0, 0), mask)
    
    # 创建阴影底板
    shadow_margin = 60
    shadow_w = target_width + shadow_margin * 2
    shadow_h = target_height + shadow_margin * 2
    shadow = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    
    # 画黑色圆角矩形作为阴影本体
    shadow_draw.rounded_rectangle(
        [shadow_margin, shadow_margin + 15, shadow_margin + target_width, shadow_margin + 15 + target_height],
        radius=corner_radius,
        fill=(0, 0, 0, 90)
    )
    # 高斯模糊实现软阴影
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=25))
    
    # 将裁切好圆角的原图贴到阴影上方
    shadow.paste(img_rgba, (shadow_margin, shadow_margin), img_rgba)
    return shadow, shadow_margin

def generate_screenshot(config, size_name, width, height, output_path):
    color1, color2 = config["gradient"]
    bg = create_gradient_image(width, height, color1, color2)
    
    # 顶部添加淡白色半透明装饰遮罩
    overlay = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle([0, 0, width, int(height * 0.35)], fill=(255, 255, 255, 25))
    bg = Image.alpha_composite(bg.convert('RGBA'), overlay).convert('RGB')
    
    draw = ImageDraw.Draw(bg)
    
    # 字体加载
    try:
        title_font = ImageFont.truetype(FONT_PATH, int(width * 0.058)) # 主标题字体大小
        sub_font = ImageFont.truetype(FONT_SUB_PATH, int(width * 0.032)) # 副标题字体大小
    except Exception as e:
        print(f"Font load error: {e}")
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
        
    # 绘制主标题
    title_text = config["title"]
    title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_x = (width - title_w) // 2
    title_y = int(height * 0.075)
    
    # 标题文字轻微阴影
    draw.text((title_x + 2, title_y + 2), title_text, font=title_font, fill=(0, 0, 0, 60))
    draw.text((title_x, title_y), title_text, font=title_font, fill=(255, 255, 255))
    
    # 绘制副标题
    sub_text = config["subtitle"]
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (width - sub_w) // 2
    sub_y = title_y + (title_bbox[3] - title_bbox[1]) + int(height * 0.018)
    
    draw.text((sub_x, sub_y), sub_text, font=sub_font, fill=(255, 255, 255, 230))
    
    # 处理展示图片
    img_path = config["file"]
    if os.path.exists(img_path):
        raw_img = Image.open(img_path).convert('RGB')
        
        # 计算设备图形显示区宽度
        card_target_w = int(width * 0.82)
        shadow_img, shadow_margin = draw_rounded_image_with_shadow(raw_img, card_target_w, corner_radius=int(width * 0.04))
        
        # 计算粘贴坐标 (标题下方居中)
        paste_x = (width - shadow_img.width) // 2
        paste_y = sub_y + 80 - shadow_margin
        
        bg_rgba = bg.convert('RGBA')
        bg_rgba.paste(shadow_img, (paste_x, paste_y), shadow_img)
        bg = bg_rgba.convert('RGB')
        
    # 保存结果
    bg.save(output_path, quality=95)
    print(f"Generated ({size_name}): {output_path}")

def main():
    base_out_dir = "AppStore_Screenshots"
    if not os.path.exists(base_out_dir):
        os.makedirs(base_out_dir)
        
    for size_name, (w, h) in TARGET_SIZES.items():
        size_dir = os.path.join(base_out_dir, size_name)
        if not os.path.exists(size_dir):
            os.makedirs(size_dir)
            
        for idx, config in enumerate(SCREENSHOT_CONFIGS, 1):
            file_stem = os.path.splitext(config["file"])[0]
            out_filename = f"{idx}_{file_stem}_{size_name}.jpg"
            out_path = os.path.join(size_dir, out_filename)
            generate_screenshot(config, size_name, w, h, out_path)
            
            # 同时复制一份 6.5inch 和 6.7inch 到根目录便于快速查阅
            root_out_path = os.path.join(base_out_dir, f"{idx}_{file_stem}_{size_name}.jpg")
            generate_screenshot(config, size_name, w, h, root_out_path)

    print("All App Store screenshots successfully generated!")

if __name__ == "__main__":
    main()

