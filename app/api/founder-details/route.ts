import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_name,
      email,
      avatar_url,
      role,
      location,
      experience_years,
      previous_startups,
      education,
      specialties,
      funding_raised,
      origin_story,
      career_path,
      vision,
      linkedin_url,
      twitter_url,
      github_url,
      medium_url,
      personal_website,
      contact_email,
      awards,
      press_links,
      featured_projects,
      industry_tags,
      stage_tags,
      interest_tags,
    } = body;

    // Validate required fields
    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check existing profile' },
        { status: 500 }
      );
    }

    const profileData = {
      full_name,
      email,
      avatar_url,
      role,
      location,
      experience_years: experience_years || 0,
      previous_startups: previous_startups || 0,
      education,
      specialties: specialties || [],
      funding_raised,
      origin_story,
      career_path,
      vision,
      linkedin_url,
      twitter_url,
      github_url,
      medium_url,
      personal_website,
      contact_email,
      awards: awards || [],
      press_links: press_links || [],
      featured_projects: featured_projects || [],
      industry_tags: industry_tags || [],
      stage_tags: stage_tags || [],
      interest_tags: interest_tags || [],
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();
    } else {
      // Create new profile
      result = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving profile:', result.error);
      console.error('Full error details:', JSON.stringify(result.error, null, 2));
      return NextResponse.json(
        { error: 'Failed to save profile', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Profile saved successfully', profile: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in founder-details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { error: 'Email or ID parameter is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('profiles')
      .select('*');

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('email', email);
    }

    const { data: profile, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { profile: profile || null },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in founder-details GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
