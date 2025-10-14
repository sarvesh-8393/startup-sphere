// app/api/update/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer'; // Using nodemailer for email sending

export const config = {
  api: {
    bodyParser: false, // allow multipart/form-data
  },
};

export async function PUT(req: Request) {
  try {
    

    const formData = await req.formData();
    

 

   
  

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string ; // Handle if not provided
    const short_description = formData.get('short_description') as string;
    const description = formData.get('description') as string;
    const website_url = formData.get('website_url') as string;
    const funding_stage = formData.get('funding_stage') as string;
    const account_details = formData.get('account_details') as string;
    const image_url = formData.get('image_url') as string;
    const tagsString = formData.get('tags') as string; // Get as string
    let founder_id = formData.get('founder_id') as string; // Allow null type
    const mission_statement = formData.get('mission_statement') as string;
    const problem_solution = formData.get('problem_solution') as string;
    const founder_story = formData.get('founder_story') as string;
    const target_market = formData.get('target_market') as string;
    const traction = formData.get('traction') as string;
    const use_of_funds = formData.get('use_of_funds') as string;
    const milestones = formData.get('milestones') as string;
    const team_profiles = formData.get('team_profiles') as string;
    const awards = formData.get('awards') as string;
    const follower_message = formData.get('follower_message') as string;

    // Parse tags into an array (assuming comma-separated string from form)
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];

    // Validate founder_id: Ensure it's a valid UUID string or null
  
    // If empty string, treat as null
    if (founder_id === '') {
      founder_id = "";
    }

    console.log('Parsed form data fields received:', {
    
      slug,
     
      founder_id,
     
    });

    // Step 1: Fetch existing data
    const { data: existing, error: fetchErr } = await supabase
      .from('startups')
      .select('*')
      .eq('slug', slug)
      .single();

    if (fetchErr) {
      console.error('Error fetching existing startup:', fetchErr);
    }

    if (fetchErr || !existing) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }


    // Step 2: Compare fields
    const changes: string[] = [];
    if (existing.name !== name) changes.push(`Name changed from "${existing.name}" to "${name}"`);
    // Only compare slug if provided and different
    const isSlugChanged = slug && existing.slug !== slug;
    if (isSlugChanged) changes.push(`Slug changed from "${existing.slug}" to "${slug}"`);
    if (existing.short_description !== short_description) changes.push(`Short description changed.`);
    if (existing.description !== description) changes.push(`Description changed.`);
    if (existing.website_url !== website_url) changes.push(`Website URL changed from "${existing.website_url}" to "${website_url}"`);
    if (existing.funding_stage !== funding_stage) changes.push(`Funding stage changed from "${existing.funding_stage}" to "${funding_stage}"`);
    if (existing.account_details !== account_details) changes.push(`Account details changed.`);
    if (existing.image_url !== image_url) changes.push(`Image URL changed.`);
    // For tags, compare arrays
    if (JSON.stringify(existing.tags) !== JSON.stringify(tags)) changes.push(`Tags changed.`);
    // For founder_id, compare only if provided and different (handle null vs empty)
    const isFounderIdChanged = founder_id !== null && existing.founder_id !== founder_id;
    if (isFounderIdChanged) changes.push(`Founder ID changed from "${existing.founder_id}" to "${founder_id}"`);
    if (existing.mission_statement !== mission_statement) changes.push(`Mission statement changed.`);
    if (existing.problem_solution !== problem_solution) changes.push(`Problem/solution changed.`);
    if (existing.founder_story !== founder_story) changes.push(`Founder story changed.`);
    if (existing.target_market !== target_market) changes.push(`Target market changed.`);
    if (existing.traction !== traction) changes.push(`Traction changed.`);
    if (existing.use_of_funds !== use_of_funds) changes.push(`Use of funds changed.`);
    if (existing.milestones !== milestones) changes.push(`Milestones changed.`);
    if (existing.team_profiles !== team_profiles) changes.push(`Team profiles changed.`);
    if (existing.awards !== awards) changes.push(`Awards changed.`);



    if (changes.length === 0 && !follower_message) {
      console.log('No changes detected and no custom message; returning early.');
      return NextResponse.json({ message: 'No changes made' }, { status: 200 });
    }

  

    // Step 3: Update the startup (include fields only if changed/valid)
    const updateData: Record<string, unknown> = {
      name,
      short_description,
      description,
      website_url,
      funding_stage,
      account_details,
      image_url,
      tags, // Use the parsed array
      mission_statement,
      problem_solution,
      founder_story,
      target_market,
      traction,
      use_of_funds,
      milestones,
      team_profiles,
      awards,
    };

 

    const { error: updateErr } = await supabase
      .from('startups')
      .update(updateData)
      .eq('slug', slug);

    if (updateErr) {
      console.error('Error updating startup:', updateErr);
      return NextResponse.json({ message: 'Update failed', error: updateErr.message }, { status: 500 });
    }

    console.log('Startup updated successfully');

    // Step 4: Get follower emails
    const { data: followers, error: followersErr } = await supabase
      .from('follows')
      .select('email')
      .eq('slug', slug);

    if (followersErr) {
      console.error('Error fetching followers:', followersErr);
      return NextResponse.json({ message: 'Failed to fetch followers', error: followersErr.message }, { status: 500 });
    }

    const emails = followers?.map((f) => f.email) || [];
    console.log(`Found ${emails.length} follower(s) to notify.`);

    // Step 5: Send emails
    if (emails.length > 0) {
      for (const email of emails) {
        try {
          console.log(`Sending notification email to ${email}`);
          const customMessage = follower_message ? `<p style="font-size: 16px; font-weight: bold;">${follower_message}</p>` : '';
          const changesHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
              <h2 style="color: #e91e63;">🚀 A Startup You Follow Was Updated!</h2>
              <p style="font-size: 16px;">Hey there 👋,</p>
              <p style="font-size: 16px;">
                One of the startups you follow just got updated. Here are the changes:
              </p>
              ${customMessage}
              <ul style="padding-left: 20px; font-size: 15px;">
                ${changes.map(change => `
                  <li style="margin-bottom: 8px; background-color: #fff3cd; padding: 8px 12px; border-left: 4px solid #ffeb3b; border-radius: 4px;">
                    <span style="color: #d81b60;">${change}</span>
                  </li>
                `).join('')}
              </ul>
              <p style="font-size: 14px; color: #777;">You’re receiving this email because you follow this startup on Startup Finder.</p>
            </div>
          `;

          await sendEmail(email, changesHtml);

          console.log(`Email sent to ${email}`);
        } catch (e) {
          console.error(`Failed to send email to ${email}:`, e);
        }
      }
    }


    return NextResponse.json({ message: 'Startup updated and followers notified.' });
  } catch (err) {
    console.error('Error updating startup:', err);
    return NextResponse.json({ message: 'Server error', error: (err as Error).message }, { status: 500 });
  }
}

async function sendEmail(to: string, changesHtml: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pritam63633@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: '"Startup Finder" <pritam63633@gmail.com>',
    to,
    subject: 'A startup you follow was updated!',
    html: changesHtml,
  });
}
