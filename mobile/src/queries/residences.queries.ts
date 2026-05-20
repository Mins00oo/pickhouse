import { useQuery } from '@tanstack/react-query';
import { residencesApi } from '@/api/residences.api';
import { residencesRepo } from '@/db/residences.repo';
import { useAuthStore } from '@/stores/authStore';

const KEY = ['residences'] as const;

export function useResidences() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: KEY,
    enabled: Boolean(userId),
    queryFn: async () => {
      const local = userId ? await residencesRepo.list(userId) : [];
      try {
        const remote = await residencesApi.list();
        const byId = new Map(remote.map((r) => [r.id, r]));
        for (const r of local) if (!byId.has(r.id)) byId.set(r.id, r);
        return Array.from(byId.values()).sort((a, b) =>
          b.contractStartDate.localeCompare(a.contractStartDate),
        );
      } catch {
        return local;
      }
    },
  });
}

export function useCurrentResidence() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['currentResidence'],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      return residencesRepo.findCurrent(userId);
    },
  });
}
