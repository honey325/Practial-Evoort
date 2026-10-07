# Multi-Business Appointment Booking API

An ES module REST API for a multi-business appointment booking platform. It uses Express 5, Prisma 6, and MySQL 8. Businesses configure services, staff, hours, holidays, booking rules, subscriptions, and dynamic pricing. Customers can preview and place a multi-service booking; the booking engine validates the schedule and assigns staff automatically.

The implementation includes:

- Node.js 20+
- Express 5
- Prisma ORM 6
- MySQL
- Zod validation
- Helmet security headers
- CORS
- Rate limiting
- Pino structured logging
- Centralized error handling
- Graceful shutdown
- Prisma migrations + seed
- Docker + Docker Compose
- GitHub Actions CI

## Product flow

1. A super admin creates business categories and subscription plans.
2. A business owner registers, logs in, creates a business, and subscribes to a plan.
3. The owner configures working hours, service offerings, staff, staff-to-service assignments, staff availability, holidays, booking rules, and pricing rules.
4. Customers search public business listings, inspect available services, preview a requested time, and confirm a booking.
5. The engine verifies plan and booking limits, business hours, holidays, staff availability and leave, service capacity, booking overlaps, and pricing rules. It assigns an available staff member to each service item and saves rule explanations with the booking.
6. Customers can view history, reschedule, or cancel. Owners and assigned staff can update appointment statuses. Admins and owners can review reports.

The only plan limits supported by the current schema are `maxStaff`, `maxServices`, and `maxMonthlyBookings`. Other plan features such as maximum number of businesses are not represented by a schema field and therefore are not enforced.

## 1. Prerequisites

Install:

- Node.js 20.19+ (Node 22 LTS is recommended)
- npm
- MySQL 8+
- Git

The API requires Node.js `20.19.0` or later. Use MySQL 8.x. The supplied Docker Compose configuration uses MySQL 8.4.

## 2. Create the database

Login to MySQL:

```sql
CREATE DATABASE production_api
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

You can use MySQL Workbench, MySQL CLI, or Docker.

## 3. Install

```bash
git clone <your-repository-url>
cd express-prisma-mysql-production
npm install
```

Copy environment variables:

```bash
# Windows CMD
copy .env.example .env

# PowerShell / macOS / Linux
cp .env.example .env
```

Update `.env`:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/production_api"
```

The complete `.env.example` also contains the following settings:

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode (`development`, `test`, `production`) | `development` |
| `PORT` | HTTP listen port | `5000` |
| `HOST` | HTTP listen interface | `0.0.0.0` |
| `DATABASE_URL` | Prisma MySQL connection URL | Required |
| `JWT_SECRET` | JWT signing secret; at least 32 characters | Development-only fallback |
| `JWT_EXPIRES_IN_SECONDS` | JWT lifetime, from 60 to 86400 seconds | `3600` |
| `SEED_ADMIN_EMAIL` | Seeded super admin email | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | Seeded super admin password | `Admin@12345` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Global request rate-limit window | `900000` |
| `RATE_LIMIT_MAX` | Requests permitted per window and IP | `100` |
| `LOG_LEVEL` | Pino log level | `info` |

Use a URL-encoded password if it contains reserved URL characters. For example, `@` should be `%40`. Keep `.env` out of source control. Production startup rejects the development JWT secret; set a unique random secret before deployment. Avoid `CORS_ORIGINS="*"` when using credentials.

## 4. Generate Prisma Client

```bash
npm run prisma:generate
```

## 5. Run database migrations

To create a new migration after editing `prisma/schema.prisma` during development:

```bash
npm run db:migrate -- --name add_feature_name
```

For a fresh or existing database, apply the migrations already checked into this repository with:

```bash
npm run db:deploy
```

Then seed sample data (the command can be run again; existing plan names and user emails are skipped):

```bash
npm run db:seed
```

## 6. Start the API

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

API:

```text
http://localhost:5000
```

Check `GET /health` or `GET /` after startup. The server connects to MySQL before it begins listening. It handles `SIGINT` and `SIGTERM` by closing the HTTP server and disconnecting Prisma.

### First-run checklist

1. Confirm the API can reach MySQL using `DATABASE_URL`.
2. Confirm `npm run db:deploy` completed successfully.
3. Run `npm run db:seed` and save the sample credentials from the next section.
4. Import the Postman collection and set `baseUrl` to `http://localhost:5000`.
5. Log in as Super Admin; create a category only if the seed/database does not already contain one.
6. Log in as Business Owner and create a business using an active category.
7. Subscribe that business to the free Starter plan, then configure hours, a service, staff, staff assignment, and availability before making a booking.

