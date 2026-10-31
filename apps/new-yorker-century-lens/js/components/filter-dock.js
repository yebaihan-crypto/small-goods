// Filter Dock, Timeline Scrubber, Search, Settings & ❤️ Favorites Controls
class FilterDock {
  constructor(renderer, archive, artists, favoritesManager, onSelectCover, showToast) {
    this.renderer = renderer;
    this.archive = archive;
    this.artists = artists;
    this.favoritesManager = favoritesManager;
    this.onSelectCover = onSelectCover;
    this.showToast = showToast;
    this.favCycleIndex = 0;

    this.timelineSlider = document.getElementById('timeline-slider');
    this.timelineYearDisplay = document.getElementById('timeline-year-display');
    this.categoryTabs = document.querySelectorAll('.cat-pill');
    this.randomBtn = document.getElementById('btn-random');
    this.themeBtn = document.getElementById('btn-theme');
    this.settingsBtn = document.getElementById('btn-settings');
    this.settingsPanel = document.getElementById('settings-panel');
    this.lensRadiusSlider = document.getElementById('lens-radius-slider');
    this.lensPowerSlider = document.getElementById('lens-power-slider');
    this.infoBtn = document.getElementById('btn-info');
    this.aboutModal = document.getElementById('about-modal');

    this.favCountBadge = document.getElementById('fav-count-badge');
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');

    this.isLight = false;
    this.bindEvents();

    if (this.favoritesManager) {
      this.favoritesManager.onChange(() => this.updateFavoritesCount());
      this.updateFavoritesCount();
    }
  }

  updateFavoritesCount() {
    if (this.favCountBadge && this.favoritesManager) {
      const count = this.favoritesManager.count();
      this.favCountBadge.textContent = count;
      this.favCountBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  bindEvents() {
    // 1. Timeline Scrubber (Exact Historical Year Jump)
    this.timelineSlider.addEventListener('input', (e) => {
      const year = parseInt(e.target.value, 10);
      this.timelineYearDisplay.textContent = year;
      const match = this.archive.find(it => it.year >= year);
      if (match) {
        this.renderer.focusOn(match.col, match.row);
      }
    });

    // 2. Category Filter Pills
    this.categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-cat');
        this.filterByCategory(cat);
      });
    });

    // 3. Randomizer "Surprise Me" (🎲)
    this.randomBtn.addEventListener('click', () => {
      const randomCol = Math.floor(Math.random() * 80);
      const randomRow = Math.floor(Math.random() * 40);
      this.renderer.focusOn(randomCol, randomRow);
      
      const year = Math.round(1925 + (randomCol / 79) * 101);
      this.timelineSlider.value = year;
      this.timelineYearDisplay.textContent = year;
    });

    // 4. Dark / Warm Paper Theme Toggle
    this.themeBtn.addEventListener('click', () => {
      this.isLight = !this.isLight;
      document.body.classList.toggle('light-theme', this.isLight);
      this.renderer.setTheme(this.isLight);
      this.themeBtn.title = this.isLight ? "切换至极夜暗黑模式" : "切换至复古暖纸模式";
    });

    // 5. Settings Panel (Lens Radius & Power)
    this.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.settingsPanel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!this.settingsPanel.contains(e.target) && e.target !== this.settingsBtn) {
        this.settingsPanel.classList.remove('active');
      }
    });

    this.lensRadiusSlider.addEventListener('input', (e) => {
      const r = parseFloat(e.target.value);
      this.renderer.setLensParams(r, undefined);
    });

    this.lensPowerSlider.addEventListener('input', (e) => {
      const p = parseFloat(e.target.value);
      this.renderer.setLensParams(undefined, p);
    });

    // 6. About Modal
    this.infoBtn.addEventListener('click', () => {
      this.aboutModal.classList.add('active');
    });

    document.getElementById('about-close-btn').addEventListener('click', () => {
      this.aboutModal.classList.remove('active');
    });

    // 7. Search Input (Artist, Title, or Year)
    this.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        this.searchResults.classList.remove('active');
        return;
      }

      const matches = this.archive.filter(item => 
        item.artist.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q) ||
        String(item.year).includes(q) ||
        item.category.toLowerCase().includes(q)
      ).slice(0, 8);

      if (matches.length > 0) {
        this.searchResults.innerHTML = matches.map(m => `
          <div class="search-item" data-col="${m.col}" data-row="${m.row}">
            <div class="search-item-title">${m.title}</div>
            <div class="search-item-meta">${m.artist} · ${m.date} · ${m.category}</div>
          </div>
        `).join('');
        this.searchResults.classList.add('active');

        this.searchResults.querySelectorAll('.search-item').forEach(el => {
          el.addEventListener('click', () => {
            const col = parseInt(el.getAttribute('data-col'), 10);
            const row = parseInt(el.getAttribute('data-row'), 10);
            this.renderer.focusOn(col, row);
            this.searchResults.classList.remove('active');
            this.searchInput.value = '';
          });
        });
      } else {
        this.searchResults.innerHTML = `<div class="search-no-results">未找到匹配的封面</div>`;
        this.searchResults.classList.add('active');
      }
    });
  }

  filterByCategory(cat) {
    if (cat === 'all') {
      this.renderer.focusOn(40, 20);
      return;
    }

    // Handle ❤️ 喜爱 (Favorites) Filter
    if (cat === 'favorites') {
      if (!this.favoritesManager || this.favoritesManager.count() === 0) {
        if (this.showToast) {
          this.showToast("❤️ 暂无喜爱的封面，在左下角点击「喜爱」即可收藏！");
        }
        return;
      }

      const favItems = this.favoritesManager.getFavoriteItems();
      const target = favItems[this.favCycleIndex % favItems.length];
      this.favCycleIndex++;

      this.renderer.focusOn(target.col, target.row);
      this.timelineSlider.value = target.year;
      this.timelineYearDisplay.textContent = target.year;
      if (this.showToast) {
        this.showToast(`❤️ 漫游到喜爱封面：${target.title} (${this.favCycleIndex}/${favItems.length})`);
      }
      return;
    }

    // Find all matching covers in archive
    const matches = this.archive.filter(item => item.category === cat);
    if (matches.length > 0) {
      const target = matches[Math.floor(Math.random() * matches.length)];
      this.renderer.focusOn(target.col, target.row);
      this.timelineSlider.value = target.year;
      this.timelineYearDisplay.textContent = target.year;
    }
  }

  updateTimelineYear(year) {
    if (this.timelineYearDisplay && year) {
      this.timelineYearDisplay.textContent = year;
      if (document.activeElement !== this.timelineSlider) {
        this.timelineSlider.value = year;
      }
    }
  }
}

window.FilterDock = FilterDock;
