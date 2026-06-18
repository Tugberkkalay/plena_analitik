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
    const sep = config.url.includes("?") ? "&" : "?";
    config.url = `${config.url}${sep}tenant=${_currentTenant}`;
  }
  return config;
});
