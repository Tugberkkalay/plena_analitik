import axios from "axios";

/**
 * Axios interceptor that auto-appends ?tenant=<slug>&segment=<segment> to all API calls
 * when a tenant/segment context is active.
 */
let _currentTenant = null;
let _currentSegment = null;

export function setActiveTenant(slug) {
  _currentTenant = slug;
}

export function getActiveTenant() {
  return _currentTenant;
}

export function setActiveSegment(segment) {
  _currentSegment = segment;
}

export function getActiveSegment() {
  return _currentSegment;
}

// Add request interceptor
axios.interceptors.request.use((config) => {
  if (_currentTenant && config.url && config.url.includes("/api/")) {
    // Add tenant to URL query params
    const sep = config.url.includes("?") ? "&" : "?";
    config.url = `${config.url}${sep}tenant=${_currentTenant}`;
    // Add segment if set
    if (_currentSegment) {
      config.url = `${config.url}&segment=${encodeURIComponent(_currentSegment)}`;
    }
    // Also add to POST/PUT body if it's JSON
    if (config.method === "post" || config.method === "put") {
      if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
        config.data = { ...config.data, tenant: _currentTenant };
        if (_currentSegment) {
          config.data.segment = _currentSegment;
        }
      }
    }
  }
  return config;
});
