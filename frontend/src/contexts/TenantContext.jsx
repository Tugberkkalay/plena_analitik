import { createContext, useContext } from "react";

const TenantContext = createContext(null);

export function TenantProvider({ slug, children }) {
  return (
    <TenantContext.Provider value={slug}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

/**
 * Build API URL with optional tenant parameter.
 */
export function buildApiUrl(path, params = {}, tenant = null) {
  const base = `${process.env.REACT_APP_BACKEND_URL}/api${path}`;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) searchParams.set(k, String(v));
  });
  if (tenant) searchParams.set("tenant", tenant);
  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Create an axios instance that auto-appends tenant query param.
 */
export function createTenantAxios(tenant) {
  const axios = require("axios").default;
  const instance = axios.create();
  instance.interceptors.request.use((config) => {
    if (tenant && config.url) {
      const sep = config.url.includes("?") ? "&" : "?";
      config.url = `${config.url}${sep}tenant=${tenant}`;
    }
    return config;
  });
  return instance;
}
