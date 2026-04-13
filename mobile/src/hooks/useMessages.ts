import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getMessages, sendMessage, subscribeToMessages } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Message } from '../types';

export function useMessages(matchId: string) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Message[]>({
    queryKey: ['messages', matchId],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await getMessages(matchId, 50, pageParam as string | undefined);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.length || lastPage.length < 50) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    initialPageParam: undefined,
    enabled: !!matchId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!matchId) return;

    const channel = subscribeToMessages(matchId, (newMsg) => {
      queryClient.setQueryData<{ pages: Message[][] }>(
        ['messages', matchId],
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return { ...old, pages: [[newMsg as Message, ...firstPage], ...rest] };
        },
      );
    });

    return () => { channel.unsubscribe(); };
  }, [matchId, queryClient]);

  return query;
}

export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (content: string) => sendMessage(matchId, content),
    onSuccess: ({ data }) => {
      if (!data) return;
      queryClient.setQueryData<{ pages: Message[][] }>(
        ['messages', matchId],
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return { ...old, pages: [[data as Message, ...firstPage], ...rest] };
        },
      );
    },
  });
}
