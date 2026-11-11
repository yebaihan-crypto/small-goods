#!/usr/bin/env python3
"""
Generate high-craft Icon (512x512 PNG) and Cover Banner (880x550 JPG)
for The New Yorker Century Lens Gallery on the 独立小品 Portfolio.
"""

import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

GEORGIA_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"
HEITI = "/System/Library/Fonts/STHeiti Medium.ttc"
ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"

def make_squircle_mask(size, radius):
    """Generate anti-aliased squircle mask."""
    scale = 4
    w, h = size[0] * scale, size[1] * scale
    r = radius * scale
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)

def draw_top_hat_monocle(draw, cx, cy, scale=1.0, color=(229, 169, 60)):
    """Draw Eustace Tilley's iconic top hat and monocle silhouette."""
    # Top hat
    # Brim
    brim_w = 90 * scale
    brim_h = 10 * scale
    draw.ellipse([cx - brim_w, cy - brim_h, cx + brim_w, cy + brim_h], fill=color)
    
    # Hat crown (tapered top hat)
    crown_top_w = 60 * scale
    crown_bot_w = 52 * scale
    crown_h = 95 * scale
    crown_pts = [
        (cx - crown_bot_w, cy - 2 * scale),
        (cx - crown_top_w, cy - crown_h),
        (cx + crown_top_w, cy - crown_h),
        (cx + crown_bot_w, cy - 2 * scale),
    ]
    draw.polygon(crown_pts, fill=color)
    
    # Crown top curve
    draw.ellipse([cx - crown_top_w, cy - crown_h - 10 * scale, cx + crown_top_w, cy - crown_h + 10 * scale], fill=color)
    
    # Hat band (dark ribbon)
    band_h = 16 * scale
    band_color = (25, 23, 20)
    draw.polygon([
        (cx - crown_bot_w - 1, cy - 4 * scale),
        (cx - crown_bot_w + 1, cy - 4 * scale - band_h),
        (cx + crown_bot_w - 1, cy - 4 * scale - band_h),
        (cx + crown_bot_w + 1, cy - 4 * scale),
    ], fill=band_color)
    
    # Golden cockade / ribbon bow on hat band
    draw.ellipse([cx + 30 * scale, cy - 12 * scale, cx + 46 * scale, cy - 4 * scale], fill=(245, 195, 95))

    # Monocle
    mono_cx = cx + 22 * scale
    mono_cy = cy + 42 * scale
    mono_r = 28 * scale
    # Outer ring
    draw.ellipse([mono_cx - mono_r, mono_cy - mono_r, mono_cx + mono_r, mono_cy + mono_r], outline=(245, 195, 95), width=max(2, int(3 * scale)))
    # Glass tint / highlight
    draw.arc([mono_cx - mono_r + 4, mono_cy - mono_r + 4, mono_cx + mono_r - 4, mono_cy + mono_r - 4], start=-60, end=40, fill=(255, 255, 255, 200), width=max(1, int(2 * scale)))
    
    # Monocle handle & ribbon loop
    handle_len = 38 * scale
    draw.line([mono_cx - mono_r + 4, mono_cy + mono_r * 0.7, mono_cx - mono_r - handle_len * 0.6, mono_cy + mono_r * 0.7 + handle_len], fill=(245, 195, 95), width=max(2, int(2.5 * scale)))
    # Ribbon curve
    draw.arc([mono_cx - mono_r - handle_len * 0.6 - 15, mono_cy + mono_r * 0.7 + handle_len - 5, mono_cx - mono_r - handle_len * 0.6 + 15, mono_cy + mono_r * 0.7 + handle_len + 25], start=90, end=270, fill=(245, 195, 95), width=max(1, int(2 * scale)))

