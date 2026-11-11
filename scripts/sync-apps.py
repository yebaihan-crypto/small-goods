#!/usr/bin/env python3
"""
Sync app landing pages and websites from their official upstream GitHub repositories.
Eliminates manual hard-copying and keeps apps/ up to date automatically.
"""

import os
import shutil
import tempfile
import subprocess

HUB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS_DIR = os.path.join(HUB_DIR, 'apps')

REPOS_MAP = {
    'indebox': 'https://github.com/yebaihan-crypto/gap-diary-site.git',
    'socialgraphy': 'https://github.com/yebaihan-crypto/socialgraphy-site.git',
    'screenshot-todo': 'https://github.com/yebaihan-crypto/MultiTodo.git',
    'cookbook': 'https://github.com/yebaihan-crypto/cookbook.git',
    'pongie': 'https://github.com/yebaihan-crypto/pongie.git',
    'dotney': 'https://github.com/yebaihan-crypto/dotney-site.git',
    'new-yorker-century-lens': 'https://github.com/yebaihan-crypto/new-yorker-century-lens.git',
}

IGNORE_PATTERNS = shutil.ignore_patterns(
    '*.xcodeproj', '*.xcworkspace', '*.swift', '*.rb',
    '*.pbxproj', '*.xcuserdatad', '*.xcuserstate', 'CookbookApp', 'CookbookWidget', 'Pongie', 'AppStore*', 'Docs', 'docs',
    '__pycache__', '.git', '.gitignore', '.DS_Store'
)

def sync_repo(slug, repo_url):
    print(f'==> Syncing {slug} from {repo_url}...')
    dest_dir = os.path.join(APPS_DIR, slug)
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        res = subprocess.run(['git', 'clone', '--depth', '1', repo_url, tmp_dir], capture_output=True, text=True)
        if res.returncode != 0:
            print(f'    [!] Failed to clone {repo_url}: {res.stderr.strip()[:100]}')
            return False
            
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        os.makedirs(dest_dir, exist_ok=True)
        
        for item in os.listdir(tmp_dir):
            if item in ['.git', '.gitignore', '.DS_Store'] or item.endswith('.xcodeproj') or item.endswith('.rb'):
                continue
            src_item = os.path.join(tmp_dir, item)
            dest_item = os.path.join(dest_dir, item)
            if os.path.isdir(src_item):
                shutil.copytree(src_item, dest_item, ignore=IGNORE_PATTERNS)
            else:
                shutil.copy2(src_item, dest_item)
                
        print(f'    [✓] Successfully updated apps/{slug}')
        return True

def main():
    print(f'Syncing app websites into: {APPS_DIR}')
    os.makedirs(APPS_DIR, exist_ok=True)
    
    success = 0
    for slug, url in REPOS_MAP.items():
        if sync_repo(slug, url):
            success += 1
            
    print(f'Sync completed: {success}/{len(REPOS_MAP)} apps synced.')

if __name__ == '__main__':
    main()
