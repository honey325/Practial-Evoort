import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage.jsx";
import { RegisterPage } from "../features/auth/pages/RegisterPage.jsx";
import { LogoutPage } from "../features/auth/pages/LogoutPage.jsx";
import { PublicOnlyRoute, RequireAuth, RequireRole } from "../features/auth/components/AuthRoutes.jsx";
import { AdminLayout } from "../features/admin/components/AdminLayout.jsx";
import { AdminDashboardPage } from "../features/admin/pages/AdminDashboardPage.jsx";
import { BusinessesPage } from "../features/admin/pages/BusinessesPage.jsx";
import { PlansPage } from "../features/admin/pages/PlansPage.jsx";
import { CategoriesPage } from "../features/admin/pages/CategoriesPage.jsx";
import { UsersPage } from "../features/admin/pages/UsersPage.jsx";
import { ReportsPage } from "../features/admin/pages/ReportsPage.jsx";
import { OwnerWorkspaceProvider } from "../features/business-owner/context/OwnerWorkspaceContext.jsx";
import { BusinessOwnerLayout } from "../features/business-owner/components/BusinessOwnerLayout.jsx";
import { OwnerDashboardPage } from "../features/business-owner/pages/OwnerDashboardPage.jsx";
import { BusinessProfilePage } from "../features/business-owner/pages/BusinessProfilePage.jsx";
import { ServicesPage } from "../features/business-owner/pages/ServicesPage.jsx";
import { StaffPage } from "../features/business-owner/pages/StaffPage.jsx";
import { WorkingHoursPage } from "../features/business-owner/pages/WorkingHoursPage.jsx";
import { HolidaysPage } from "../features/business-owner/pages/HolidaysPage.jsx";
import { AppointmentsPage } from "../features/business-owner/pages/AppointmentsPage.jsx";
import { PricingRulesPage } from "../features/business-owner/pages/PricingRulesPage.jsx";
import { StaffLayout } from "../features/staff/components/StaffLayout.jsx";
import { StaffOverviewPage } from "../features/staff/pages/StaffOverviewPage.jsx";
import { StaffAvailabilityPage } from "../features/staff/pages/StaffAvailabilityPage.jsx";
import { StaffAppointmentsPage } from "../features/staff/pages/StaffAppointmentsPage.jsx";
import { CustomerLayout } from "../features/customer/components/CustomerLayout.jsx";
import { BusinessSearchPage } from "../features/customer/pages/BusinessSearchPage.jsx";
import { BusinessDetailPage } from "../features/customer/pages/BusinessDetailPage.jsx";
import { BookingHistoryPage } from "../features/customer/pages/BookingHistoryPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/logout" element={<RequireAuth><LogoutPage /></RequireAuth>} />
      <Route path="/admin" element={<RequireRole role="SUPER_ADMIN"><AdminLayout /></RequireRole>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
      <Route path="/business-owner" element={<RequireRole role="BUSINESS_OWNER"><OwnerWorkspaceProvider><BusinessOwnerLayout /></OwnerWorkspaceProvider></RequireRole>}>
        <Route index element={<OwnerDashboardPage />} />
        <Route path="profile" element={<BusinessProfilePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="hours" element={<WorkingHoursPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="pricing" element={<PricingRulesPage />} />
      </Route>
      <Route path="/staff" element={<RequireRole role="STAFF"><StaffLayout /></RequireRole>}>
        <Route index element={<StaffOverviewPage />} />
        <Route path="appointments" element={<StaffAppointmentsPage />} />
        <Route path="availability" element={<StaffAvailabilityPage />} />
      </Route>
      <Route path="/customer" element={<RequireRole role="CUSTOMER"><CustomerLayout /></RequireRole>}>
        <Route index element={<Navigate to="businesses" replace />} />
        <Route path="businesses" element={<BusinessSearchPage />} />
        <Route path="businesses/:businessId" element={<BusinessDetailPage />} />
        <Route path="bookings" element={<BookingHistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
