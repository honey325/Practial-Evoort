import { apiRequest } from "../../../shared/services/apiClient.js";

function queryString(params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== "" && value != null) query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

export const customerApi = {
  businesses: (params) => apiRequest(`/catalog/businesses${queryString(params)}`),
  business: (businessId) => apiRequest(`/catalog/businesses/${businessId}`),
  previewBooking: (details) => apiRequest("/bookings/availability", { method: "POST", body: details }),
  createBooking: (details) => apiRequest("/bookings", { method: "POST", body: details }),
  bookings: (params) => apiRequest(`/bookings/mine${queryString(params)}`),
  booking: (bookingId) => apiRequest(`/bookings/${bookingId}`),
  cancelBooking: (bookingId) => apiRequest(`/bookings/${bookingId}/cancel`, { method: "POST" }),
  rescheduleBooking: (bookingId, startAt) => apiRequest(`/bookings/${bookingId}/reschedule`, { method: "POST", body: { startAt } }),
};
