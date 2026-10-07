import { useCallback, useEffect, useState } from "react";

export function useAdminData(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => { load(); }, [load]);
  return { data, setData, loading, error, reload: load };
}