The API does not automatically create a sample business, service, staff profile, or subscription. These are explicit onboarding steps. The seed is safe to rerun for the sample plans and users, but it does not reset or clean the database.

## 7. Endpoints

Import [the Postman collection](postman/appointment-booking-api.postman_collection.json) to call the registered APIs, including multi-service booking and automatic staff assignment. Set its `baseUrl` and account variables for your environment. Run the matching role login before protected requests. The login requests capture the `accessToken` cookie into role-specific variables; protected collection requests send it as `Cookie: accessToken={{roleToken}}`. Destructive examples are grouped under `Cleanup (optional; run last)`.

### Health

```http
GET /health
```

### Authentication

```http
POST /api/v1/auth/register/customer
POST /api/v1/auth/register/business-owner
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

Login accepts `{ "email": "admin@example.com", "password": "Admin@12345" }` and sets an HTTP-only JWT cookie named `accessToken`. The cookie is `Secure` in production and uses `SameSite=Strict`. Logout requires an authenticated session and clears the cookie. The API also accepts a bearer token, but the provided Postman collection consistently uses the cookie method. For browser clients on another origin, send credentials with requests and configure that exact origin in `CORS_ORIGINS`. Authentication rechecks the user's active state on each request. Role middleware denies access with HTTP `403` when the authenticated user lacks the required role.

There is no public super-admin registration endpoint. The first super admin is created by the seed command. Customer and business-owner registration accepts `name`, `email`, `password` (8 to 128 characters), and an optional phone number in international digits format. Role selection is server-controlled. A successful registration also sets the login cookie.

| Role | Access summary |
| --- | --- |
| `SUPER_ADMIN` | Manage users, categories, business status, subscription plans/subscription statuses, and the global reports summary. |
| `BUSINESS_OWNER` | Create businesses and manage owned business profiles, plans, services, staff, availability, hours, holidays, booking/pricing rules, appointments, and reports. |
| `STAFF` | Manage own weekly availability, view assigned appointments, and update assigned appointment statuses. |
| `CUSTOMER` | Search public businesses, preview and create bookings, view own history, and cancel/reschedule within business rules. |

Seeded sample accounts:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@example.com` | `Admin@12345` |
| Business Owner | `owner@example.com` | `Owner@12345` |
| Staff | `staff@example.com` | `Staff@12345` |
| Customer | `customer@example.com` | `Customer@12345` |

The sample owner and staff accounts are users only: the seed does not create a business for the owner or a `StaffProfile` for the sample staff account. Create a business for the owner and add staff through the owner's staff API before testing staff profile or booking routes. Change seeded credentials for shared or deployed environments.

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding to customize the super admin account. `UserRole` is a Prisma/MySQL enum, so the role seed step verifies the configured values rather than inserting role rows. User seeds reference those enum values and skip existing emails. Subscription plans are skipped when an undeleted plan with the same name and billing cycle already exists.

```bash
npm run db:seed:roles
npm run db:seed:plans
npm run db:seed:users
# Or run all seed steps in order:
npm run db:seed
```

### Users

```http
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

User administration routes require a `SUPER_ADMIN` session.

### Business administration

All routes require the indicated role and an active login session.

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/admin/businesses?page=1&limit=20&search=spa&status=ACTIVE` | Super Admin | List businesses with owner, category, and record counts |
| `GET` | `/api/v1/admin/businesses/:businessId` | Super Admin | View a business |
| `PATCH` | `/api/v1/admin/businesses/:businessId/status` | Super Admin | Set `ACTIVE`, `INACTIVE`, or `SUSPENDED` |
| `DELETE` | `/api/v1/admin/businesses/:businessId` | Super Admin | Soft-delete a business |
| `GET` | `/api/v1/categories` | Public | List active categories for business registration |
| `POST` | `/api/v1/categories` | Super Admin | Create a category |
| `PATCH` | `/api/v1/categories/:categoryId` | Super Admin | Update a category |
| `DELETE` | `/api/v1/categories/:categoryId` | Super Admin | Soft-delete a category |
| `POST` | `/api/v1/businesses` | Business Owner | Register a business |
| `GET` | `/api/v1/businesses/mine` | Business Owner | List owned businesses |
| `GET` / `PATCH` | `/api/v1/businesses/:businessId` | Business Owner | View or update an owned business profile |
| `GET` / `POST` | `/api/v1/businesses/:businessId/services` | Business Owner | List or create services |
| `PATCH` / `DELETE` | `/api/v1/businesses/:businessId/services/:serviceId` | Business Owner | Update or soft-delete a service |
| `GET` / `POST` | `/api/v1/businesses/:businessId/staff` | Business Owner | List or add staff and assign services |
| `PATCH` / `DELETE` | `/api/v1/businesses/:businessId/staff/:staffId` | Business Owner | Update or deactivate staff |

