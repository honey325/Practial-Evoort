import { apiRequest } from "../../../shared/services/apiClient.js";

function toQuery(values = {}) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value != null) query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

const businessPath = (businessId, path = "") => `/businesses/${businessId}${path}`;

export const businessOwnerApi = {
  myBusinesses: () => apiRequest("/businesses/mine"),
  createBusiness: (data) => apiRequest("/businesses", { method: "POST", body: data }),
  getBusiness: (id) => apiRequest(businessPath(id)),
  updateBusiness: (id, data) => apiRequest(businessPath(id), { method: "PATCH", body: data }),
  categories: () => apiRequest("/categories"),
  services: (id) => apiRequest(businessPath(id, "/services")),
  createService: (id, data) => apiRequest(businessPath(id, "/services"), { method: "POST", body: data }),
  updateService: (id, serviceId, data) => apiRequest(businessPath(id, `/services/${serviceId}`), { method: "PATCH", body: data }),
  deleteService: (id, serviceId) => apiRequest(businessPath(id, `/services/${serviceId}`), { method: "DELETE" }),
  staff: (id) => apiRequest(businessPath(id, "/staff")),
  createStaff: (id, data) => apiRequest(businessPath(id, "/staff"), { method: "POST", body: data }),
  updateStaff: (id, staffId, data) => apiRequest(businessPath(id, `/staff/${staffId}`), { method: "PATCH", body: data }),
  deleteStaff: (id, staffId) => apiRequest(businessPath(id, `/staff/${staffId}`), { method: "DELETE" }),
  workingHours: (id) => apiRequest(businessPath(id, "/working-hours")),
  replaceWorkingHours: (id, hours) => apiRequest(businessPath(id, "/working-hours"), { method: "PUT", body: { hours } }),
  holidays: (id) => apiRequest(businessPath(id, "/holidays")),
  createHoliday: (id, data) => apiRequest(businessPath(id, "/holidays"), { method: "POST", body: data }),
  deleteHoliday: (id, holidayId) => apiRequest(businessPath(id, `/holidays/${holidayId}`), { method: "DELETE" }),
  bookings: (id, filters) => apiRequest(businessPath(id, `/bookings${toQuery(filters)}`)),
  updateBookingStatus: (id, bookingId, status) => apiRequest(businessPath(id, `/bookings/${bookingId}/status`), { method: "PATCH", body: { status } }),
  pricingRules: (id) => apiRequest(businessPath(id, "/pricing-rules")),
  createPricingRule: (id, data) => apiRequest(businessPath(id, "/pricing-rules"), { method: "POST", body: data }),
  updatePricingRule: (id, ruleId, data) => apiRequest(businessPath(id, `/pricing-rules/${ruleId}`), { method: "PATCH", body: data }),
  deletePricingRule: (id, ruleId) => apiRequest(businessPath(id, `/pricing-rules/${ruleId}`), { method: "DELETE" }),
  report: (id, filters) => apiRequest(`/businesses/${id}/reports/summary${toQuery(filters)}`),
};
