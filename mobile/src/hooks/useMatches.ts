import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMatches, getPendingMatches, respondToMatch } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Match } from '../types';

export function useMatches() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery<Match[]>({
    queryKey: ['matches', userId],
    queryFn: () => getMatches(userId!).then((data) => data as Match[]),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function usePendingMatches() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery<Match[]>({
    queryKey: ['pending-matches', userId],
    queryFn: () => getPendingMatches(userId!).then((data) => data as Match[]),
    enabled: !!userId,
    staleTime: 10_000,
  });
}

export function useRespondToMatch() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: ({ matchId, accept }: { matchId: string; accept: boolean }) =>
      respondToMatch(matchId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['pending-matches', userId] });
    },
  });
}
