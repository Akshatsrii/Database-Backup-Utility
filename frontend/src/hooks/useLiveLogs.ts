import { useQuery } from "@tanstack/react-query";
import { logsApi } from "@/lib/api";
import type { LogEntry } from "@/types";

export function useLiveLogs(limit = 200) {
  return useQuery<LogEntry[]>({
    queryKey: ["logs", limit],
    queryFn: async () => {
      try {
        const res = await logsApi.list(limit);
        return res.data.data ?? [];
      } catch {
        return [];
      }
    },
  });
}