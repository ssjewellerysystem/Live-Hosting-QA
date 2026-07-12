import time
import threading

class SimpleCache:
    def __init__(self, default_timeout=300):
        self._cache = {}
        self._timeout = default_timeout
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            if key not in self._cache:
                return None
            val, expires_at = self._cache[key]
            if time.time() > expires_at:
                del self._cache[key]
                return None
            return val

    def set(self, key, value, timeout=None):
        if timeout is None:
            timeout = self._timeout
        expires_at = time.time() + timeout
        with self._lock:
            self._cache[key] = (value, expires_at)

    def delete(self, key):
        with self._lock:
            if key in self._cache:
                del self._cache[key]

    def clear(self):
        with self._lock:
            self._cache.clear()

# Global cache instances
categories_cache = SimpleCache(default_timeout=300)
banners_cache = SimpleCache(default_timeout=300)
category_attributes_cache = SimpleCache(default_timeout=3600)  # Category attributes are static, cache for 1 hr
products_cache = SimpleCache(default_timeout=300)

