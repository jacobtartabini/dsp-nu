import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useChairPositions() {
  return useQuery({
    queryKey: ['chair-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chair_positions')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateChairPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { title: string; description?: string; sort_order?: number }) => {
      const { error } = await supabase.from('chair_positions').insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chair-positions'] });
      toast.success('Chair position created');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateChairPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; title?: string; description?: string; sort_order?: number }) => {
      const { error } = await supabase.from('chair_positions').update(values).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chair-positions'] });
      toast.success('Chair position updated');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteChairPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chair_positions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chair-positions'] });
      toast.success('Chair position deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
