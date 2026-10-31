// Persistent Local Favorites (❤️ 喜爱与收藏) Manager
class FavoritesManager {
  constructor(archive) {
    this.archive = archive;
    this.storageKey = 'tny_century_favorites';
    this.favorites = new Set();
    this.listeners = [];
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.favorites = new Set(parsed);
      } else {
        // Pre-seed with a few famous favorites if empty so user has something to explore
        this.favorites = new Set(['tny-1925-02-21', 'tny-2014-01-06', 'tny-2020-05-04']);
        this.save();
      }
    } catch (e) {
      this.favorites = new Set(['tny-1925-02-21', 'tny-2014-01-06']);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.favorites)));
    } catch (e) {}
    this.notify();
  }

  toggle(id) {
    let isNowFavorite = false;
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      isNowFavorite = false;
    } else {
      this.favorites.add(id);
      isNowFavorite = true;
    }
    this.save();
    return isNowFavorite;
  }

  has(id) {
    return this.favorites.has(id);
  }

  count() {
    return this.favorites.size;
  }

  getFavoriteItems() {
    return this.archive.filter(item => this.favorites.has(item.id));
  }

  onChange(cb) {
    this.listeners.push(cb);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.favorites));
  }
}

window.FavoritesManager = FavoritesManager;
