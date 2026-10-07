import { useState } from "react";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { OwnerBusinessRequired } from "../components/OwnerBusinessRequired.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../admin/components/AdminState.jsx";
import { Modal } from "../../admin/components/Modal.jsx";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

function selectedServiceIds(staff) {
  return (
    staff?.services
      ?.map((assignment) => assignment.service?.id)
      .filter(Boolean) ||
    staff?.serviceIds ||
    []
  );
}

function StaffForm({ staff, services, onSubmit, onCancel, saving, error }) {
  const assigned = new Set(selectedServiceIds(staff).map(String));
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <label className="admin-field">
        <span>Full name</span>
        <input
          name="name"
          defaultValue={staff?.user?.name || staff?.name || ""}
          minLength={2}
          maxLength={100}
          required
        />
      </label>
      {!staff?.id && (
        <label className="admin-field">
          <span>Email address</span>
          <input name="email" type="email" maxLength={191} required />
        </label>
      )}
      <label className="admin-field">
        <span>Phone number</span>
        <input
          name="phone"
          type="tel"
          defaultValue={staff?.user?.phone || ""}
          pattern="^[0-9]{10}$"
          placeholder="+919876543210"
        />
      </label>
      {!staff?.id && (
        <label className="admin-field">
          <span>Temporary password</span>
          <input
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
      )}
      <div className="admin-form-row">
        <label className="admin-field">
          <span>Employee code</span>
          <input
            name="employeeCode"
            defaultValue={staff?.employeeCode || ""}
            maxLength={50}
          />
        </label>
        <label className="admin-field">
          <span>Designation</span>
          <input
            name="designation"
            defaultValue={staff?.designation || ""}
            maxLength={100}
          />
        </label>
      </div>
      {staff?.id && (
        <label className="admin-field">
          <span>Status</span>
          <select name="status" defaultValue={staff.status}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On leave</option>
          </select>
        </label>
      )}
      <div className="admin-field">
        <span>Services</span>
        {services?.length ? (
          <div className="owner-check-grid">
            {services
              .filter((service) => service.status === "ACTIVE")
              .map((service) => (
                <label key={service.id}>
                  <input
                    type="checkbox"
                    name="serviceIds"
                    value={service.id}
                    defaultChecked={assigned.has(String(service.id))}
                  />
                  {service.name}
                </label>
              ))}
          </div>
        ) : (
          <span className="owner-note">
            Add active services before assigning them to staff.
          </span>
        )}
      </div>
      <div className="modal-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="button button-primary button-auto"
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : staff?.id
              ? "Save changes"
              : "Add staff member"}
        </button>
      </div>
    </form>
  );
}

export function StaffPage() {
  const { selectedBusiness } = useOwnerWorkspace();
  const { data, loading, error, reload } = useAdminData(async () => {
    if (!selectedBusiness) return null;
    const [staff, services] = await Promise.all([
      businessOwnerApi.staff(selectedBusiness.id),
      businessOwnerApi.services(selectedBusiness.id),
    ]);
    return { staff: staff.data || [], services: services.data || [] };
  }, [selectedBusiness?.id]);
  const [activeStaff, setActiveStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function submitStaff(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    const serviceIds = form.getAll("serviceIds").map(Number);
    const payload = {
      name: form.get("name"),
      employeeCode:
        form.get("employeeCode") || (activeStaff?.id ? null : undefined),
      designation:
        form.get("designation") || (activeStaff?.id ? null : undefined),
      serviceIds,
    };
    if (activeStaff?.id) {
      payload.phone = form.get("phone") || null;
      payload.status = form.get("status");
    } else {
      payload.email = form.get("email");
      payload.password = form.get("password");
      if (form.get("phone")) payload.phone = form.get("phone");
    }
    try {
      if (activeStaff?.id)
        await businessOwnerApi.updateStaff(
          selectedBusiness.id,
          activeStaff.id,
          payload,
        );
      else await businessOwnerApi.createStaff(selectedBusiness.id, payload);
      setActiveStaff(null);
      setNotice(
        activeStaff?.id ? "Staff profile updated." : "Staff member created.",
      );
      await reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeStaff(staff) {
    if (
      !window.confirm(
        `Remove ${staff.user?.name || "this staff member"}? Their login will be disabled.`,
      )
    )
      return;
    try {
      await businessOwnerApi.deleteStaff(selectedBusiness.id, staff.id);
      setNotice("Staff member removed.");
      await reload();
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <OwnerBusinessRequired>
      <PageHeader
        eyebrow="Team"
        title="Staff management"
        description="Manage staff accounts and the services they provide."
        action={
          <button
            className="button button-primary button-auto"
            onClick={() => {
              setFormError("");
              setActiveStaff({});
            }}
          >
            Add staff <span aria-hidden="true">+</span>
          </button>
        }
      />
      {notice && (
        <div className="admin-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <section className="admin-card">
        <div className="card-heading">
          <div>
            <h2>{selectedBusiness?.name}</h2>
            <p>{data?.staff?.length || 0} staff members</p>
          </div>
        </div>
        {loading ? (
          <LoadingState label="Loading staff..." />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : data?.staff?.length ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Designation</th>
                  <th>Employee code</th>
                  <th>Services</th>
                  <th>Status</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {data.staff.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <strong>{staff.user?.name}</strong>
                      <small>{staff.user?.email}</small>
                    </td>
                    <td>{staff.designation || "—"}</td>
                    <td>{staff.employeeCode || "—"}</td>
                    <td>
                      <div className="owner-item-list">
                        {staff.services?.length
                          ? staff.services.map((assignment) => (
                              <span key={assignment.id}>
                                {assignment.service?.name}
                              </span>
                            ))
                          : "—"}
                      </div>
                    </td>
                    <td>
                      <StatusBadge value={staff.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="text-action"
                          onClick={() => {
                            setFormError("");
                            setActiveStaff(staff);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-action text-action-danger"
                          onClick={() => removeStaff(staff)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No staff yet"
            description="Add staff members to assign services and appointments."
          />
        )}
      </section>
      {activeStaff && (
        <Modal
          title={activeStaff.id ? "Edit staff member" : "Add staff member"}
          onClose={() => setActiveStaff(null)}
        >
          <StaffForm
            staff={activeStaff}
            services={data?.services || []}
            onSubmit={submitStaff}
            onCancel={() => setActiveStaff(null)}
            saving={saving}
            error={formError}
          />
        </Modal>
      )}
    </OwnerBusinessRequired>
  );
}
