# Customer portal

Authenticated customer routes are grouped under `/customer`:

- `/customer/businesses` searches the public catalog with `GET /catalog/businesses`.
- `/customer/businesses/:businessId` reads business and active services with `GET /catalog/businesses/:businessId`; multi-service booking uses `POST /bookings/availability` followed by `POST /bookings`.
- `/customer/bookings` lists history with `GET /bookings/mine`; cancellation and rescheduling use `POST /bookings/:bookingId/cancel` and `POST /bookings/:bookingId/reschedule`.

Login and customer registration continue to use the shared auth pages and API.
