// Prompt & Real Cover Archive Detail Modal with ❤️ Favorite Support
class PromptModal {
  constructor(onToggleFavorite, isFavoriteFn) {
    this.onToggleFavorite = onToggleFavorite;
    this.isFavoriteFn = isFavoriteFn;

    this.modal = document.getElementById('prompt-modal');
    this.backdrop = document.getElementById('modal-backdrop');
    this.closeBtn = document.getElementById('modal-close-btn');

    this.coverImg = document.getElementById('modal-cover-img');
    this.officialLink = document.getElementById('modal-official-link');
    this.titleEl = document.getElementById('modal-title');
    this.dateEl = document.getElementById('modal-date');
    this.artistEl = document.getElementById('modal-artist');
    this.categoryEl = document.getElementById('modal-category');
    this.storyEl = document.getElementById('modal-story');
    this.promptTextEl = document.getElementById('modal-prompt-text');
    this.copyBtn = document.getElementById('modal-copy-btn');

    this.likeBtn = document.getElementById('modal-like-btn');
    this.heartIcon = document.getElementById('modal-heart-icon');
    this.likeText = document.getElementById('modal-like-text');

    this.bindEvents();
  }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.backdrop.addEventListener('click', () => this.hide());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });

    if (this.likeBtn) {
      this.likeBtn.addEventListener('click', () => {
        if (this.currentCover && this.onToggleFavorite) {
          const isFav = this.onToggleFavorite(this.currentCover);
          this.updateFavoriteUI(isFav);
        }
      });
    }

    this.copyBtn.addEventListener('click', () => {
      if (this.currentCover) {
        navigator.clipboard.writeText(this.currentCover.prompt).then(() => {
          this.copyBtn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>已成功复制 Prompt！</span>
          `;
          setTimeout(() => {
            this.copyBtn.innerHTML = `
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>一键复制 AI 提示词</span>
            `;
          }, 2000);
        });
      }
    });
  }

  updateFavoriteUI(isFav) {
    if (!this.likeBtn) return;
    if (isFav) {
      this.likeBtn.classList.add('active');
      this.heartIcon.setAttribute('fill', '#ef4444');
      this.heartIcon.setAttribute('stroke', '#ef4444');
      this.likeText.textContent = '已喜爱';
    } else {
      this.likeBtn.classList.remove('active');
      this.heartIcon.setAttribute('fill', 'none');
      this.heartIcon.setAttribute('stroke', 'currentColor');
      this.likeText.textContent = '喜爱';
    }
  }

  show(cover) {
    this.currentCover = cover;
    this.titleEl.textContent = cover.title;
    this.dateEl.textContent = cover.date;
    this.artistEl.textContent = cover.artist === 'The New Yorker 档案' 
      ? 'The New Yorker 历史正刊档案 (Condé Nast Collection)' 
      : `Cover illustrated by ${cover.artist}`;
    
    const CAT_LABELS = {
      'Milestones & History': '百年名作与里程碑',
      'Urban Life & NYC': '都市生活与纽约街头',
      'Satire & Politics': '政治与时事讽刺',
      'Tech & Digital': '科技与屏幕时代',
      'Culture & Arts': '文化艺术与阅读',
      'Seasons & Holidays': '四季更迭与节日',
      'Everyday Life & Editorial': '当代日常与特稿',
      'Historical Archive': '百年正刊原典档案'
    };
    this.categoryEl.textContent = CAT_LABELS[cover.category] || cover.category;
    this.storyEl.textContent = cover.story;
    this.promptTextEl.textContent = cover.prompt;

    const isFav = this.isFavoriteFn ? this.isFavoriteFn(cover.id) : false;
    this.updateFavoriteUI(isFav);

    if (cover.full) {
      this.coverImg.src = cover.full;
      this.coverImg.alt = cover.title;
    } else if (cover.thumb) {
      this.coverImg.src = cover.thumb;
    }

    if (cover.src) {
      this.officialLink.href = cover.src;
    }

    this.modal.classList.add('active');
    this.backdrop.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
    this.backdrop.classList.remove('active');
  }
}

window.PromptModal = PromptModal;
