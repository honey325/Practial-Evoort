import { apiRequest } from "../../../shared/services/apiClient.js";

export const authApi = {
  login: (credentials) => apiRequest("/auth/login", { method: "POST", body: credentials }),
  registerCustomer: (details) => apiRequest("/auth/register/customer", { method: "POST", body: details }),
  registerBusinessOwner: (details) => apiRequest("/auth/register/business-owner", { method: "POST", body: details }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
};
