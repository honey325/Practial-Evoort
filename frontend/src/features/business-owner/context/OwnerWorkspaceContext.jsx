import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { businessOwnerApi } from "../api/businessOwner.api.js";

const OwnerWorkspaceContext = createContext(null);

export function OwnerWorkspaceProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState(() => sessionStorage.getItem("bookly-owner-business") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshBusinesses = useCallback(async (preferredId) => {
    setLoading(true);
    setError("");
    try {
      const result = await businessOwnerApi.myBusinesses();
      const items = result.data || [];
      setBusinesses(items);
      setSelectedId((currentId) => {
        const desiredId = String(preferredId || currentId || "");
        const nextId = items.some((business) => String(business.id) === desiredId) ? desiredId : String(items[0]?.id || "");
        return nextId;
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshBusinesses(); }, [refreshBusinesses]);
  useEffect(() => {
    if (selectedId) sessionStorage.setItem("bookly-owner-business", selectedId);
    else sessionStorage.removeItem("bookly-owner-business");
  }, [selectedId]);

  const selectedBusiness = businesses.find((business) => String(business.id) === String(selectedId)) || null;
  const selectBusiness = useCallback((id) => setSelectedId(String(id || "")), []);

  const createBusiness = useCallback(async (details) => {
    const result = await businessOwnerApi.createBusiness(details);
    await refreshBusinesses(result.data.id);
    return result.data;
  }, [refreshBusinesses]);

  const value = useMemo(() => ({
    businesses,
    selectedBusiness,
    selectedBusinessId: selectedBusiness?.id || null,
    selectBusiness,
    createBusiness,
    refreshBusinesses,
    loading,
    error,
  }), [businesses, selectedBusiness, selectBusiness, createBusiness, refreshBusinesses, loading, error]);

  return <OwnerWorkspaceContext.Provider value={value}>{children}</OwnerWorkspaceContext.Provider>;
}

export function useOwnerWorkspace() {
  const context = useContext(OwnerWorkspaceContext);
  if (!context) throw new Error("useOwnerWorkspace must be used inside OwnerWorkspaceProvider");
  return context;
}
