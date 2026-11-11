/* ============================================================
   App Hub · shell.js
   - 语言切换（localStorage 记忆，支持中/英）
   - 主页：从 data/works.json 渲染类别分区与卡片、类别筛选
   - 产品页：渲染统一顶部导航条与页脚（读取 window.HUB_PAGE）
   纯原生，无依赖。
   ============================================================ */
(function () {
  'use strict';

  var LANG_KEY = 'hub-lang';
  var root = document.documentElement;

  /* ---------------- 语言 ---------------- */
  function currentLang() {
    // 1) URL 参数优先（?lang=en，方便分享指定语言的链接）
    var m = /[?&]lang=(zh|en)\b/.exec(location.search);
    if (m) {
      try { localStorage.setItem(LANG_KEY, m[1]); } catch (e) { }
      return m[1];
    }
    // 2) 上次选择
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { }
    if (saved === 'zh' || saved === 'en') return saved;
    // 3) 浏览器语言
    var nav = (navigator.language || 'zh').toLowerCase();
    return nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function applyLang(lang) {
    root.setAttribute('data-lang', lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { }
    var btns = document.querySelectorAll('[data-lang-btn]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-lang-btn') === lang));
    }
    // 主页副标题：切换 title 里的语言
    var t = document.querySelector('title[data-zh]');
    if (t) {
      var zh = t.getAttribute('data-zh'), en = t.getAttribute('data-en');
      if (zh && en) t.textContent = lang === 'zh' ? zh : en;
    }
    document.dispatchEvent(new CustomEvent('hub:lang', { detail: { lang: lang } }));
  }

  function initLang() {
    var btns = document.querySelectorAll('[data-lang-btn]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        applyLang(this.getAttribute('data-lang-btn'));
      });
    }
    applyLang(currentLang());
  }

  /* ---------------- 工具 ---------------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pick(obj, base, lang) {
    return obj[base + (lang === 'en' ? 'En' : 'Zh')] || obj[base + 'Zh'] || '';
  }
  function initials(app) {
    var s = app.nameEn || app.nameZh || app.slug;
    return s.replace(/[^A-Za-z\u4e00-\u9fa5]/g, '').slice(0, 2).toUpperCase();
  }

  /* ---------------- 主页渲染 ---------------- */
  var STATUS_ORDER = { live: 0, soon: 1, lab: 2 };

  function chipsOf(w) {
    if (w.chips && w.chips.length) return w.chips.slice();
    // App 条目沿用原有的 platform 字段
    var p = w.platform;
    return p && p.length ? p.slice() : [];
  }

  /* cta 可以是单个对象，也可以是数组（一个作品挂多个链接）。
     本地文件（zip / crx / dmg / pdf）走下载，外链走新标签页。 */
  var DOWNLOAD_RE = /\.(zip|crx|dmg|pkg|pdf)$/i;

  function ctasOf(w) {
    var raw = [];
    if (w.appStoreUrl) raw.push({ url: w.appStoreUrl, zh: 'App Store', en: 'App Store' });
    if (w.cta) raw = raw.concat(w.cta);
    return raw
      .filter(function (c) { return c && c.url; })
      .map(function (c) {
        return {
          url: c.url,
          zh: c.zh || '访问',
          en: c.en || 'Open',
          download: !!c.download || DOWNLOAD_RE.test(c.url)
        };
      });
  }

  function renderHome(data) {
    var grid = document.getElementById('hub-grid-host');
    if (!grid) return;
    var works = (data.works || []).filter(function (w) { return !w.hidden; });
    var cats = data.categories || [];

    /* 顶部站名与介绍 */
    var holder = {
      name: document.querySelectorAll('[data-site-name]'),
      intro: document.querySelectorAll('[data-site-intro]'),
      note: document.querySelectorAll('[data-site-note]')
    };
    function paintStatic() {
      var L = root.getAttribute('data-lang') || 'zh';
      var i;
      for (i = 0; i < holder.name.length; i++) holder.name[i].textContent = pick(data.site, 'name', L);
      for (i = 0; i < holder.intro.length; i++) holder.intro[i].textContent = pick(data.site, 'intro', L);
      for (i = 0; i < holder.note.length; i++) holder.note[i].textContent = pick(data.site, 'footerNote', L);
    }
    paintStatic();

    /* 统计 */
    var statHost = document.getElementById('hub-stats');
    function renderStats() {
      if (!statHost) return;
      var L = root.getAttribute('data-lang') || 'zh';
      var live = works.filter(function (w) { return w.status === 'live'; }).length;
      var used = cats.filter(function (c) {
        return works.some(function (w) { return w.category === c.id; });
      }).length;
      var stats = [
        { n: works.length, zh: '件作品', en: 'works' },
        { n: live, zh: '件已发布', en: 'released' },
        { n: used, zh: '个类别', en: 'categories' }
      ];
      statHost.innerHTML = '';
      stats.forEach(function (s) {
        var d = el('div', 'stat');
        d.appendChild(el('b', null, String(s.n)));
        d.appendChild(el('span', 'stat-label', L === 'zh' ? s.zh : s.en));
        d.setAttribute('data-zh', s.zh);
        d.setAttribute('data-en', s.en);
        statHost.appendChild(d);
      });
    }
    function paintStats() {
      if (!statHost) return;
      var L = root.getAttribute('data-lang') || 'zh';
      var items = statHost.querySelectorAll('.stat-label');
      for (var i = 0; i < items.length; i++) {
        items[i].textContent = items[i].parentNode.getAttribute('data-' + L) || '';
      }
    }

    /* 类别筛选按钮 */
    var filterHost = document.getElementById('hub-filters');
    var catFilter = 'all';
    if (filterHost) {
      filterHost.innerHTML = '';
      var all = el('button', null, '');
      all.type = 'button';
      all.setAttribute('data-cat', 'all');
      all.setAttribute('aria-pressed', 'true');
      all.setAttribute('data-zh', '全部');
      all.setAttribute('data-en', 'All');
      filterHost.appendChild(all);
      cats.forEach(function (c) {
        var b = el('button', null, '');
        b.type = 'button';
        b.setAttribute('data-cat', c.id);
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('data-zh', c.zh);
        b.setAttribute('data-en', c.en);
        filterHost.appendChild(b);
      });
      var fbtns = filterHost.querySelectorAll('button');
      for (var k = 0; k < fbtns.length; k++) {
        fbtns[k].addEventListener('click', function () {
          catFilter = this.getAttribute('data-cat');
          for (var m = 0; m < fbtns.length; m++) {
            fbtns[m].setAttribute('aria-pressed', String(fbtns[m] === this));
          }
          paintCards();
        });
      }
      paintFilters();
    }

    function paintFilters() {
      if (!filterHost) return;
      var L = root.getAttribute('data-lang') || 'zh';
      var fbs = filterHost.querySelectorAll('[data-zh]');
      for (var i = 0; i < fbs.length; i++) {
        fbs[i].textContent = fbs[i].getAttribute('data-' + L) || fbs[i].textContent;
      }
    }

    /* 单张卡片 */
    function buildCard(w, L) {
      var card = el('article', 'card ' + (w.status || 'lab'));
      card.style.setProperty('--accent', w.accent || '#8a8577');
      card.setAttribute('data-category', w.category);

      if (w.status !== 'live') {
        var pill = el('span', 'pill-soon');
        pill.setAttribute('data-zh', w.status === 'soon' ? '即将发布' : '开发中');
        pill.setAttribute('data-en', w.status === 'soon' ? 'Almost' : 'In progress');
        card.appendChild(pill);
      }

      /* 封面（影像 / 有图的站点）优先，其次图标，最后首字母 */
      if (w.cover) {
        var cov = el('div', 'card-cover');
        var ci = el('img');
        ci.src = w.cover;
        ci.alt = pick(w, 'name', L);
        ci.loading = 'lazy';
        cov.appendChild(ci);
        if (w.meta) cov.appendChild(el('span', 'cover-meta', w.meta));
        card.appendChild(cov);
      }

      var top = el('div', 'card-top');
      if (w.icon) {
        var img = el('img', 'card-icon');
        img.src = w.icon;
        img.alt = pick(w, 'name', L);
        img.loading = 'lazy';
        top.appendChild(img);
      } else if (!w.cover) {
        var mono = el('div', 'card-icon mono', initials(w));
        mono.style.background = w.accent || '#8a8577';
        top.appendChild(mono);
      } else {
        top.className = 'card-top bare';
      }
      var titles = el('div', 'card-titles');
      titles.appendChild(el('h3', null, pick(w, 'name', L)));
      if (w.nameEn && w.nameEn !== (L === 'zh' ? w.nameZh : w.nameEn)) {
        titles.appendChild(el('div', 'en', w.nameEn));
      }
      top.appendChild(titles);
      card.appendChild(top);

      card.appendChild(el('p', 'tagline', pick(w, 'tagline', L)));

      var meta = el('div', 'card-meta');
      if (w.status === 'live') {
        var lc = el('span', 'chip live');
        lc.setAttribute('data-zh', w.category === 'skill' ? '可用' : '已发布');
        lc.setAttribute('data-en', w.category === 'skill' ? 'Ready' : 'Released');
        meta.appendChild(lc);
      }
      chipsOf(w).forEach(function (p) { meta.appendChild(el('span', 'chip', p)); });
      if (w.meta && !w.cover) meta.appendChild(el('span', 'chip chip-dim', w.meta));
      if (meta.childNodes.length) card.appendChild(meta);

      var ctas = ctasOf(w);
      if (ctas.length || w.page) {
        var actions = el('div', 'card-actions');
        if (w.page) {
          var more = el('a', 'btn btn-ghost');
          more.href = w.page;
          if (/^https?:\/\//i.test(w.page)) {
            more.target = '_blank';
            more.rel = 'noopener';
          }
          more.setAttribute('data-zh', '了解详情');
          more.setAttribute('data-en', 'Learn more');
          actions.appendChild(more);
        }
        ctas.forEach(function (c, i) {
          var btn = el('a', i === 0 ? 'btn btn-solid push' : 'btn btn-ghost');
          btn.href = c.url;
          if (c.download) {
            btn.setAttribute('download', '');
          } else {
            btn.target = '_blank';
            btn.rel = 'noopener';
          }
          btn.setAttribute('data-zh', c.zh);
          btn.setAttribute('data-en', c.en);
          actions.appendChild(btn);
        });
        card.appendChild(actions);
      }
      return card;
    }

    /* 按类别分区渲染 */
    function paintCards() {
      var L = root.getAttribute('data-lang') || 'zh';
      grid.innerHTML = '';
      cats.forEach(function (cat) {
        if (catFilter !== 'all' && catFilter !== cat.id) return;
        var items = works.filter(function (w) { return w.category === cat.id; });
        /* 排序：先看手写的 order（1 起，想怎么排就怎么排），没有 order 的按状态排、
           同状态保持 works.json 里的先后。sort 是稳定的，别换成自己写的快排。 */
        items.sort(function (a, b) {
          var oa = a.order == null ? Infinity : a.order;
          var ob = b.order == null ? Infinity : b.order;
          if (oa !== ob) return oa - ob;
          var ra = STATUS_ORDER[a.status];
          var rb = STATUS_ORDER[b.status];
          return (ra == null ? 9 : ra) - (rb == null ? 9 : rb);
        });

        var sec = el('section', 'hub-group');
        sec.setAttribute('data-group', cat.id);

        var head = el('div', 'hub-group-head');
        head.appendChild(el('span', 'emoji', cat.emoji || '·'));
        head.appendChild(el('h2', null, L === 'en' ? cat.en : cat.zh));
        var hint = el('span', 'hint', L === 'en' ? (cat.hintEn || '') : (cat.hintZh || ''));
        head.appendChild(hint);
        head.appendChild(el('span', 'count', String(items.length)));
        sec.appendChild(head);

        if (!items.length) {
          var empty = el('div', 'hub-group-empty');
          empty.setAttribute('data-zh', cat.emptyZh || '这一类还没放内容。');
          empty.setAttribute('data-en', cat.emptyEn || 'Nothing here yet.');
          empty.textContent = L === 'en' ? (cat.emptyEn || 'Nothing here yet.') : (cat.emptyZh || '这一类还没放内容。');
          sec.appendChild(empty);
        } else {
          var wrap = el('div', 'hub-grid');
          items.forEach(function (w) { wrap.appendChild(buildCard(w, L)); });
          sec.appendChild(wrap);
        }
        grid.appendChild(sec);
      });

      /* 同步 data-zh / data-en */
      var nodes = grid.querySelectorAll('[data-zh]');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].textContent = nodes[i].getAttribute('data-' + L) || nodes[i].textContent;
      }
    }

    renderStats();
    paintCards();

    document.addEventListener('hub:lang', function () {
      paintStatic(); paintStats(); paintFilters(); paintCards();
    });
  }

  /* ---------------- 产品页统一外壳 ---------------- */
  function renderProductShell(cfg) {
    var barHost = document.getElementById('hub-bar');
    var footHost = document.getElementById('hub-foot');
    var depth = cfg.depth == null ? '../../' : cfg.depth; // 相对站点根

    if (barHost) {
      barHost.className = 'hub-bar';
      var inner = el('div', 'hub-bar-inner');
      var home = el('a', 'hub-home');
      home.href = depth + 'index.html';
      home.innerHTML = '&#8592;&nbsp;';
      home.appendChild(document.createTextNode('全部应用'));
      inner.appendChild(home);

      var now = el('span', 'hub-bar-now');
      now.setAttribute('data-zh', cfg.nameZh || cfg.slug);
      now.setAttribute('data-en', cfg.nameEn || cfg.slug);
      inner.appendChild(now);

      inner.appendChild(el('span', 'hub-bar-spacer'));

      var links = el('div', 'hub-bar-links');
      // 已上架：顶栏直接给下载入口（各产品页共用，由 works.json 驱动）
      if (cfg.storeUrl) {
        var dl = el('a', 'hub-bar-store');
        dl.href = cfg.storeUrl;
        dl.target = '_blank';
        dl.rel = 'noopener';
        dl.setAttribute('data-zh', 'App Store 下载');
        dl.setAttribute('data-en', 'Download');
        links.appendChild(dl);
      }
      (cfg.links || []).forEach(function (l) {
        var a = el('a', null);
        a.href = l.href;
        a.setAttribute('data-zh', l.zh);
        a.setAttribute('data-en', l.en || l.zh);
        links.appendChild(a);
      });
      var seg = el('div', 'hub-seg');
      ['zh', 'en'].forEach(function (code) {
        var b = el('button', null, code === 'zh' ? '中' : 'EN');
        b.type = 'button';
        b.setAttribute('data-lang-btn', code);
        seg.appendChild(b);
      });
      links.appendChild(seg);
      inner.appendChild(links);

      barHost.innerHTML = '';
      barHost.appendChild(inner);
      document.body.insertBefore(barHost, document.body.firstChild);
    }

    if (footHost) {
      footHost.className = 'hub-foot';
      var fi = el('div', 'hub-foot-inner');
      var left = el('div');
      var a1 = el('a', null);
      a1.href = depth + 'index.html';
      a1.setAttribute('data-zh', '← 回到全部应用');
      a1.setAttribute('data-en', '← All apps');
      left.appendChild(a1);
      fi.appendChild(left);
      var right = el('div');
      right.setAttribute('data-zh', '所有应用的数据默认留在你的设备上。');
      right.setAttribute('data-en', 'Your data stays on your device by default.');
      fi.appendChild(right);
      footHost.innerHTML = '';
      footHost.appendChild(fi);
    }

    paintShellText();
    document.addEventListener('hub:lang', paintShellText);
  }

  function paintShellText() {
    var L = root.getAttribute('data-lang') || 'zh';
    var nodes = document.querySelectorAll('.hub-bar [data-zh], .hub-foot [data-zh]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = nodes[i].getAttribute('data-' + L) || nodes[i].textContent;
    }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    initLang();

    var page = window.HUB_PAGE;
    if (page && (document.getElementById('hub-bar') || document.getElementById('hub-foot'))) {
      renderProductShell(page);
    }

    var host = document.getElementById('hub-grid-host');
    if (host) {
      var src = host.getAttribute('data-src') || 'data/works.json';
      fetch(src, { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          window.__HUB_DATA = d;
          renderHome(d);
        })
        .catch(function (err) {
          host.innerHTML = '<p style="color:#a8a29a;font-size:14px">作品数据加载失败：' + err.message + '<br>请通过本地 http 服务打开（file:// 会被浏览器拦截）。</p>';
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
