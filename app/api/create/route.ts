import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (profileError || !profile) {
    return new Response('Profile not found', { status: 404 });
  }

  const founder_id = profile.id;
  const formData = await req.formData();

  const getField = (key: string) => formData.get(key)?.toString().trim() || '';

  const name = getField('name');
  const short_description = getField('short_description');
  const description = getField('description');
  const website_url = getField('website_url');
  const funding_stage = getField('funding_stage');
  const account_details = getField('account_details');
  const image_url_direct = getField('image_url');
  const tags = getField('tags').split(',').map(tag => tag.trim()).filter(Boolean);


  const mission_statement = getField('mission_statement');
  const problem_solution = getField('problem_solution');
  const founder_story = getField('founder_story');
  const target_market = getField('target_market');
  const traction = getField('traction');
  const use_of_funds = getField('use_of_funds');
  const milestones = getField('milestones');
  const team_profiles = getField('team_profiles');
  const awards = getField('awards');

  const imageFile = formData.get('image_file') as File | null;
  const slug = `${name.replace(/\s+/g, '-').toLowerCase()}-${uuidv4()}`;

  let image_url = image_url_direct;

  if (!image_url && imageFile) {
    const { data, error: uploadError } = await supabase.storage
      .from('startup-images')
      .upload(slug, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
    }

    const { data: publicUrlData } = await supabase.storage
      .from('startup-images')
      .getPublicUrl(slug);

    image_url = publicUrlData.publicUrl;
  }

  const { error: dbError } = await supabase.from('startups').insert([
    {
      name,
      slug,
      short_description,
      description,
      website_url,
      funding_stage,
      account_details,
      image_url,
      tags,
      founder_id,
      mission_statement,
      problem_solution,
      founder_story,
      target_market,
      traction,
      use_of_funds,
      milestones,
      team_profiles,
      awards,
    },
  ]);

  if (dbError) {
    console.error('Supabase insert error:', dbError.message);
    return new Response(JSON.stringify({ error: dbError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
