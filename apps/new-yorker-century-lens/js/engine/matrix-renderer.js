// High-performance, Zero-Flicker Matrix Renderer for 3,200+ Real New Yorker Covers
// Features Click-to-Lock, Anti-Drift Inertia, 60 FPS Hardware Blitting & Debounced HUD
class MatrixRenderer {
  constructor(canvas, archive, onFocusChange, onLockChange, isFavoriteFn) {
    this.canvas = canvas;
    this.archive = archive;
    this.onFocusChange = onFocusChange;
    this.onLockChange = onLockChange;
    this.isFavoriteFn = isFavoriteFn;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    // Grid layout dimensions
    this.cellW = 86;
    this.cellH = 118; // 3:4 aspect ratio
    this.gapX = 14;
    this.gapY = 14;
    this.pitchX = this.cellW + this.gapX;
    this.pitchY = this.cellH + this.gapY;
    
    // Dynamic grid configuration (supports full 80x40 and filtered subgrids)
    this.gridCols = 80;
    this.gridRows = 40;
    this.totalGridWidth = this.gridCols * this.pitchX;
    this.totalGridHeight = this.gridRows * this.pitchY;
    this.currentArchive = archive;
    this.isFiltered = false;
    this.buildGrid(this.archive);

    // Camera state
    this.camera = [0, 0];
    this.targetCamera = [0, 0];
    this.zoom = 1.0;
    this.targetZoom = 1.0;

    // Fisheye Lens parameters (1:1 with nothing-to-watch.port80.ch)
    this.mouse = [window.innerWidth * 0.5, window.innerHeight * 0.5];
    this.targetMouse = [window.innerWidth * 0.5, window.innerHeight * 0.5];
    this.lensRadius = 260.0;
    this.maxScale = 3.6;
    this.theme = 0.0; // 0 = dark, 1 = warm paper

    // High-capacity, non-thrashing Image Cache
    this.imageCache = new Map();
    this.loadingUrls = new Set();
    this.maxCachedImages = 2000;

    // Interaction & drag state (Anti-drift)
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastPointer = [0, 0];
    this.dragVelocity = [0, 0];
    this.lastMoveTime = 0;

    // Click-to-Lock / Pinning mechanism
    this.isLocked = false;
    this.lockedCover = null;
    this.lockedCol = -1;
    this.lockedRow = -1;

    // Focused item tracking with hysteresis
    this.currentFocusedId = null;
    this.lastFocusUpdateTime = 0;

    this.bindEvents();
    this.resize();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildGrid(items) {
    this.currentArchive = items;
    this.isFiltered = items.length < this.archive.length;

    if (!this.isFiltered) {
      this.gridCols = 80;
      this.gridRows = 40;
      this.totalGridWidth = this.gridCols * this.pitchX;
      this.totalGridHeight = this.gridRows * this.pitchY;
      this.gridItems = new Array(this.gridCols * this.gridRows);
      for (let i = 0; i < this.archive.length; i++) {
        const it = this.archive[i];
        delete it.displayCol;
        delete it.displayRow;
        this.gridItems[it.col * this.gridRows + it.row] = it;
      }
    } else {
      const N = items.length;
      let cols = 8;
      if (N <= 1) cols = 1;
      else if (N <= 4) cols = N;
      else if (N <= 8) cols = 4;
      else if (N <= 15) cols = 5;
      else if (N <= 24) cols = 6;
      else if (N <= 45) cols = 8;
      else if (N <= 80) cols = 10;
      else if (N <= 150) cols = 14;
      else if (N <= 300) cols = 18;
      else if (N <= 600) cols = 24;
      else cols = 32;

      const rows = Math.ceil(N / cols);
      this.gridCols = cols;
      this.gridRows = rows;
      this.totalGridWidth = cols * this.pitchX;
      this.totalGridHeight = rows * this.pitchY;

      this.gridItems = new Array(cols * rows);
      for (let i = 0; i < N; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const it = items[i];
        it.displayCol = c;
        it.displayRow = r;
        this.gridItems[c * rows + r] = it;
      }
    }
  }

  setFilteredArchive(items) {
    this.unlock();
    const list = (items && items.length > 0) ? items : this.archive;
    this.buildGrid(list);

    // Reset camera to center smoothly
    this.camera = [0, 0];
    this.targetCamera = [0, 0];
    this.dragVelocity = [0, 0];

    if (this.isFiltered) {
      const N = list.length;
      this.targetZoom = N <= 3 ? 1.3 : (N <= 12 ? 1.15 : (N <= 30 ? 1.08 : 1.0));
      this.zoom = this.targetZoom;
    } else {
      this.targetZoom = 1.0;
    }

    if (list.length > 0 && this.onFocusChange) {
      this.currentFocusedId = list[0].id;
      this.onFocusChange(list[0]);
    }
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      // Only track mouse position if NOT locked
      if (!this.isLocked) {
        this.targetMouse = [e.clientX, e.clientY];
      }

      if (this.isDragging) {
        const dx = e.clientX - this.lastPointer[0];
        const dy = e.clientY - this.lastPointer[1];
        this.targetCamera[0] -= dx / this.zoom;
        this.targetCamera[1] -= dy / this.zoom;
        this.dragVelocity = [-dx / this.zoom, -dy / this.zoom];
        this.lastPointer = [e.clientX, e.clientY];
        this.lastMoveTime = performance.now();
      }
    });

