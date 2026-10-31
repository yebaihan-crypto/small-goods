// Application Entrypoint & Orchestrator with Real Historical Cover Archives & ❤️ Favorites
document.addEventListener('DOMContentLoaded', () => {
  const archive = window.NEW_YORKER_ARCHIVE || [];
  const artists = window.ARTISTS_CATALOG || [];

  console.log(`Loaded ${archive.length} REAL New Yorker covers from authentic archives.`);

  // Toast notification helper
  const toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 2400);
  }

  // 1. Initialize Favorites Manager
  const favoritesManager = new window.FavoritesManager(archive);

  // 2. Initialize Prompt & Real Image Modal with Favorite support
  const promptModal = new window.PromptModal(
    (cover) => {
      const isFav = favoritesManager.toggle(cover.id);
      hudCard.updateFavoriteUI(isFav);
      showToast(isFav ? `❤️ 已加入喜爱收藏：${cover.title}` : `已取消喜爱：${cover.title}`);
      return isFav;
    },
    (id) => favoritesManager.has(id)
  );

  // 3. Initialize HUD Card (with Real Image Thumbnail & ❤️ Like button)
  const hudContainer = document.getElementById('hud-container');
  const hudCard = new window.HudCard(
    hudContainer,
    (cover) => {
      navigator.clipboard.writeText(cover.prompt).then(() => {
        showToast("✓ AI 提示词已成功复制到剪贴板！可直接粘贴至 Midjourney / Flux");
      }).catch(() => {
        showToast("提示词复制失败，请手动在名作档案中复制");
      });
    },
    (cover) => {
      promptModal.show(cover);
    },
    (cover) => {
      const isFav = favoritesManager.toggle(cover.id);
      showToast(isFav ? `❤️ 已加入喜爱收藏：${cover.title}` : `已取消喜爱：${cover.title}`);
      return isFav;
    },
    (id) => favoritesManager.has(id)
  );

  let filterDock = null;
  const btnLock = document.getElementById('btn-lock');

  // 4. Initialize Matrix Renderer (Rendering Real Cover Images + Fisheye + Favorite Hearts)
  const canvas = document.getElementById('gl-canvas');
  const renderer = new window.MatrixRenderer(
    canvas,
    archive,
    (focusedCover) => {
      hudCard.update(focusedCover);
      if (filterDock) {
        filterDock.updateTimelineYear(focusedCover.year);
      }
    },
    (isLocked, lockedCover) => {
      if (btnLock) {
        if (isLocked) {
          btnLock.classList.add('active');
          btnLock.style.color = '#eab308';
          btnLock.style.borderColor = '#eab308';
          btnLock.title = "已定格锁定 (点击或空格键解锁)";
          showToast(`🔒 已定格锁定：${lockedCover.title}（点击画布或按空格解锁）`);
        } else {
          btnLock.classList.remove('active');
          btnLock.style.color = '';
          btnLock.style.borderColor = '';
          btnLock.title = "定格/锁定当前封面 (快捷键: 空格键或点击封面)";
          showToast('🔓 已解除锁定，恢复自由漫游');
        }
      }
    },
    (id) => favoritesManager.has(id)
  );

  if (btnLock) {
    btnLock.addEventListener('click', () => {
      renderer.toggleLock();
    });
  }

  // Global Keyboard Shortcut: Press 'L' to Like / Favorite current cover
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'KeyL' || e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      const currentCover = hudCard.currentCover;
      if (currentCover) {
        const isFav = favoritesManager.toggle(currentCover.id);
        hudCard.updateFavoriteUI(isFav);
        if (promptModal) promptModal.updateFavoriteUI(isFav);
        showToast(isFav ? `❤️ 已喜爱：${currentCover.title} (快捷键 L)` : `已取消喜爱：${currentCover.title}`);
      }
    }
  });

  // 5. Initialize Filter Dock & Controls (with Favorites tab support)
  filterDock = new window.FilterDock(
    renderer,
    archive,
    artists,
    favoritesManager,
    (cover) => {
      renderer.focusOn(cover.col, cover.row);
    },
    showToast
  );

  // Set initial focus on Adrian Tomine's famous "The Audience / Screen Time" (2014-01-06)
  const initialCover = archive.find(c => c.id === 'tny-2014-01-06') || archive[archive.length - 1];
  if (initialCover) {
    renderer.focusOn(initialCover.col, initialCover.row);
    hudCard.update(initialCover);
  }
});
