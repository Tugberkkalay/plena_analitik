import axios from "axios";

/**
 * Axios interceptor that auto-appends ?tenant=<slug>&segment=<segment> to all API calls
 * when a tenant/segment context is active.
 */
let _currentTenant = null;
let _currentSegment = null;
let _currentDepartment = null;
let _currentHrbp = null;
let _currentProject = null;
let _reportAccessToken = null;

export function setActiveTenant(slug) { _currentTenant = slug; }
export function getActiveTenant() { return _currentTenant; }
export function setActiveSegment(segment) { _currentSegment = segment; }
export function getActiveSegment() { return _currentSegment; }
export function setActiveDepartment(dept) { _currentDepartment = dept; }
export function getActiveDepartment() { return _currentDepartment; }
export function setActiveHrbp(hrbp) { _currentHrbp = hrbp; }
export function getActiveHrbp() { return _currentHrbp; }
export function setActiveProject(project) { _currentProject = project; }
export function getActiveProject() { return _currentProject; }
export function setReportAccessToken(token) { _reportAccessToken = token || null; }
export function clearReportAccessToken() { _reportAccessToken = null; }

// Add request interceptor
axios.interceptors.request.use((config) => {
  config.withCredentials = true;
  if (_reportAccessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${_reportAccessToken}`;
  }
  if (_currentTenant && config.url && config.url.includes("/api/")) {
    const sep = config.url.includes("?") ? "&" : "?";
    config.url = `${config.url}${sep}tenant=${_currentTenant}`;
    if (_currentSegment) config.url += `&segment=${encodeURIComponent(_currentSegment)}`;
    if (_currentDepartment) config.url += `&department=${encodeURIComponent(_currentDepartment)}`;
    if (_currentHrbp) config.url += `&hrbp=${encodeURIComponent(_currentHrbp)}`;
    if (_currentProject) config.url += `&project=${encodeURIComponent(_currentProject)}`;
    if (config.method === "post" || config.method === "put") {
      if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
        config.data = { ...config.data, tenant: _currentTenant };
        if (_currentSegment) config.data.segment = _currentSegment;
      }
    }
  }
  return config;
});
