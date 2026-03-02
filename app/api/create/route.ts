// app/api/create/route.ts
// Updated to generate and store embeddings when a startup is created

import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmbedding, buildStartupText } from '@/lib/embedding';

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

  const name               = getField('name');
  const short_description  = getField('short_description');
  const description        = getField('description');
  const website_url        = getField('website_url');
  const funding_stage      = getField('funding_stage');
  const account_details    = getField('account_details');
  const image_url_direct   = getField('image_url');
  const image_file = formData.get('image_file');
  const mission_statement  = getField('mission_statement');
  const problem_solution   = getField('problem_solution');
  const target_market      = getField('target_market');
  const tags = getField('tags').split(',').map(tag => tag.trim()).filter(Boolean);

  const slug = `${name.replace(/\s+/g, '-').toLowerCase()}-${uuidv4()}`;
  let image_url = image_url_direct;

  // If user uploaded a file, upload it to Supabase Storage and use that URL.
  if (image_file instanceof File && image_file.size > 0) {
    const safeFileName = image_file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `startups/${slug}-${Date.now()}-${safeFileName}`;
    const fileBuffer = Buffer.from(await image_file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('startup-images')
      .upload(filePath, fileBuffer, {
        contentType: image_file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError.message);
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('startup-images')
      .getPublicUrl(filePath);

    image_url = publicUrlData.publicUrl;
  }

  // --- Step 1: Insert startup into database ---
  const { data: insertedStartup, error: dbError } = await supabase
    .from('startups')
    .insert([{
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
      target_market,
    }])
    .select('id')
    .single();

  if (dbError || !insertedStartup) {
    console.error('Supabase insert error:', dbError?.message);
    return new Response(JSON.stringify({ error: dbError?.message }), { status: 500 });
  }

  // --- Step 2: Generate embedding for this startup ---
  // We do this AFTER insert so a DB failure doesn't block the startup from being created.
  // If embedding fails, the startup still exists — it just won't appear in embedding-based recommendations
  // until the embedding is generated (you can add a backfill job later).
  try {
    const textToEmbed = buildStartupText({
      name,
      short_description,
      description,
      mission_statement,
      problem_solution,
      target_market,
      tags,
    });

    const embedding = await getEmbedding(textToEmbed);

    // --- Step 3: Store the embedding vector in the startups table ---
    const { error: embedError } = await supabase
      .from('startups')
      .update({ embedding })
      .eq('id', insertedStartup.id);

    if (embedError) {
      // Non-fatal: log it but don't fail the request
      console.error('Failed to store embedding:', embedError.message);
    }
  } catch (embedErr) {
    // Non-fatal: embedding generation failed (e.g. API key missing, rate limit)
    // Startup is still created successfully
    console.error('Embedding generation error:', embedErr);
  }

  return new Response(JSON.stringify({ success: true, slug }), { status: 200 });
}