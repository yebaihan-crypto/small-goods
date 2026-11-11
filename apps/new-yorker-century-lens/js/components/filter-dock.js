// Filter Dock, Timeline Scrubber, Search, Settings & 题材/画师 二级菜单
class FilterDock {
  constructor(renderer, archive, artists, favoritesManager, onSelectCover, showToast) {
    this.renderer = renderer;
    this.archive = archive;
    this.artistsCatalog = artists;
    this.favoritesManager = favoritesManager;
    this.onSelectCover = onSelectCover;
    this.showToast = showToast;

    this.activeCategory = 'all';
    this.activeArtist = 'all';

    // DOM Elements
    this.timelineSlider = document.getElementById('timeline-slider');
    this.timelineYearDisplay = document.getElementById('timeline-year-display');

    // Dropdowns
    this.dropdownCategory = document.getElementById('dropdown-category');
    this.btnDropdownCategory = document.getElementById('btn-dropdown-category');
    this.labelCategory = document.getElementById('label-category');
    this.menuCategory = document.getElementById('menu-category');

    this.dropdownArtist = document.getElementById('dropdown-artist');
    this.btnDropdownArtist = document.getElementById('btn-dropdown-artist');
    this.labelArtist = document.getElementById('label-artist');
    this.menuArtist = document.getElementById('menu-artist');

    // Reset Pill
    this.btnFilterReset = document.getElementById('btn-filter-reset');
    this.resetFilterText = document.getElementById('reset-filter-text');

    // Actions & Controls
    this.randomBtn = document.getElementById('btn-random');
    this.themeBtn = document.getElementById('btn-theme');
    this.settingsBtn = document.getElementById('btn-settings');
    this.settingsPanel = document.getElementById('settings-panel');
    this.lensRadiusSlider = document.getElementById('lens-radius-slider');
    this.lensPowerSlider = document.getElementById('lens-power-slider');
    this.infoBtn = document.getElementById('btn-info');
    this.aboutModal = document.getElementById('about-modal');

    this.isLight = false;

    this.categoryDefinitions = [
      { id: 'all', name: '全部题材', shortName: '全部', icon: '✦' },
      { id: 'Milestones & History', name: '百年名作与里程碑', shortName: '百年名作', icon: '🏛️' },
      { id: 'Urban Life & NYC', name: '都市生活与纽约街头', shortName: '都市生活', icon: '🏙️' },
      { id: 'Satire & Politics', name: '政治与时事讽刺', shortName: '政治讽刺', icon: '⚖️' },
      { id: 'Tech & Digital', name: '科技与屏幕时代', shortName: '科技屏幕', icon: '📱' },
      { id: 'Culture & Arts', name: '文化艺术与阅读', shortName: '文化艺术', icon: '🎨' },
      { id: 'Seasons & Holidays', name: '四季更迭与节日', shortName: '四季节日', icon: '🍂' },
      { id: 'Everyday Life & Editorial', name: '当代日常与特稿', shortName: '日常特稿', icon: '☕' },
      { id: 'Historical Archive', name: '百年正刊原典档案', shortName: '正刊档案', icon: '📜' }
    ];

    this.initCategoryMenu();
    this.initArtistMenu();
    this.bindEvents();
  }

