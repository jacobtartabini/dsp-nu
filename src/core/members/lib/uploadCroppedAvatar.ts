import { supabase } from '@/integrations/supabase/client';

export async function uploadCroppedAvatar(userId: string, blob: Blob): Promise<string> {
  const filePath = `${userId}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}
