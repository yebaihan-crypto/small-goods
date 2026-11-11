#!/usr/bin/env python3
"""
Deploy The New Yorker Century Lens Gallery into 独立小品 Portfolio (app-hub).
"""

import os
import shutil
import json
import datetime

SRC_DIR = "/Users/arcade/Documents/antigravity/friendly-shannon"
HUB_DIR = "/Users/arcade/WorkBuddy/2026-09-29-15-28-11/app-hub"
APP_DEST_DIR = os.path.join(HUB_DIR, "apps", "new-yorker-century-lens")
WORKS_JSON_PATH = os.path.join(HUB_DIR, "data", "works.json")
ARCHIVE_DIR = os.path.join(HUB_DIR, "data", "_archive")

def deploy():
    print(f"Deploying from {SRC_DIR} to {HUB_DIR}...")
    
    # 1. Ensure directories exist
    os.makedirs(APP_DEST_DIR, exist_ok=True)
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    
    # 2. Copy website files
    # index.html
    shutil.copy2(os.path.join(SRC_DIR, "index.html"), os.path.join(APP_DEST_DIR, "index.html"))
    print("Copied index.html")
    
    # css/
    dest_css = os.path.join(APP_DEST_DIR, "css")
    if os.path.exists(dest_css):
        shutil.rmtree(dest_css)
    shutil.copytree(os.path.join(SRC_DIR, "css"), dest_css)
    print("Copied css/")
    
    # js/
    dest_js = os.path.join(APP_DEST_DIR, "js")
    if os.path.exists(dest_js):
        shutil.rmtree(dest_js)
    shutil.copytree(os.path.join(SRC_DIR, "js"), dest_js)
    print("Copied js/")
    
    # README.md
    if os.path.exists(os.path.join(SRC_DIR, "README.md")):
        shutil.copy2(os.path.join(SRC_DIR, "README.md"), os.path.join(APP_DEST_DIR, "README.md"))
        print("Copied README.md")

    # 3. Copy visual assets to app-hub
    icon_src = os.path.join(SRC_DIR, "assets", "new-yorker.png")
    icon_dest = os.path.join(HUB_DIR, "assets", "icons", "new-yorker.png")
    if os.path.exists(icon_src):
        shutil.copy2(icon_src, icon_dest)
        print(f"Copied icon to {icon_dest}")
        
    cover_src = os.path.join(SRC_DIR, "assets", "new-yorker.jpg")
    cover_dest = os.path.join(HUB_DIR, "assets", "covers", "new-yorker.jpg")
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, cover_dest)
        print(f"Copied cover to {cover_dest}")

    # 4. Backup works.json
    now_str = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = os.path.join(ARCHIVE_DIR, f"works.json.bak-{now_str}-add-new-yorker")
    shutil.copy2(WORKS_JSON_PATH, backup_path)
    print(f"Backed up works.json to {backup_path}")

    # 5. Update works.json
    with open(WORKS_JSON_PATH, "r", encoding="utf-8") as f:
        hub_data = json.load(f)

    # Check if slug already exists
    existing_idx = next((i for i, w in enumerate(hub_data["works"]) if w["slug"] == "new-yorker-century-lens"), None)

    new_work = {
        "slug": "new-yorker-century-lens",
        "category": "site",
        "nameZh": "纽约客百年封面画廊",
        "nameEn": "The New Yorker Century Lens",
        "taglineZh": "3D 物理球形鱼眼透镜矩阵画廊：收录 1925–2026 跨越百年的 3,200+ 期《纽约客》杂志封面，支持全景穿梭与一键复制大师级 AI 提示词。",
        "taglineEn": "A 3D fisheye lens matrix gallery archiving 3,200+ New Yorker covers across 1925–2026 with one-click AI prompt copying.",
        "status": "live",
        "chips": [
            "WebGL / 3D 透镜",
            "3,200+ 封面",
            "AI 提示词",
            "纯前端零依赖"
        ],
        "accent": "#E5A93C",
        "icon": "assets/icons/new-yorker.png",
        "cover": "assets/covers/new-yorker.jpg",
        "meta": "1925 - 2026",
        "cta": {
            "url": "apps/new-yorker-century-lens/index.html",
            "zh": "打开画廊",
            "en": "Open gallery"
        }
    }

    if existing_idx is not None:
        hub_data["works"][existing_idx] = new_work
        print("Updated existing entry in works.json")
    else:
        # Find where other 'site' items are placed, or place next to screenshot-studio
        studio_idx = next((i for i, w in enumerate(hub_data["works"]) if w["slug"] == "screenshot-studio"), None)
        if studio_idx is not None:
            hub_data["works"].insert(studio_idx, new_work)
        else:
            hub_data["works"].append(new_work)
        print("Inserted new work entry into works.json")

    with open(WORKS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(hub_data, f, ensure_ascii=False, indent=2)
    print("Saved updated works.json")

    # 6. Verify works count
    visible = [w for w in hub_data["works"] if not w.get("hidden")]
    live = [w for w in visible if w.get("status") == "live"]
    sites = [w for w in visible if w.get("category") == "site"]
    print(f"\nVerification:")
    print(f"- Total visible works: {len(visible)}")
    print(f"- Live published works: {len(live)}")
    print(f"- Visible sites count: {len(sites)}")
    print(f"- New Yorker Entry in works.json: YES")

if __name__ == "__main__":
    deploy()
