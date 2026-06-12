import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export function useProfile() {
  const authenticated = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    enabled: authenticated,
    queryFn: () => authApi.me(),
  });
}