Business registration requires an existing active `categoryId`. Staff creation accepts `name`, `email`, `password`, and optional `phone`, `employeeCode`, `designation`, and `serviceIds`. Staff passwords are hashed; password hashes are never returned. Owners can only access businesses they own, and related staff/service IDs are checked against that business. Service and staff deletes are soft deletes; deleting staff also disables their user account.

### Owner onboarding and configuration

Use this order to prepare a business for bookings:

1. Register at `/api/v1/auth/register/business-owner` and log in.
2. Read active categories from `GET /api/v1/categories`, then create the business using `POST /api/v1/businesses`.
3. Read available plans from `GET /api/v1/subscriptions/plans`. Subscribe using `POST /api/v1/subscriptions/businesses/:businessId`. A free plan activates immediately. A paid plan remains `PENDING` until a super admin sets it to `ACTIVE`; this project does not connect to a payment provider.
4. Configure working hours, then create services and staff. Assign staff to services with `serviceIds` when creating staff or updating a staff profile.
5. Configure each staff member's availability. Either the owner can set it with the business-scoped endpoint or the staff member can set their own weekly hours after logging in.
6. Add holidays, booking rules, and pricing rules as needed.
7. Use the customer role to preview availability before creating a booking.

The business owner subscribes with:

```json
{ "planId": 1 }
```

For a paid plan, a super admin changes the returned subscription ID with `PATCH /api/v1/subscriptions/admin/subscriptions/:subscriptionId/status` and `{ "status": "ACTIVE" }`. A new plan created by the super admin uses fields such as:

```json
{
  "name": "Team Monthly",
  "description": "For a growing team",
  "price": 499.00,
  "billingCycle": "MONTHLY",
  "maxStaff": 5,
  "maxServices": 25,
  "maxMonthlyBookings": 500
}
```

Each nullable maximum accepts `null` to mean unlimited. The billing cycle enum is `MONTHLY` or `YEARLY`; subscription payment collection and automatic renewal are outside the current implementation.

Example service:

```json
{
  "name": "Consultation",
  "description": "Initial consultation",
  "durationMinutes": 45,
  "basePrice": 35.00,
  "capacity": 1,
  "categoryId": 1
}
```

Example staff member with service assignments:

```json
{
  "name": "Alex Staff",
  "email": "alex.staff@example.com",
  "password": "ChangeMe123!",
  "employeeCode": "EMP-001",
  "designation": "Consultant",
  "serviceIds": [1]
}
```

Working hours and staff availability use `dayOfWeek` values `0` (Sunday) through `6` (Saturday), 24-hour `HH:mm` times, and non-overlapping intervals. Example replacement body:

```json
{
  "hours": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "isActive": true },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00", "isActive": true }
  ]
}
```

Businesses without a valid active subscription cannot add services or staff, preview a booking, or accept a booking. The plan limits are `maxStaff`, `maxServices`, and `maxMonthlyBookings`; `null` means unlimited. Staff/service limits count records whose `deletedAt` is null. Monthly bookings count bookings created during the current UTC calendar month, including bookings later cancelled. Reaching a configured cap returns HTTP `403` with an upgrade message. Soft-deleting a staff member or service frees a slot. This schema has no `maxBusinesses` or caps for configuration records such as holidays and pricing rules, so those are not plan-limited.

### Dynamic pricing

Owners manage rules under `/api/v1/businesses/:businessId/pricing-rules`. A rule can apply to one service or staff member, or use `conditionsJson` for matching weekdays, dates, times, service IDs, or staff IDs. Rules are ordered by priority (highest first) and their adjustments are applied successively to the service's base price. `adjustmentType` is `PERCENTAGE` or `FIXED`; a negative adjustment is a discount. Booking previews and saved booking items return the pricing explanation. Example peak-price rule:

```json
{
  "name": "Evening rate",
  "ruleType": "PEAK",
  "priority": 10,
  "adjustmentType": "PERCENTAGE",
  "adjustmentValue": 15,
  "conditionsJson": { "daysOfWeek": [1, 2, 3, 4, 5], "startTime": "17:00", "endTime": "20:00" },
  "isActive": true
}
```

