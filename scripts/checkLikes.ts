import { supabase } from '../lib/supabaseClient';

(async () => {
  const email = 'p.sarvesh8393@gmail.com';
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  console.log('profile', profile, 'error', pErr);
  if (!profile) return;

  const { data: likes, error } = await supabase
    .from('startup_likes')
    .select('*')
    .eq('user_id', profile.id);
  console.log('likes', likes, 'error', error);
})();
