# Staff portal

The staff portal is available at `/staff` for authenticated `STAFF` users.

- Overview: upcoming assigned appointments and links to staff tools.
- Appointments: assigned booking list, booking/date filters, and status updates.
- Availability: weekly availability intervals saved through the staff API.

Staff requests are grouped in `api/staff.api.js`. The portal uses the shared
admin layout primitives and state components for consistent tables, loading,
empty, and error states.
