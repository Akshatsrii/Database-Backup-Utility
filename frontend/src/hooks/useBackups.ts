import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backupsApi } from "@/lib/api";
import type { Backup } from "@/types";

export function useBackups() {
  const qc = useQueryClient();

  const query = useQuery<Backup[]>({
    queryKey: ["backups"],
    queryFn: async () => {
      const res = await backupsApi.list();
      return res.data.data ?? [];
    },
    refetchInterval: 15_000,
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["backups"] });

  return { ...query, refresh };
}