const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const ADMIN_URL = `${API_BASE_URL.replace(/\/api\/?$/, "")}/admin/`;
