import axios from "axios";

/**
 * Axios interceptor that auto-appends ?tenant=<slug> to all API calls
 * when a tenant context is active.
 */
let _currentTenant = null;

export function setActiveTenant(slug) {
  _currentTenant = slug;
}

export function getActiveTenant() {
  return _currentTenant;
}

// Add request interceptor
axios.interceptors.request.use((config) => {
  if (_currentTenant && config.url && config.url.includes("/api/")) {
    // Add tenant to URL query params
    const sep = config.url.includes("?") ? "&" : "?";
    config.url = `${config.url}${sep}tenant=${_currentTenant}`;
    // Also add to POST/PUT body if it's JSON
    if (config.method === "post" || config.method === "put") {
      if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
        config.data = { ...config.data, tenant: _currentTenant };
      }
    }
  }
  return config;
});