def generate_icon(out_path):
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas = Image.new("RGBA", size, (20, 18, 16, 255))
    draw = ImageDraw.Draw(canvas)

    # 1. Subtle radial gradient background
    cx, cy = 256, 256
    for r in range(320, 0, -4):
        alpha = int(255 * (1 - (r / 320) * 0.45))
        # Warm golden-amber dark glow
        c = (int(26 + (r / 320) * -12), int(22 + (r / 320) * -10), int(18 + (r / 320) * -8), 255)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

    # 2. Concentric fisheye lens coordinate rings (grid sphere motif)
    for rad in [220, 175, 130, 85]:
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(229, 169, 60, 24), width=1)
    
    # Lens crosshairs / ticks
    draw.line([cx - 230, cy, cx + 230, cy], fill=(229, 169, 60, 20), width=1)
    draw.line([cx, cy - 230, cx, cy + 230], fill=(229, 169, 60, 20), width=1)

    # 3. Outer lens glass ring (metallic gold)
    draw.ellipse([cx - 195, cy - 195, cx + 195, cy + 195], outline=(229, 169, 60, 140), width=3)
    # Lens reflection arc
    draw.arc([cx - 190, cy - 190, cx + 190, cy + 190], start=-70, end=20, fill=(255, 240, 210, 220), width=4)
    draw.arc([cx - 190, cy - 190, cx + 190, cy + 190], start=110, end=170, fill=(229, 169, 60, 100), width=2)

    # 4. Central Tilley Top Hat & Monocle
    draw_top_hat_monocle(draw, cx=256, cy=220, scale=1.35, color=(229, 169, 60))

    # 5. Editorial Typography
    font_tny = ImageFont.truetype(GEORGIA_BOLD, 30)
    font_sub = ImageFont.truetype(GEORGIA, 16)
    font_pill = ImageFont.truetype(ARIAL, 12)

    # "THE NEW YORKER"
    t1 = "THE NEW YORKER"
    w1 = font_tny.getlength(t1)
    draw.text((cx - w1 / 2, 350), t1, fill=(245, 240, 230), font=font_tny)

    # "CENTURY LENS · 3D GALLERY"
    t2 = "CENTURY LENS · 3D MATRIX"
    w2 = font_sub.getlength(t2)
    draw.text((cx - w2 / 2, 392), t2, fill=(200, 175, 130), font=font_sub)

    # Bottom pill badge "1925 — 2026"
    badge_w, badge_h = 130, 26
    bx, by = cx - badge_w / 2, 432
    draw.rounded_rectangle([bx, by, bx + badge_w, by + badge_h], radius=13, fill=(35, 30, 25), outline=(229, 169, 60, 120), width=1)
    tb = "1925 — 2026"
    wb = font_pill.getlength(tb)
    draw.text((cx - wb / 2, by + 6), tb, fill=(229, 169, 60), font=font_pill)

    # 6. Apply Squircle Mask with soft border highlight
    mask = make_squircle_mask(size, 115)
    img.paste(canvas, (0, 0), mask)

    # Inner golden rim on the squircle edge
    rim_img = Image.new("RGBA", size, (0, 0, 0, 0))
    rim_draw = ImageDraw.Draw(rim_img)
    rim_draw.rounded_rectangle([2, 2, 509, 509], radius=115, outline=(229, 169, 60, 60), width=2)
    rim_draw.rounded_rectangle([4, 4, 507, 507], radius=113, outline=(255, 255, 255, 25), width=1)
    img.alpha_composite(rim_img)

    img.save(out_path, "PNG")
    print(f"Generated Icon: {out_path} ({size[0]}x{size[1]})")

