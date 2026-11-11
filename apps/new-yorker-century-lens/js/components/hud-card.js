// HUD Floating Info Card (with Real New Yorker Cover Image, Metadata, AI Prompt & ❤️ 喜爱收藏)
class HudCard {
  constructor(container, onCopyPrompt, onOpenModal, onToggleFavorite, isFavoriteFn) {
    this.container = container;
    this.onCopyPrompt = onCopyPrompt;
    this.onOpenModal = onOpenModal;
    this.onToggleFavorite = onToggleFavorite;
    this.isFavoriteFn = isFavoriteFn;
    this.currentCover = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="hud-card" id="hud-card">
        <div class="hud-card-body">
          <!-- Real Cover Thumbnail Preview -->
          <div class="hud-thumb-wrap" id="hud-thumb-wrap">
            <img class="hud-cover-thumb" id="hud-cover-thumb" src="" alt="The New Yorker Cover">
            <div class="hud-thumb-badge" id="hud-thumb-year">2020</div>
          </div>

          <!-- Metadata & Details -->
          <div class="hud-meta-wrap">
            <div class="hud-top-meta">
              <span class="hud-category-badge" id="hud-category-badge">Urban Life</span>
              <span class="hud-date-badge" id="hud-date-badge">May 4, 2020</span>
            </div>

            <h2 class="hud-title" id="hud-title">
              <span class="title-text" id="title-text">Bedtime</span>
            </h2>

            <div class="hud-artist-row" id="hud-artist-row">
              <span class="artist-label">Cover by</span>
              <span class="artist-name" id="hud-artist-name">Chris Ware</span>
              <a class="hud-source-link" id="hud-source-link" href="#" target="_blank" rel="noopener" title="在《纽约客》官网阅读本期">原刊 ↗</a>
            </div>

            <p class="hud-story" id="hud-story"></p>
          </div>
        </div>

        <div class="hud-actions">
          <!-- ❤️ 点喜爱 按钮 -->
          <button class="hud-btn hud-btn-like" id="btn-like-cover" title="点喜爱 (快捷键: L)">
            <svg class="heart-icon" id="hud-heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span id="hud-like-text">喜爱</span>
          </button>

          <button class="hud-btn hud-btn-primary" id="btn-copy-prompt">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>复制 AI 提示词</span>
          </button>
          
          <button class="hud-btn hud-btn-secondary" id="btn-view-details">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>原件解析</span>
          </button>
        </div>
      </div>
    `;

    // Elements
    this.elThumb = document.getElementById('hud-cover-thumb');
    this.elThumbYear = document.getElementById('hud-thumb-year');
    this.elCatBadge = document.getElementById('hud-category-badge');
    this.elDateBadge = document.getElementById('hud-date-badge');
    this.elTitleText = document.getElementById('title-text');
    this.elArtistName = document.getElementById('hud-artist-name');
    this.elSourceLink = document.getElementById('hud-source-link');
    this.elStory = document.getElementById('hud-story');

    this.btnLike = document.getElementById('btn-like-cover');
    this.heartIcon = document.getElementById('hud-heart-icon');
    this.likeText = document.getElementById('hud-like-text');

    // Like button event
    this.btnLike.addEventListener('click', () => {
      if (this.currentCover && this.onToggleFavorite) {
        const isFav = this.onToggleFavorite(this.currentCover);
        this.updateFavoriteUI(isFav);
      }
    });

    // Copy prompt event
    document.getElementById('btn-copy-prompt').addEventListener('click', () => {
      if (this.currentCover) {
        this.onCopyPrompt(this.currentCover);
      }
    });

    // View details event
    document.getElementById('btn-view-details').addEventListener('click', () => {
      if (this.currentCover) {
        this.onOpenModal(this.currentCover);
      }
    });
  }

  updateFavoriteUI(isFav) {
    if (isFav) {
      this.btnLike.classList.add('active');
      this.heartIcon.setAttribute('fill', '#ef4444');
      this.heartIcon.setAttribute('stroke', '#ef4444');
      this.likeText.textContent = '已喜爱';
    } else {
      this.btnLike.classList.remove('active');
      this.heartIcon.setAttribute('fill', 'none');
      this.heartIcon.setAttribute('stroke', 'currentColor');
      this.likeText.textContent = '喜爱';
    }
  }

  update(cover) {
    if (!cover) return;
    if (this.currentCover && this.currentCover.id === cover.id) return;
    this.currentCover = cover;

    // Flicker-free preloader for thumbnail
    if (cover.thumb) {
      const preloader = new Image();
      preloader.crossOrigin = "anonymous";
      preloader.src = cover.thumb;
      const applyThumb = () => {
        if (this.currentCover && this.currentCover.id === cover.id) {
          this.elThumb.src = cover.thumb;
          this.elThumb.alt = cover.title;
        }
      };
      if (preloader.complete && preloader.naturalWidth > 0) {
        applyThumb();
      } else {
        preloader.onload = applyThumb;
      }
    }
    this.elThumbYear.textContent = cover.year;

    // Update Favorite status
    const isFav = this.isFavoriteFn ? this.isFavoriteFn(cover.id) : false;
    this.updateFavoriteUI(isFav);

    // Update badges with localized friendly category
    const CAT_LABELS = {
      'Milestones & History': '百年名作',
      'Urban Life & NYC': '都市生活',
      'Satire & Politics': '政治讽刺',
      'Tech & Digital': '科技屏幕',
      'Culture & Arts': '文化艺术',
      'Seasons & Holidays': '四季节日',
      'Everyday Life & Editorial': '日常特稿',
      'Historical Archive': '历史原典'
    };
    this.elCatBadge.textContent = CAT_LABELS[cover.category] || cover.category || "正刊";
    this.elDateBadge.textContent = cover.date || `${cover.year}`;

    // Update title
    this.elTitleText.textContent = cover.title;

    // Update artist & story
    this.elArtistName.textContent = cover.artist || "The New Yorker";
    this.elStory.textContent = cover.story || "";

    // Official newyorker.com issue link
    if (cover.src) {
      this.elSourceLink.href = cover.src;
    }
  }
}

window.HudCard = HudCard;
