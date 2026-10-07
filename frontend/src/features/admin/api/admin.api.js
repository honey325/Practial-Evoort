import { apiRequest } from "../../../shared/services/apiClient.js";

function toQuery(values = {}) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value != null) query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

export const adminApi = {
  report: (filters) => apiRequest(`/admin/reports/summary${toQuery(filters)}`),
  businesses: (filters) => apiRequest(`/admin/businesses${toQuery(filters)}`),
  business: (id) => apiRequest(`/admin/businesses/${id}`),
  updateBusinessStatus: (id, status) => apiRequest(`/admin/businesses/${id}/status`, { method: "PATCH", body: { status } }),
  deleteBusiness: (id) => apiRequest(`/admin/businesses/${id}`, { method: "DELETE" }),
  categories: () => apiRequest("/categories"),
  createCategory: (data) => apiRequest("/categories", { method: "POST", body: data }),
  updateCategory: (id, data) => apiRequest(`/categories/${id}`, { method: "PATCH", body: data }),
  deleteCategory: (id) => apiRequest(`/categories/${id}`, { method: "DELETE" }),
  plans: () => apiRequest("/subscriptions/plans"),
  createPlan: (data) => apiRequest("/subscriptions/admin/plans", { method: "POST", body: data }),
  updatePlan: (id, data) => apiRequest(`/subscriptions/admin/plans/${id}`, { method: "PATCH", body: data }),
  deletePlan: (id) => apiRequest(`/subscriptions/admin/plans/${id}`, { method: "DELETE" }),
  subscriptions: (filters) => apiRequest(`/subscriptions/admin/subscriptions${toQuery(filters)}`),
  updateSubscriptionStatus: (id, status) => apiRequest(`/subscriptions/admin/subscriptions/${id}/status`, { method: "PATCH", body: { status } }),
  users: (filters) => apiRequest(`/users${toQuery(filters)}`),
  createUser: (data) => apiRequest("/users", { method: "POST", body: data }),
  updateUser: (id, data) => apiRequest(`/users/${id}`, { method: "PATCH", body: data }),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: "DELETE" }),
};