    // Pointer down
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.lastPointer = [e.clientX, e.clientY];
      this.dragVelocity = [0, 0];
      this.lastMoveTime = performance.now();
    });

    // Pointer up & Click-to-Lock detection
    window.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        
        // Anti-drift: If pointer stopped before releasing, clear velocity immediately
        if (performance.now() - this.lastMoveTime > 60) {
          this.dragVelocity = [0, 0];
        }

        // Check if this was a click (moved < 6 pixels)
        const moveDist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
        if (moveDist < 6) {
          this.handleClick(e.clientX, e.clientY);
        }
      }
    });

    // Spacebar to toggle Lock / Freeze
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        this.toggleLock();
      } else if (e.key === 'Escape' && this.isLocked) {
        this.unlock();
      }
    });

    // Wheel zoom & pan
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Any wheel action breaks inertia drift immediately
      this.dragVelocity = [0, 0];
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.002;
        this.targetZoom = Math.min(Math.max(this.targetZoom * (1.0 + zoomDelta), 0.35), 2.5);
      } else {
        this.targetCamera[0] += e.deltaX / this.zoom;
        this.targetCamera[1] += e.deltaY / this.zoom;
      }
    }, { passive: false });

    // Touch events for mobile/tablet
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.dragStartX = e.touches[0].clientX;
        this.dragStartY = e.touches[0].clientY;
        this.lastPointer = [this.dragStartX, this.dragStartY];
        this.dragVelocity = [0, 0];
        this.lastMoveTime = performance.now();
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const cx = e.touches[0].clientX;
        const cy = e.touches[0].clientY;
        const dx = cx - this.lastPointer[0];
        const dy = cy - this.lastPointer[1];
        this.targetCamera[0] -= dx / this.zoom;
        this.targetCamera[1] -= dy / this.zoom;
        this.dragVelocity = [-dx / this.zoom, -dy / this.zoom];
        this.lastPointer = [cx, cy];
        this.lastMoveTime = performance.now();
        if (!this.isLocked) {
          this.targetMouse = [cx, cy];
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        if (performance.now() - this.lastMoveTime > 60) {
          this.dragVelocity = [0, 0];
        }
        if (e.changedTouches.length === 1) {
          const cx = e.changedTouches[0].clientX;
          const cy = e.changedTouches[0].clientY;
          const moveDist = Math.hypot(cx - this.dragStartX, cy - this.dragStartY);
          if (moveDist < 6) {
            this.handleClick(cx, cy);
          }
        }
      }
    });
  }

  // Handle click on canvas: Lock onto clicked cover, or unlock if already locked
  handleClick(clientX, clientY) {
    if (this.isLocked) {
      // If already locked, clicking anywhere unlocks
      this.unlock();
      return;
    }

    // Find which cover was clicked
    const screenCenterX = this.width * 0.5;
    const screenCenterY = this.height * 0.5;
    const clickWorldX = (clientX - screenCenterX) / this.zoom + this.camera[0];
    const clickWorldY = (clientY - screenCenterY) / this.zoom + this.camera[1];

    const gridStartX = -this.totalGridWidth * 0.5;
    const gridStartY = -this.totalGridHeight * 0.5;

    const col = Math.floor((clickWorldX - gridStartX) / this.pitchX);
    const row = Math.floor((clickWorldY - gridStartY) / this.pitchY);

    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
      const index = col * this.gridRows + row;
      const clickedCover = this.gridItems ? this.gridItems[index] : this.archive[index];
      if (clickedCover) {
        this.lockOn(clickedCover);
      }
    }
  }

  // Lock and freeze onto a specific cover
  lockOn(cover) {
    this.isLocked = true;
    this.lockedCover = cover;
    const c = cover.displayCol !== undefined ? cover.displayCol : cover.col;
    const r = cover.displayRow !== undefined ? cover.displayRow : cover.row;
    this.lockedCol = c;
    this.lockedRow = r;

    // Immediately halt all drifting
    this.dragVelocity = [0, 0];

    // Smoothly center camera and lens on this cover
    const gridStartX = -this.totalGridWidth * 0.5;
    const gridStartY = -this.totalGridHeight * 0.5;
    const targetX = gridStartX + (c + 0.5) * this.pitchX;
    const targetY = gridStartY + (r + 0.5) * this.pitchY;

    this.targetCamera = [targetX, targetY];
    this.targetMouse = [this.width * 0.5, this.height * 0.5];

    if (this.onLockChange) {
      this.onLockChange(true, cover);
    }
    this.onFocusChange(cover);
  }

  // Unlock and restore free-floating lens mode
  unlock() {
    this.isLocked = false;
    this.lockedCover = null;
    this.lockedCol = -1;
    this.lockedRow = -1;
    if (this.onLockChange) {
      this.onLockChange(false, null);
    }
  }

  // Toggle lock state
  toggleLock() {
    if (this.isLocked) {
      this.unlock();
    } else {
      // Lock onto whichever cover is currently under the lens
      const currentCover = (this.currentArchive || this.archive).find(c => c.id === this.currentFocusedId);
      if (currentCover) {
        this.lockOn(currentCover);
      }
    }
  }

  // Stable Image Fetcher
  getImage(url) {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url);
    }
    if (!this.loadingUrls.has(url)) {
      this.loadingUrls.add(url);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        this.imageCache.set(url, img);
        this.loadingUrls.delete(url);
        if (this.imageCache.size > this.maxCachedImages) {
          const keys = this.imageCache.keys();
          for (let i = 0; i < 50; i++) {
            const k = keys.next().value;
            if (k) this.imageCache.delete(k);
          }
        }
      };
      img.onerror = () => {
        this.loadingUrls.delete(url);
      };
    }
    return null;
  }

  // Smoothly center the camera on a specific column and row
  focusOn(col, row) {
    // Break drift
    this.dragVelocity = [0, 0];
    const gridStartX = -this.totalGridWidth * 0.5;
    const gridStartY = -this.totalGridHeight * 0.5;
    const targetX = gridStartX + (col + 0.5) * this.pitchX;
    const targetY = gridStartY + (row + 0.5) * this.pitchY;

    this.targetCamera = [targetX, targetY];
    this.targetMouse = [this.width * 0.5, this.height * 0.5];
  }

  // Focus directly onto a specific cover object (handling displayCol / displayRow)
  focusOnCover(cover) {
    if (!cover) return;
    const c = cover.displayCol !== undefined ? cover.displayCol : cover.col;
    const r = cover.displayRow !== undefined ? cover.displayRow : cover.row;
    this.focusOn(c, r);
  }

  setTheme(isLight) {
    this.theme = isLight ? 1.0 : 0.0;
  }

  setLensParams(radius, power) {
    if (radius !== undefined) this.lensRadius = radius;
    if (power !== undefined) this.maxScale = 1.0 + power * 2.2;
  }

  animate() {
    // 1. Camera & mouse tracking
    const lerp = 0.14;
    this.camera[0] += (this.targetCamera[0] - this.camera[0]) * lerp;
    this.camera[1] += (this.targetCamera[1] - this.camera[1]) * lerp;
    this.zoom += (this.targetZoom - this.zoom) * lerp;
    this.mouse[0] += (this.targetMouse[0] - this.mouse[0]) * 0.22;
    this.mouse[1] += (this.targetMouse[1] - this.mouse[1]) * 0.22;

    // Hard snap when close to target to stop micro-jitter
    if (Math.abs(this.targetCamera[0] - this.camera[0]) < 0.2) this.camera[0] = this.targetCamera[0];
    if (Math.abs(this.targetCamera[1] - this.camera[1]) < 0.2) this.camera[1] = this.targetCamera[1];

    // Inertia damping with clean full stop
    if (!this.isDragging && !this.isLocked) {
      if (Math.abs(this.dragVelocity[0]) > 0.05 || Math.abs(this.dragVelocity[1]) > 0.05) {
        this.targetCamera[0] += this.dragVelocity[0];
        this.targetCamera[1] += this.dragVelocity[1];
        this.dragVelocity[0] *= 0.82; // Faster friction decay so it comes to a definitive stop
        this.dragVelocity[1] *= 0.82;
      } else {
        this.dragVelocity[0] = 0;
        this.dragVelocity[1] = 0;
      }
    }

    // 2. Setup Canvas Context Transform cleanly
    const ctx = this.ctx;
    const dpr = this.dpr;
    const w = this.width;
    const h = this.height;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear background
    ctx.fillStyle = this.theme === 1.0 ? "#faf7f2" : "#070709";
    ctx.fillRect(0, 0, w, h);

    const screenCenterX = w * 0.5;
    const screenCenterY = h * 0.5;
    const gridStartX = -this.totalGridWidth * 0.5;
    const gridStartY = -this.totalGridHeight * 0.5;

    // Compute visible cell bounds
    const margin = this.lensRadius + 160;
    const leftWorld = (-screenCenterX - margin) / this.zoom + this.camera[0];
    const rightWorld = (screenCenterX + margin) / this.zoom + this.camera[0];
    const topWorld = (-screenCenterY - margin) / this.zoom + this.camera[1];
    const bottomWorld = (screenCenterY + margin) / this.zoom + this.camera[1];

    const minCol = Math.max(0, Math.floor((leftWorld - gridStartX) / this.pitchX));
    const maxCol = Math.min(this.gridCols - 1, Math.ceil((rightWorld - gridStartX) / this.pitchX));
    const minRow = Math.max(0, Math.floor((topWorld - gridStartY) / this.pitchY));
    const maxRow = Math.min(this.gridRows - 1, Math.ceil((bottomWorld - gridStartY) / this.pitchY));

    let closestDistToLens = Infinity;
    let closestItem = null;

    const backgroundItems = [];
    const lensItems = [];

    // Calculate positions and fisheye spherical displacement
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const index = c * this.gridRows + r;
        const item = this.gridItems ? this.gridItems[index] : this.archive[index];
        if (!item) continue;

        const wx = gridStartX + (c + 0.5) * this.pitchX;
        const wy = gridStartY + (r + 0.5) * this.pitchY;

        const sx = screenCenterX + (wx - this.camera[0]) * this.zoom;
        const sy = screenCenterY + (wy - this.camera[1]) * this.zoom;

        const dx = sx - this.mouse[0];
        const dy = sy - this.mouse[1];
        const dist = Math.hypot(dx, dy);

        if (dist < closestDistToLens) {
          closestDistToLens = dist;
          closestItem = item;
        }

        let renderX = sx;
        let renderY = sy;
        let scale = 1.0;
        let inLens = false;

        if (dist < this.lensRadius) {
          inLens = true;
          const normDist = dist / this.lensRadius;
          const bulge = Math.cos(normDist * Math.PI * 0.5);
          scale = 1.0 + (this.maxScale - 1.0) * (bulge * bulge);

          const pushFactor = (1.0 - normDist) * 0.32;
          const angle = Math.atan2(dy, dx);
          renderX = this.mouse[0] + Math.cos(angle) * (dist * (1.0 + pushFactor));
          renderY = this.mouse[1] + Math.sin(angle) * (dist * (1.0 + pushFactor));
        }

        const drawW = this.cellW * this.zoom * scale;
        const drawH = this.cellH * this.zoom * scale;

        const renderObj = {
          item,
          x: renderX - drawW * 0.5,
          y: renderY - drawH * 0.5,
          w: drawW,
          h: drawH,
          scale,
          inLens,
          c,
          r
        };

        if (inLens) {
          lensItems.push(renderObj);
        } else {
          backgroundItems.push(renderObj);
        }
      }
    }

    // Sort lens items so magnified center is on top
    lensItems.sort((a, b) => a.scale - b.scale);

    // Draw non-lens background items first
    for (let i = 0; i < backgroundItems.length; i++) {
      this.drawCard(ctx, backgroundItems[i]);
    }

    // Draw magnified lens items on top
    for (let i = 0; i < lensItems.length; i++) {
      this.drawCard(ctx, lensItems[i]);
    }

    // 3. Render 3D Lens Optical Glass Rim & Specular Ring
    const mx = this.mouse[0];
    const my = this.mouse[1];
    const r = this.lensRadius;

    ctx.save();
    if (this.isLocked) {
      // Glowing Gold Ring when LOCKED
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
      ctx.lineWidth = 6.0;
      ctx.beginPath();
      ctx.arc(mx, my, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Normal subtle glass rim
      ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(mx, my, r + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Update HUD focused cover (if not locked, track closest; if locked, keep lockedCover)
    const activeItem = this.isLocked ? this.lockedCover : closestItem;
    const now = performance.now();
    if (activeItem && (activeItem.id !== this.currentFocusedId || now - this.lastFocusUpdateTime > 60)) {
      if (activeItem.id !== this.currentFocusedId) {
        this.currentFocusedId = activeItem.id;
        this.lastFocusUpdateTime = now;
        this.onFocusChange(activeItem);
      }
    }

    requestAnimationFrame(this.animate);
  }

  // Draw single card
  drawCard(ctx, obj) {
    const { item, x, y, w, h, inLens } = obj;

    // Solid base card
    ctx.fillStyle = this.theme === 1.0 ? "#e7e2d8" : "#121216";
    ctx.fillRect(x, y, w, h);

    // Draw real cover image
    const img = this.getImage(item.thumb);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, w, h);
    } else {
      if (w > 36) {
        ctx.fillStyle = this.theme === 1.0 ? "#78716c" : "#64748b";
        ctx.font = `600 ${Math.max(9, Math.round(w * 0.14))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(item.year, x + w * 0.5, y + h * 0.52);
      }
    }

    // Border
    const isThisLocked = this.isLocked && this.lockedCover && this.lockedCover.id === item.id;
    if (isThisLocked) {
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = inLens ? "rgba(234, 179, 8, 0.6)" : (this.theme === 1.0 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.08)");
      ctx.lineWidth = inLens ? 1.5 : 0.8;
    }
    ctx.strokeRect(x, y, w, h);
  }
}

window.MatrixRenderer = MatrixRenderer;