Supported rule types are `PEAK`, `OFF_PEAK`, `COMBINATION`, and `CUSTOM`. Combination rules need service, staff, and time conditions to match. Service and staff IDs in a rule must belong to the same business. Set `startDate` and `endDate` as ISO datetimes with timezone offsets when a rule should only apply during a date range.

### Multi-service bookings

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/bookings` | Customer | Book one or more services in one checkout |
| `POST` | `/api/v1/bookings/availability` | Customer | Preview availability, automatic staff selection, and pricing without saving a booking |
| `GET` | `/api/v1/bookings/mine` | Customer | List booking history |
| `GET` | `/api/v1/bookings/:bookingId` | Customer | View a booking and its service/staff assignments |
| `POST` | `/api/v1/bookings/:bookingId/reschedule` | Customer | Reschedule all booking services; staff is assigned again |
| `POST` | `/api/v1/bookings/:bookingId/cancel` | Customer | Cancel a booking subject to business rules |
| `GET` | `/api/v1/businesses/:businessId/bookings` | Business Owner | List appointments for an owned business |
| `PATCH` | `/api/v1/businesses/:businessId/bookings/:bookingId/status` | Business Owner | Update appointment status |
| `GET` | `/api/v1/staff/bookings/mine` | Staff | View assigned appointments |
| `PATCH` | `/api/v1/staff/bookings/:bookingId/status` | Staff | Update the staff member’s assigned items |

Create booking body example:

```json
{
  "businessId": 1,
  "startAt": "2026-10-20T10:00:00+05:30",
  "serviceIds": [1, 2]
}
```

Use an ISO 8601 datetime with an explicit UTC offset. `serviceIds` must contain one or more unique active service IDs from the same business. The booking starts at `startAt`; selected services are placed sequentially in the order supplied. The engine can assign a different eligible staff member to each item. `BookingItem.staffId` is required in MySQL and records the assignment. The booking response contains the assigned staff and explanation strings for assignment and pricing.

Call `POST /api/v1/bookings/availability` with the same request body first. This runs the schedule, staff assignment, pricing, monthly plan limit, and booking-rule checks without creating a booking. Then call `POST /api/v1/bookings` to persist the booking. Creation uses a serializable database transaction; if another customer claims a conflicting slot at the same time, the API returns a conflict and asks the customer to select another time.

For each service item the engine checks:

- The business is active and accepts bookings, and the service is active and belongs to it.
- The entire sequential appointment fits within the business working hours on the same local business day and does not overlap a business holiday.
- The booking start time is in the future and satisfies the configured advance-booking window.
- A staff member is active, is assigned to the requested service, is available during that interval, is not on approved leave, and has no overlapping active appointment.
- The configured `TIME_SLOT_CAPACITY` (or service `capacity` when no override is configured) has not been reached.
- The business daily booking cap and the active subscription's monthly booking cap have not been reached.
- Pricing adjustments are evaluated in priority order and clamped at zero.

The business rules replaced by `PUT /api/v1/businesses/:businessId/booking-rules` use this form:

```json
{
  "rules": [
    { "ruleKey": "MAX_DAILY_BOOKINGS", "ruleName": "Daily booking limit", "ruleValue": "20" },
    { "ruleKey": "MIN_ADVANCE_MINUTES", "ruleName": "Minimum notice", "ruleValue": "60" },
    { "ruleKey": "MAX_ADVANCE_DAYS", "ruleName": "Booking window", "ruleValue": "30" },
    { "ruleKey": "AUTO_CONFIRM_BOOKINGS", "ruleName": "Confirm automatically", "ruleValue": "false" },
    { "ruleKey": "MAX_SERVICES_PER_BOOKING", "ruleName": "Checkout service cap", "ruleValue": "4" },
    { "ruleKey": "TIME_SLOT_CAPACITY", "ruleName": "Concurrent service capacity", "ruleValue": "1" }
  ]
}
```

Other supported rule keys: `CANCELLATION_WINDOW_MINUTES`, `RESCHEDULE_WINDOW_MINUTES`, `CUSTOMER_CANCELLATION_ALLOWED`, and `CUSTOMER_RESCHEDULE_ALLOWED`. The API accepts `ruleValue` as a string and validates its numeric or boolean contents. Replacing the rules array replaces all existing business rules; send every rule that should remain configured. If no row is configured, the engine uses its documented fallback behavior in `src/services/booking.service.js`: for example, automatic confirmation is off by default, advance limits and daily booking cap are unset, and customer cancellation/rescheduling are allowed with no time window.

Booking status values are `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`, and `NO_SHOW`. `AUTO_CONFIRM_BOOKINGS=false` creates a `PENDING` booking; an owner can confirm it. Customer rescheduling takes a new `startAt` and replans/reassigns all existing items. Cancellation and rescheduling obey the business's configured flags and time windows. Monthly plan usage counts a booking when it is created, so cancelling it does not restore that month's quota.

### Complete API inventory

All routes below are mounted beneath `http://localhost:5000`. Except health, public catalog, category/plan listing, and registration/login, routes require an active JWT session. Protected routes enforce the listed role and validate request bodies, query parameters, and path IDs.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Service health check |
| `GET` | `/` | Public | API root/status message |
| `POST` | `/api/v1/auth/register/customer` | Public | Register a customer account |
| `POST` | `/api/v1/auth/register/business-owner` | Public | Register a business owner account |
| `POST` | `/api/v1/auth/login` | Public | Log in and set JWT cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clear JWT cookie |
| `GET` | `/api/v1/catalog/businesses?page=&limit=&search=&categoryId=&city=` | Public | Search active businesses |
| `GET` | `/api/v1/catalog/businesses/:businessId` | Public | View business profile and active services |
| `GET` | `/api/v1/categories` | Public | List active business categories |
| `GET` | `/api/v1/subscriptions/plans` | Public | List active subscription plans |
| `GET` | `/api/v1/users` | Super Admin | List users |
| `GET` | `/api/v1/users/:id` | Super Admin | View user |
| `POST` | `/api/v1/users` | Super Admin | Create user with an explicit role |
| `PATCH` | `/api/v1/users/:id` | Super Admin | Update user |
| `DELETE` | `/api/v1/users/:id` | Super Admin | Deactivate/soft-delete user |
| `GET` | `/api/v1/admin/businesses` | Super Admin | Search and page businesses |
| `GET` | `/api/v1/admin/businesses/:businessId` | Super Admin | View business details |
| `PATCH` | `/api/v1/admin/businesses/:businessId/status` | Super Admin | Change business status |
| `DELETE` | `/api/v1/admin/businesses/:businessId` | Super Admin | Soft-delete business |
| `POST` | `/api/v1/categories` | Super Admin | Create category |
| `PATCH` | `/api/v1/categories/:categoryId` | Super Admin | Update category |
| `DELETE` | `/api/v1/categories/:categoryId` | Super Admin | Soft-delete category |
| `POST` | `/api/v1/subscriptions/admin/plans` | Super Admin | Create subscription plan |
| `PATCH` | `/api/v1/subscriptions/admin/plans/:planId` | Super Admin | Update plan or activation state |
| `DELETE` | `/api/v1/subscriptions/admin/plans/:planId` | Super Admin | Deactivate/soft-delete plan |
| `GET` | `/api/v1/subscriptions/admin/subscriptions?page=&limit=&status=` | Super Admin | List business subscriptions |
| `PATCH` | `/api/v1/subscriptions/admin/subscriptions/:subscriptionId/status` | Super Admin | Update subscription state |
| `GET` | `/api/v1/admin/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Super Admin | Booking, revenue, business, and user summary |
| `GET` | `/api/v1/businesses/mine` | Business Owner | List own businesses |
| `POST` | `/api/v1/businesses` | Business Owner | Create a business |
| `GET`, `PATCH` | `/api/v1/businesses/:businessId` | Business Owner | View/update own business |
| `GET`, `PUT` | `/api/v1/businesses/:businessId/working-hours` | Business Owner | Read/replace working hours |
| `GET`, `PUT` | `/api/v1/businesses/:businessId/booking-rules` | Business Owner | Read/replace configurable booking rules |
| `GET`, `POST` | `/api/v1/businesses/:businessId/pricing-rules` | Business Owner | List/create dynamic pricing rules |
| `PATCH`, `DELETE` | `/api/v1/businesses/:businessId/pricing-rules/:ruleId` | Business Owner | Update/soft-delete pricing rule |
| `GET`, `POST` | `/api/v1/businesses/:businessId/holidays` | Business Owner | List/create holidays |
| `DELETE` | `/api/v1/businesses/:businessId/holidays/:holidayId` | Business Owner | Delete holiday |
| `GET`, `POST` | `/api/v1/businesses/:businessId/services` | Business Owner | List/create services |
| `PATCH`, `DELETE` | `/api/v1/businesses/:businessId/services/:serviceId` | Business Owner | Update/soft-delete service |
| `GET`, `POST` | `/api/v1/businesses/:businessId/staff` | Business Owner | List/create staff and service assignments |
| `PATCH`, `DELETE` | `/api/v1/businesses/:businessId/staff/:staffId` | Business Owner | Update/deactivate staff |
| `GET`, `PUT` | `/api/v1/businesses/:businessId/staff/:staffId/availability` | Business Owner | Read/replace staff availability |
| `GET` | `/api/v1/businesses/:businessId/bookings?page=&limit=&status=` | Business Owner | List business appointments |
| `PATCH` | `/api/v1/businesses/:businessId/bookings/:bookingId/status` | Business Owner | Update appointment status |
| `GET` | `/api/v1/businesses/:businessId/reports/summary?from=&to=` | Business Owner | Own-business booking and revenue summary |
| `GET` | `/api/v1/subscriptions/businesses/:businessId` | Business Owner | View business subscription and payment records |
| `POST` | `/api/v1/subscriptions/businesses/:businessId` | Business Owner | Subscribe to an active plan |
| `POST` | `/api/v1/bookings/availability` | Customer | Preview service schedule, staff assignment, pricing, and rule explanations |
| `POST` | `/api/v1/bookings` | Customer | Create a multi-service booking |
| `GET` | `/api/v1/bookings/mine` | Customer | List own booking history |
| `GET` | `/api/v1/bookings/:bookingId` | Customer | View own booking and assigned staff |
| `POST` | `/api/v1/bookings/:bookingId/reschedule` | Customer | Reschedule and reassign staff |
| `POST` | `/api/v1/bookings/:bookingId/cancel` | Customer | Cancel booking subject to configured rules |
| `GET` | `/api/v1/staff/availability` | Staff | View own weekly availability |
| `PUT` | `/api/v1/staff/availability` | Staff | Replace own weekly availability |
| `GET` | `/api/v1/staff/bookings/mine?page=&limit=&status=` | Staff | View assigned appointments |
| `PATCH` | `/api/v1/staff/bookings/:bookingId/status` | Staff | Update assigned appointment status |

`POST /api/v1/subscriptions/businesses/:businessId` places paid plans in `PENDING` until an administrator activates the subscription; free plans become `ACTIVE`. Payment processing is not included because no payment gateway is configured. All business and staff-management IDs are checked against the authenticated owner's or staff member's records.

The admin and business report endpoints accept optional `from` and `to` dates in `YYYY-MM-DD` format. They filter bookings by booking creation time. Revenue includes bookings whose current status is `CONFIRMED` or `COMPLETED`; it is booking revenue only and does not include subscription payments. Daily report buckets use UTC dates.

Active subscription limits are enforced when a business owner adds a service or staff member and when a customer previews or creates a booking. `maxStaff` and `maxServices` count non-deleted records; soft-deleting one frees a slot. `maxMonthlyBookings` counts bookings created during the current UTC calendar month, including subsequently cancelled bookings. A business without an active, in-date subscription must activate or choose a plan before adding these resources or accepting bookings. The seeded Starter plan permits 2 staff, 10 services, and 100 bookings per month. Limit errors return HTTP `403` and tell the owner to upgrade. Plan fields set to `null` are unlimited.

Owners can delete services and staff with `DELETE /api/v1/businesses/:businessId/services/:serviceId` and `DELETE /api/v1/businesses/:businessId/staff/:staffId`. Both operations soft-delete the business record; deleting staff also disables that staff user's login. Existing booking records and their service/staff references remain available as history.

`BookingItem.staffId` is a required foreign key to `StaffProfile`. Staff assignment is stored on each service item because different services in the same checkout can be assigned to different staff. Booking preview, create, list, detail, reschedule, cancel, and status responses include each `items[]` entry's `staffId`, related `staff` profile, service, and assignment explanation. The booking engine assigns an active staff member linked to each service, schedules services sequentially from `startAt`, and checks business hours, holidays, staff availability and approved leave, overlapping appointments, service capacity, daily limits, and advance-booking rules. Pricing rules apply by priority; their adjustments and each assignment explanation are returned with the booking. Booking creation runs in a serializable transaction to prevent concurrent slot claims.

Owners configure availability at `PUT /api/v1/businesses/:businessId/working-hours` and `PUT /api/v1/businesses/:businessId/staff/:staffId/availability` with `{ "hours": [{ "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "isActive": true }] }`. Holiday APIs are under `/api/v1/businesses/:businessId/holidays`. Booking rules are replaced with `PUT /api/v1/businesses/:businessId/booking-rules`; supported keys are `MAX_DAILY_BOOKINGS`, `MIN_ADVANCE_MINUTES`, `MAX_ADVANCE_DAYS`, `CANCELLATION_WINDOW_MINUTES`, `RESCHEDULE_WINDOW_MINUTES`, `CUSTOMER_CANCELLATION_ALLOWED`, `CUSTOMER_RESCHEDULE_ALLOWED`, `AUTO_CONFIRM_BOOKINGS`, `MAX_SERVICES_PER_BOOKING`, and `TIME_SLOT_CAPACITY`. Pricing rules can be managed under `/api/v1/businesses/:businessId/pricing-rules`. Configure working hours and at least one eligible staff member’s service assignment and availability before requesting a booking preview or creating a booking. `AUTO_CONFIRM_BOOKINGS` defaults to `false`; when disabled, the booking is `PENDING` until the owner confirms it.

Example business registration:

```json
{
  "name": "Northside Studio",
  "categoryId": 1,
  "email": "hello@northside.example",
  "phone": "+919876543210",
  "city": "Mumbai",
  "timezone": "Asia/Kolkata"
}
```

Create user:

```json
{
  "name": "New Customer",
  "email": "customer@example.com",
  "password": "ChangeMe123!",
  "role": "CUSTOMER"
}
```

List users:

```http
GET /api/v1/users?page=1&limit=10&search=honey
```

### API request and error behavior

Send JSON request bodies with `Content-Type: application/json`. Protected requests in the Postman collection send the login cookie as `Cookie: accessToken={{roleToken}}`; browsers should include credentials when calling from an allowed origin. The collection has separate token variables for super admin, owner, staff, and customer so a login for one role does not overwrite the others.

Request bodies, query parameters, and path IDs are checked with Zod before controller logic runs. Invalid input returns HTTP `400` with a structured message and `details` array. Other common responses are:

| Status | Meaning |
| --- | --- |
| `200` | Request completed |
| `201` | Resource created |
| `204` | Resource deleted (soft delete where supported); no response body |
| `400` | Invalid request data or booking input |
| `401` | Missing, invalid, or expired login session |
| `403` | Role access denied or plan limit reached |
| `404` | Resource does not exist or is outside the current owner's scope |
| `409` | Duplicate resource, invalid state change, unavailable slot, or booking conflict |
| `500` | Unexpected server error |

Error response example:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    { "path": "body.email", "message": "Invalid email address" }
  ]
}
```

Validation and authorization apply to APIs as well as forms. Owners can only manage businesses they own. Customers can only view or change their own bookings. Staff can only manage assigned booking items and their own availability. Password hashes are never returned by user or staff APIs. User, business, service, staff, category, plan, holiday, and pricing-rule deletions are soft deletes or deactivations where the corresponding delete route is provided; booking history is retained.

### Example cookie-authenticated requests

The API returns an `accessToken` cookie from login. With `curl`, store the cookie jar from login and reuse it for protected requests:

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"Customer@12345"}' \
  http://localhost:5000/api/v1/auth/login

curl -b cookies.txt http://localhost:5000/api/v1/bookings/mine
```

### Troubleshooting

| Symptom | Check |
| --- | --- |
| API fails before listening | Verify MySQL is running, `DATABASE_URL` is reachable, and migrations have been applied. |
| Prisma says a table is missing | Run `npm run db:deploy` after confirming the database name in `DATABASE_URL`. |
| Login returns `401` | Confirm the account exists, is active, and the email/password match. Run the seed command for the sample accounts. |
| Protected API returns `401` | Log in first and send the `accessToken` cookie. Check that Postman is using the correct role token variable. |
| Protected API returns `403` | The account may have the wrong role, or the business may lack an active plan/has reached a plan cap. |
| Business cannot preview a booking | Configure active working hours, active service, staff-service assignment, staff availability, and an active subscription; check holidays, leave, and existing appointments. |
| Staff login works but staff endpoints return profile not found | Create that staff account through the owner's staff API. A `STAFF` user alone does not create a `StaffProfile`. |
| Browser reports CORS error | Add the exact frontend origin to `CORS_ORIGINS`, restart the API, and send requests with credentials enabled. |

## 8. Prisma commands

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate

# Development migration
npm run db:migrate -- --name add_some_feature

# Production/staging migration
npm run db:deploy

# Database browser
npm run db:studio
```

Never use `prisma migrate reset` against a production database.

## 9. Docker

Docker Compose starts MySQL and the API. The API container runs `prisma migrate deploy` before starting the server. This does not seed sample accounts or plans.

Before Compose starts, create `.env` from `.env.example` if you have not already and set `JWT_SECRET` to a unique secret of at least 32 characters. Compose passes it (and the optional seeded admin credentials) into the API container. The application container connects to the Compose MySQL service as `appuser`; a host-side `DATABASE_URL` is not used by that container.

Start API + MySQL:

```bash
docker compose up --build
```

In another terminal, seed the database when sample accounts/plans are needed:

```bash
docker compose exec api npm run db:seed
```

API:

```text
http://localhost:5000
```

Stop:

```bash
docker compose down
```

Delete database volume too:

```bash
docker compose down -v
```

`down -v` permanently removes the local MySQL data volume. Do not use it when you want to preserve local database contents. The Compose service uses `appuser`/`apppassword` internally and publishes MySQL on port `3306`; change those values before using this setup outside a local development machine.

## 10. Git workflow

```bash
git init
git add .
git commit -m "chore: initialize production api"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not commit `.env`.

## 11. Production deployment

Recommended sequence:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm start
```

Set production environment variables through the hosting platform/secret manager rather than committing them.

For a real production deployment, put the Node process behind a reverse proxy/load balancer and use HTTPS. Use a managed MySQL instance with backups, monitoring, and restricted network access.

The auth cookie is `HttpOnly`, `Secure` in production, and `SameSite=Strict`. A browser frontend must use a same-site deployment arrangement for this cookie policy, send credentials on requests, and have its origin listed in `CORS_ORIGINS`. If the frontend and API are on different sites, configure an appropriate cross-site cookie policy and CSRF protection before deployment. Do not enable wildcard CORS for credentialed browser traffic. Rotate the seeded credentials and set `SEED_ADMIN_PASSWORD` and a unique `JWT_SECRET` before production. The default rate limiter is global; tune its window/limit for the deployment and account for reverse-proxy IP handling.

## Current scope and limitations

- Subscriptions include plan creation, business enrollment, status management, and plan-cap checks. Paid enrollment becomes `PENDING` until an admin activates it. There is no payment gateway or API that marks a payment as paid.
- `maxStaff`, `maxServices`, and `maxMonthlyBookings` are enforced. The schema defines no `maxBusinesses` field, so business count is not limited by a plan.
- The booking engine checks approved `StaffLeave` rows, but there are currently no HTTP APIs to submit or approve staff leave. Manage availability through the staff availability endpoints; leave rows currently need to be managed outside this API.
- Reports aggregate booking records and booking revenue, not subscription payments. Revenue counts bookings currently in `CONFIRMED` or `COMPLETED` status.
- No automated test command is configured in `package.json`. `npm run prisma:validate` checks Prisma schema validity; it does not test database-backed booking behavior.

## Data model overview

Prisma defines these primary entities and relations:

| Area | Main records | Notes |
| --- | --- | --- |
| Identity | `User`, `UserRole`, `UserStatus` | One user role; staff users have a related `StaffProfile`. |
| Business catalog | `Category`, `Business`, `BusinessService` | Business has one owner and category; services belong to one business. |
| Staff setup | `StaffProfile`, `StaffService`, `StaffAvailability`, `StaffLeave` | Staff profiles link users to a business and service assignments. |
| Schedule setup | `WorkingHour`, `Holiday`, `BookingRule` | Hours use business local time; holidays can be full-day or partial-day. |
| Booking | `Booking`, `BookingItem`, `BookingStatusHistory` | One checkout has multiple sequential items; every item stores a required staff assignment and explanations. |
| Pricing | `PricingRule` | Rules can target a business, service, staff member, period, and JSON conditions. |
| Subscription | `SubscriptionPlan`, `BusinessSubscription`, `SubscriptionPayment` | Plan caps are nullable (unlimited); payment rows are modeled but not gateway-integrated. |

Soft-deletable tables retain records through `deletedAt`. Read paths for live business/service/staff records filter out soft-deleted rows. Booking items and history retain service/staff relations for audit and customer history.

## Architecture

```text
src/
├── config/          Environment configuration
├── controllers/     HTTP request/response handling
├── lib/             Prisma + logger
├── middleware/      Validation, errors, not-found
├── routes/          API route definitions
├── services/        Business logic + database operations
├── app.js           Express application
└── server.js        HTTP server lifecycle

prisma/
├── migrations/
├── schema.prisma
└── seed.js
```

The separation is intentional: controllers should stay thin, services contain business logic, and Prisma access stays out of route definitions.
