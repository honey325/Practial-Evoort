const rolePaths = {
  SUPER_ADMIN: "/admin",
  BUSINESS_OWNER: "/business-owner",
  STAFF: "/staff",
  CUSTOMER: "/customer",
};

export function getRolePath(role) {
  return rolePaths[role] || "/login";
}

export function getRoleLabel(role) {
  if (role === "BUSINESS_OWNER") return "Business owner";
  if (role === "SUPER_ADMIN") return "Super admin";
  return role?.toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}
