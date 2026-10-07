import { apiRequest } from "../../../shared/services/apiClient.js";

function toQuery(values = {}) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value != null) query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

export const staffApi = {
  availability: () => apiRequest("/staff/availability"),
  replaceAvailability: (hours) => apiRequest("/staff/availability", { method: "PUT", body: { hours } }),
  appointments: (filters) => apiRequest(`/staff/bookings/mine${toQuery(filters)}`),
  updateAppointmentStatus: (bookingId, status) => apiRequest(`/staff/bookings/${bookingId}/status`, { method: "PATCH", body: { status } }),
};
