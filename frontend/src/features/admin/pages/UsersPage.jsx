import { useState } from "react";
import { adminApi } from "../api/admin.api.js";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminState.jsx";
import { Modal } from "../components/Modal.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { Pagination } from "../components/Pagination.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useAdminData } from "../hooks/useAdminData.js";

const PAGE_SIZE = 10;

function UserForm({ user, onSubmit, onCancel, saving, error }) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="admin-field"><span>Full name</span><input name="name" defaultValue={user?.name || ""} minLength={2} maxLength={100} required /></label>
      <label className="admin-field"><span>Email address</span><input name="email" type="email" defaultValue={user?.email || ""} maxLength={191} required /></label>
      {!user?.id && <>
        <label className="admin-field"><span>Role</span><select name="role" defaultValue="CUSTOMER"><option value="CUSTOMER">Customer</option><option value="BUSINESS_OWNER">Business owner</option><option value="STAFF">Staff</option><option value="SUPER_ADMIN">Super admin</option></select></label>
        <label className="admin-field"><span>Temporary password</span><input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></label>
      </>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : user?.id ? "Save changes" : "Create user"}</button></div>
    </form>
  );
}

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminData(async () => adminApi.users({ page, limit: PAGE_SIZE, search: appliedSearch }), [page, appliedSearch]);
  const [activeUser, setActiveUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), email: form.get("email") };
    if (!activeUser?.id) {
      payload.role = form.get("role");
      payload.password = form.get("password");
    }
    try {
      if (activeUser?.id) await adminApi.updateUser(activeUser.id, payload);
      else await adminApi.createUser(payload);
      setActiveUser(null);
      setNotice(activeUser?.id ? "User updated." : "User created.");
      await reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Delete ${user.name}'s user account? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(user.id);
      setNotice("User deleted.");
      await reload();
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Access control" title="Users" description="Create and manage platform accounts." action={<button className="button button-primary button-auto" onClick={() => { setFormError(""); setActiveUser({}); }}>Add user <span aria-hidden="true">+</span></button>} />
      {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      <section className="admin-card">
        <form className="list-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedSearch(search); }}>
          <label className="search-field"><span className="sr-only">Search users</span><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /></label>
          <button className="button button-secondary button-auto" type="submit">Search</button>
          <span className="toolbar-count">{data?.pagination?.total ?? 0} users</span>
        </form>
        {loading ? <LoadingState label="Loading users..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.data?.length ? (
          <>
            <div className="table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
              {data.data.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td><StatusBadge value={user.role} /></td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><div className="row-actions"><button className="text-action" onClick={() => { setFormError(""); setActiveUser(user); }}>Edit</button><button className="text-action text-action-danger" onClick={() => removeUser(user)}>Delete</button></div></td></tr>)}
            </tbody></table></div>
            <Pagination page={data.pagination?.page || page} totalPages={data.pagination?.totalPages} onChange={setPage} />
          </>
        ) : <EmptyState title="No users found" description="Try another search or create a new user." />}
      </section>
      {activeUser && <Modal title={activeUser.id ? "Edit user" : "Create user"} onClose={() => setActiveUser(null)}>
        <UserForm user={activeUser} onSubmit={handleSubmit} onCancel={() => setActiveUser(null)} saving={saving} error={formError} />
      </Modal>}
    </>
  );
}