def generate_cover(out_path):
    size = (880, 550) # 16:10
    img = Image.new("RGB", size, (16, 14, 12))
    draw = ImageDraw.Draw(img)

    # 1. Background with radial ambient illumination
    cx, cy = 440, 265
    for r in range(500, 0, -5):
        fac = 1 - (r / 500)
        c = (
            int(16 + fac * 24),
            int(14 + fac * 18),
            int(12 + fac * 12)
        )
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

    # 2. Simulated 3D Fisheye Perspective Covers Matrix
    # Grid of cover cards with spherical bulging distortion towards center
    cols = 15
    rows = 9
    card_w = 46
    card_h = 62
    spacing_x = 58
    spacing_y = 66
    grid_ox = cx - (cols // 2) * spacing_x
    grid_oy = cy - (rows // 2) * spacing_y

    # Curated palette of classic New Yorker cover art colors
    PALETTES = [
        (196, 77, 53),   # Terracotta Red
        (224, 168, 74),  # Mustard Yellow
        (54, 98, 122),   # Atlantic Blue
        (46, 117, 89),   # Central Park Green
        (238, 226, 204), # Warm Paper / Tilley Ivory
        (139, 88, 134),  # Vintage Plum
        (205, 133, 63),  # Ochre Brown
        (85, 107, 47),   # Olive
        (70, 80, 95),    # Gotham Dusk Navy
        (220, 110, 60),  # Sunset Orange
    ]

    lens_r = 210

    for j in range(rows):
        for i in range(cols):
            base_x = grid_ox + i * spacing_x
            base_y = grid_oy + j * spacing_y
            
            # Vector from lens center
            dx = base_x - cx
            dy = base_y - cy
            dist = math.hypot(dx, dy)

            # Fisheye spherical displacement & scale
            scale = 1.0
            cur_x = base_x
            cur_y = base_y
            alpha = 180

            if dist < lens_r:
                # Spherical bulge formula
                norm_d = dist / lens_r
                factor = math.cos(norm_d * math.pi * 0.5)
                scale = 1.0 + 1.15 * (factor ** 1.4)
                cur_x = cx + dx * (1.0 + 0.35 * factor)
                cur_y = cy + dy * (1.0 + 0.35 * factor)
                alpha = int(180 + 75 * factor)
            elif dist < lens_r + 80:
                fade = 1.0 - (dist - lens_r) / 80.0
                scale = 1.0 + 0.15 * fade

            # Pick color deterministically
            color_idx = (i * 7 + j * 13) % len(PALETTES)
            base_color = PALETTES[color_idx]
            
            # Card dimensions with scale
            w = card_w * scale
            h = card_h * scale
            x1 = cur_x - w / 2
            y1 = cur_y - h / 2
            x2 = cur_x + w / 2
            y2 = cur_y + h / 2

            # Dim peripheral cards
            dist_center = math.hypot(cur_x - cx, cur_y - cy)
            dim = max(0.2, 1.0 - (dist_center / 480.0) ** 1.3)
            fill_c = (
                int(base_color[0] * dim),
                int(base_color[1] * dim),
                int(base_color[2] * dim)
            )

            # Draw magazine cover card
            draw.rounded_rectangle([x1, y1, x2, y2], radius=max(2, int(3 * scale)), fill=fill_c)
            
            # New Yorker masthead space strip at top of card
            draw.rectangle([x1 + 2, y1 + 2, x2 - 2, y1 + max(4, int(9 * scale))], fill=(int(20 * dim), int(18 * dim), int(16 * dim)))
            
            # Central detail on zoomed covers inside lens
            if scale > 1.4:
                # Mini artwork lines
                draw.rounded_rectangle([x1 + 4, y1 + 14, x2 - 4, y2 - 4], radius=2, fill=(int(fill_c[0] * 1.15), int(fill_c[1] * 1.15), int(fill_c[2] * 1.15)))

    # 3. Luminous Fisheye Glass Ring & Caustic Highlights
    # Glass boundary
    draw.ellipse([cx - lens_r, cy - lens_r, cx + lens_r, cy + lens_r], outline=(229, 169, 60, 160), width=2)
    draw.ellipse([cx - lens_r - 2, cy - lens_r - 2, cx + lens_r + 2, cy + lens_r + 2], outline=(245, 195, 95, 90), width=1)
    
    # Prismatic chromatic aberration rims
    draw.arc([cx - lens_r + 1, cy - lens_r + 1, cx + lens_r - 1, cy + lens_r - 1], start=-85, end=35, fill=(255, 240, 200), width=3)
    draw.arc([cx - lens_r + 3, cy - lens_r + 3, cx + lens_r - 3, cy + lens_r - 3], start=-70, end=15, fill=(255, 255, 255), width=2)
    draw.arc([cx - lens_r, cy - lens_r, cx + lens_r, cy + lens_r], start=105, end=175, fill=(229, 169, 60), width=2)

    # 4. Focal Hero Card in the center: Tilley Inaugural Issue 1925
    center_w, center_h = 100, 138
    fcx1, fcy1 = cx - center_w / 2, cy - center_h / 2
    fcx2, fcy2 = cx + center_w / 2, cy + center_h / 2
    # Shadow
    draw.rounded_rectangle([fcx1 - 3, fcy1 - 3, fcx2 + 3, fcy2 + 3], radius=6, outline=(245, 195, 95), width=2)
    draw.rounded_rectangle([fcx1, fcy1, fcx2, fcy2], radius=5, fill=(238, 226, 204))
    
    # Masthead on focal card
    draw.rectangle([fcx1, fcy1, fcx2, fcy1 + 22], fill=(28, 24, 20))
    font_focal_tny = ImageFont.truetype(GEORGIA_BOLD, 9)
    draw.text((fcx1 + 8, fcy1 + 6), "THE NEW YORKER", fill=(245, 195, 95), font=font_focal_tny)

    # Draw Tilley silhouette in center card
    draw_top_hat_monocle(draw, cx=cx, cy=cy + 2, scale=0.48, color=(40, 35, 30))

    # 5. UI Elements & Overlays
    # Top Left Brand
    font_brand = ImageFont.truetype(GEORGIA_BOLD, 18)
    font_badge = ImageFont.truetype(ARIAL, 11)
    font_sub = ImageFont.truetype(GEORGIA, 12)

    draw.rounded_rectangle([28, 26, 260, 60], radius=17, fill=(22, 19, 16), outline=(229, 169, 60, 120), width=1)
    draw.text((42, 34), "🎩 THE NEW YORKER", fill=(245, 240, 230), font=font_brand)

    # Top Right Badge
    pill_text = "WebGL 3D FISHEYE MATRIX"
    draw.rounded_rectangle([size[0] - 225, 26, size[0] - 28, 60], radius=17, fill=(22, 19, 16), outline=(229, 169, 60, 100), width=1)
    draw.text((size[0] - 208, 36), pill_text, fill=(229, 169, 60), font=font_badge)

    # 6. Floating HUD Card (Bottom Left, 1:1 with reference)
    hud_w, hud_h = 320, 115
    hx, hy = 28, size[1] - hud_h - 26
    # Glassmorphism container
    draw.rounded_rectangle([hx, hy, hx + hud_w, hy + hud_h], radius=14, fill=(18, 16, 14), outline=(65, 55, 42), width=1)
    
    # SVG Score Ring on HUD
    score_cx, score_cy = hx + 36, hy + 38
    draw.ellipse([score_cx - 20, score_cy - 20, score_cx + 20, score_cy + 20], outline=(45, 40, 35), width=3)
    draw.arc([score_cx - 20, score_cy - 20, score_cx + 20, score_cy + 20], start=-90, end=250, fill=(229, 169, 60), width=3)
    font_score = ImageFont.truetype(GEORGIA_BOLD, 14)
    draw.text((score_cx - 9, score_cy - 8), "98", fill=(245, 240, 230), font=font_score)

    # HUD Texts
    font_hud_title = ImageFont.truetype(GEORGIA_BOLD, 14)
    font_hud_meta = ImageFont.truetype(GEORGIA, 12)
    font_hud_tag = ImageFont.truetype(ARIAL, 10)

    draw.text((hx + 68, hy + 18), "Eustace Tilley · 创刊号", fill=(245, 240, 230), font=font_hud_title)
    draw.text((hx + 68, hy + 38), "1925-02-21 · Rea Irvin", fill=(175, 155, 130), font=font_hud_meta)

    # Category Pill
    draw.rounded_rectangle([hx + 68, hy + 66, hx + 195, hy + 88], radius=11, fill=(35, 30, 24), outline=(229, 169, 60, 100), width=1)
    draw.text((hx + 78, hy + 72), "Historical Milestone", fill=(229, 169, 60), font=font_hud_tag)

    # Prompt Copier Pill
    draw.rounded_rectangle([hx + 205, hy + 66, hx + 295, hy + 88], radius=11, fill=(229, 169, 60), outline=(245, 195, 95), width=1)
    draw.text((hx + 215, hy + 72), "AI Prompt 库", fill=(20, 18, 16), font=font_hud_tag)

    # Bottom Right Stat Pill "1925 - 2026 · 3,200+ 封面档案"
    stat_w, stat_h = 240, 36
    sx, sy = size[0] - stat_w - 28, size[1] - stat_h - 26
    draw.rounded_rectangle([sx, sy, sx + stat_w, sy + stat_h], radius=18, fill=(22, 19, 16), outline=(229, 169, 60, 120), width=1)
    font_stat = ImageFont.truetype(GEORGIA, 12)
    draw.text((sx + 20, sy + 10), "1925 — 2026 · 3,200+ 封面档案", fill=(245, 235, 215), font=font_stat)

    img.save(out_path, "JPEG", quality=95)
    print(f"Generated Cover: {out_path} ({size[0]}x{size[1]})")

if __name__ == "__main__":
    generate_icon("assets/new-yorker.png")
    generate_cover("assets/new-yorker.jpg")
