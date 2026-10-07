const styles = {
  ACTIVE: "success",
  COMPLETED: "success",
  CONFIRMED: "success",
  INACTIVE: "neutral",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
  PENDING: "warning",
  SUSPENDED: "danger",
  FAILED: "danger",
  SUPER_ADMIN: "purple",
  BUSINESS_OWNER: "blue",
  STAFF: "teal",
  CUSTOMER: "neutral",
  ON_LEAVE: "warning",
};

export function StatusBadge({ value }) {
  const label = value?.replaceAll("_", " ") || "Unknown";
  return <span className={`status-badge badge-${styles[value] || "neutral"}`}>{label}</span>;
}