  initCategoryMenu() {
    if (!this.menuCategory) return;

    // Calculate real cover counts for each category
    const catCounts = {};
    this.archive.forEach(item => {
      const c = item.category || 'Historical Archive';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    let html = '';
    this.categoryDefinitions.forEach(cat => {
      const count = cat.id === 'all' ? this.archive.length : (catCounts[cat.id] || 0);
      const isActive = cat.id === this.activeCategory ? 'active' : '';
      html += `
        <div class="nav-dropdown-item ${isActive}" data-cat="${cat.id}">
          <div class="nav-dropdown-item-left">
            <span class="nav-dropdown-item-icon">${cat.icon}</span>
            <span class="nav-dropdown-item-title">${cat.name}</span>
          </div>
          <span class="nav-dropdown-item-count">${count.toLocaleString()}</span>
        </div>
      `;
    });

    this.menuCategory.innerHTML = html;

    this.menuCategory.querySelectorAll('.nav-dropdown-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const catId = el.getAttribute('data-cat');
        this.selectCategory(catId);
        this.closeAllDropdowns();
      });
    });
  }

  initArtistMenu() {
    if (!this.menuArtist) return;

    // Calculate real verified counts from archive
    const artistCounts = {};
    let archiveOnlyCount = 0;

    this.archive.forEach(item => {
      if (item.artist && item.artist !== 'The New Yorker 档案') {
        artistCounts[item.artist] = (artistCounts[item.artist] || 0) + 1;
      } else {
        archiveOnlyCount++;
      }
    });

    // Sort real artists descending by count
    const sortedArtists = Object.keys(artistCounts).sort((a, b) => artistCounts[b] - artistCounts[a]);

    // Build Menu with Search Bar + All Option + Authenticated Artists
    let html = `
      <div class="nav-dropdown-search-wrap">
        <input type="text" class="nav-dropdown-search-input" id="artist-search-input" placeholder="搜索画师姓名 (如 Barry, Tomine)..." autocomplete="off">
      </div>
      <div class="nav-dropdown-item ${this.activeArtist === 'all' ? 'active' : ''}" data-artist="all">
        <div class="nav-dropdown-item-left">
          <span class="nav-dropdown-item-icon">✦</span>
          <span class="nav-dropdown-item-title">全部画师</span>
        </div>
        <span class="nav-dropdown-item-count">${this.archive.length.toLocaleString()}</span>
      </div>
      <div class="nav-dropdown-divider"></div>
      <div class="artist-items-container" id="artist-items-container">
    `;

    sortedArtists.forEach(artist => {
      const count = artistCounts[artist];
      const isActive = artist === this.activeArtist ? 'active' : '';
      html += `
        <div class="nav-dropdown-item ${isActive}" data-artist="${artist}">
          <div class="nav-dropdown-item-left">
            <span class="nav-dropdown-item-icon">👨‍🎨</span>
            <span class="nav-dropdown-item-title">${artist}</span>
          </div>
          <span class="nav-dropdown-item-count">${count} 卷</span>
        </div>
      `;
    });

    if (archiveOnlyCount > 0) {
      html += `
        <div class="nav-dropdown-divider"></div>
        <div class="nav-dropdown-item ${this.activeArtist === 'The New Yorker 档案' ? 'active' : ''}" data-artist="The New Yorker 档案">
          <div class="nav-dropdown-item-left">
            <span class="nav-dropdown-item-icon">📜</span>
            <span class="nav-dropdown-item-title">The New Yorker 档案正刊 (历史原刊)</span>
          </div>
          <span class="nav-dropdown-item-count">${archiveOnlyCount.toLocaleString()} 卷</span>
        </div>
      `;
    }

    html += `</div>`;
    this.menuArtist.innerHTML = html;

    // Bind selection events
    this.bindArtistItemEvents();

    // Bind real-time search inside Artist Dropdown
    const artistSearchInput = document.getElementById('artist-search-input');
    if (artistSearchInput) {
      artistSearchInput.addEventListener('click', (e) => e.stopPropagation());
      artistSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        const items = this.menuArtist.querySelectorAll('.artist-items-container .nav-dropdown-item');
        items.forEach(item => {
          const name = (item.getAttribute('data-artist') || '').toLowerCase();
          if (!query || name.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }
  }

  bindArtistItemEvents() {
    this.menuArtist.querySelectorAll('.nav-dropdown-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const artist = el.getAttribute('data-artist');
        this.selectArtist(artist);
        this.closeAllDropdowns();
      });
    });
  }

  selectCategory(catId) {
    if (catId === 'all') {
      this.resetAllFilters();
      return;
    }

    this.activeCategory = catId;
    this.activeArtist = 'all';

    // Update active highlight in category menu
    this.menuCategory.querySelectorAll('.nav-dropdown-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-cat') === catId);
    });

    const def = this.categoryDefinitions.find(c => c.id === catId);
    const shortName = def ? def.shortName : catId;
    this.labelCategory.textContent = `题材: ${shortName}`;
    this.btnDropdownCategory.classList.add('active');

    // Reset artist UI
    this.resetArtistUI();

    // Find real matching covers
    const matches = this.archive.filter(item => item.category === catId);
    if (matches.length > 0) {
      // ONLY SHOW THESE POSTERS ON THE CANVAS
      this.renderer.setFilteredArchive(matches);

      if (this.btnFilterReset) {
        this.btnFilterReset.style.display = 'inline-flex';
        if (this.resetFilterText) {
          this.resetFilterText.textContent = `显示全部 (当前 ${matches.length} 卷)`;
        }
      }

      this.updateTimelineYear(matches[0].year);
      if (this.showToast) {
        this.showToast(`🏷️ ${shortName} (仅呈现此 ${matches.length} 卷)`);
      }
    }
  }

  selectArtist(artist) {
    if (artist === 'all') {
      this.resetAllFilters();
      return;
    }

    this.activeArtist = artist;
    this.activeCategory = 'all';

    // Update active highlight in artist menu
    this.menuArtist.querySelectorAll('.nav-dropdown-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-artist') === artist);
    });

    this.labelArtist.textContent = `画师: ${artist.length > 8 ? artist.slice(0, 8) + '…' : artist}`;
    this.btnDropdownArtist.classList.add('active');

    // Reset category UI
    this.resetCategoryUI();

    // Find real matching covers
    const matches = this.archive.filter(item => item.artist === artist);
    if (matches.length > 0) {
      // ONLY SHOW THESE POSTERS ON THE CANVAS
      this.renderer.setFilteredArchive(matches);

      if (this.btnFilterReset) {
        this.btnFilterReset.style.display = 'inline-flex';
        if (this.resetFilterText) {
          this.resetFilterText.textContent = `显示全部 (当前 ${matches.length} 卷)`;
        }
      }

      this.updateTimelineYear(matches[0].year);
      if (this.showToast) {
        this.showToast(`🎨 ${artist} (仅呈现此 ${matches.length} 卷)`);
      }
    }
  }

  resetAllFilters() {
    this.activeCategory = 'all';
    this.activeArtist = 'all';
    this.resetCategoryUI();
    this.resetArtistUI();

    if (this.btnFilterReset) {
      this.btnFilterReset.style.display = 'none';
    }

    // Restore full 3,200 grid
    this.renderer.setFilteredArchive(this.archive);
    if (this.showToast) {
      this.showToast('已恢复全部 3,200 卷封面');
    }
  }

  resetCategoryUI() {
    this.activeCategory = 'all';
    this.labelCategory.textContent = '题材';
    this.btnDropdownCategory.classList.remove('active');
    this.menuCategory.querySelectorAll('.nav-dropdown-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-cat') === 'all');
    });
  }

  resetArtistUI() {
    this.activeArtist = 'all';
    this.labelArtist.textContent = '画师';
    this.btnDropdownArtist.classList.remove('active');
    this.menuArtist.querySelectorAll('.nav-dropdown-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-artist') === 'all');
    });
  }

  closeAllDropdowns() {
    if (this.dropdownCategory) {
      this.dropdownCategory.classList.remove('open');
      this.btnDropdownCategory.setAttribute('aria-expanded', 'false');
    }
    if (this.dropdownArtist) {
      this.dropdownArtist.classList.remove('open');
      this.btnDropdownArtist.setAttribute('aria-expanded', 'false');
    }
  }

  bindEvents() {
    // 1. Dropdown Toggle: 题材
    if (this.btnDropdownCategory) {
      this.btnDropdownCategory.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dropdownCategory.classList.contains('open');
        this.closeAllDropdowns();
        if (!isOpen) {
          this.dropdownCategory.classList.add('open');
          this.btnDropdownCategory.setAttribute('aria-expanded', 'true');
        }
      });
    }

    // 2. Dropdown Toggle: 画师
    if (this.btnDropdownArtist) {
      this.btnDropdownArtist.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dropdownArtist.classList.contains('open');
        this.closeAllDropdowns();
        if (!isOpen) {
          this.dropdownArtist.classList.add('open');
          this.btnDropdownArtist.setAttribute('aria-expanded', 'true');
          const input = document.getElementById('artist-search-input');
          if (input) setTimeout(() => input.focus(), 50);
        }
      });
    }

    // 3. Reset Filter Button (Pill)
    if (this.btnFilterReset) {
      this.btnFilterReset.addEventListener('click', () => {
        this.resetAllFilters();
      });
    }

    // Click outside to close dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        this.closeAllDropdowns();
      }
    });

    // Escape key to close dropdowns
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });

    // 4. Timeline Scrubber
    if (this.timelineSlider) {
      this.timelineSlider.addEventListener('input', (e) => {
        const year = parseInt(e.target.value, 10);
        if (this.timelineYearDisplay) this.timelineYearDisplay.textContent = year;
        const currentList = this.renderer.currentArchive || this.archive;
        const match = currentList.find(it => it.year >= year);
        if (match) {
          this.renderer.focusOnCover(match);
        }
      });
    }

    // 5. Randomizer "Surprise Me" (🎲)
    if (this.randomBtn) {
      this.randomBtn.addEventListener('click', () => {
        const currentList = this.renderer.currentArchive || this.archive;
        if (currentList.length > 0) {
          const randomItem = currentList[Math.floor(Math.random() * currentList.length)];
          this.renderer.focusOnCover(randomItem);
          if (this.timelineSlider) this.timelineSlider.value = randomItem.year;
          if (this.timelineYearDisplay) this.timelineYearDisplay.textContent = randomItem.year;
        }
      });
    }

    // 6. Dark / Warm Paper Theme Toggle
    if (this.themeBtn) {
      this.themeBtn.addEventListener('click', () => {
        this.isLight = !this.isLight;
        document.body.classList.toggle('light-theme', this.isLight);
        this.renderer.setTheme(this.isLight);
        this.themeBtn.title = this.isLight ? "切换至极夜暗黑模式" : "切换至复古暖纸模式";
      });
    }

    // 7. Settings Panel
    if (this.settingsBtn && this.settingsPanel) {
      this.settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.settingsPanel.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!this.settingsPanel.contains(e.target) && e.target !== this.settingsBtn) {
          this.settingsPanel.classList.remove('active');
        }
      });
    }

    if (this.lensRadiusSlider) {
      this.lensRadiusSlider.addEventListener('input', (e) => {
        const r = parseFloat(e.target.value);
        this.renderer.setLensParams(r, undefined);
      });
    }

    if (this.lensPowerSlider) {
      this.lensPowerSlider.addEventListener('input', (e) => {
        const p = parseFloat(e.target.value);
        this.renderer.setLensParams(undefined, p);
      });
    }

    // 8. About Modal
    if (this.infoBtn && this.aboutModal) {
      this.infoBtn.addEventListener('click', () => {
        this.aboutModal.classList.add('active');
      });

      const aboutClose = document.getElementById('about-close-btn');
      if (aboutClose) {
        aboutClose.addEventListener('click', () => {
          this.aboutModal.classList.remove('active');
        });
      }
    }
  }

  updateTimelineYear(year) {
    if (this.timelineYearDisplay && year) {
      this.timelineYearDisplay.textContent = year;
      if (document.activeElement !== this.timelineSlider && this.timelineSlider) {
        this.timelineSlider.value = year;
      }
    }
  }
}

window.FilterDock = FilterDock;
