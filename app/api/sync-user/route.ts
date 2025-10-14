import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if profile exists
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  if (profile) {
    console.log("Existing profile found, checking avatar_url. Session image:", user.image);
    // Update avatar_url if not set or different from session
    const { data: existingProfile, error: fetchErr } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", profile.id)
      .single();

    if (fetchErr) {
      console.error("Error fetching existing profile:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    console.log("Existing avatar_url:", existingProfile.avatar_url);

    if (!existingProfile.avatar_url || existingProfile.avatar_url !== user.image) {
      console.log("Updating avatar_url to:", user.image || "");
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: user.image || "" })
        .eq("id", profile.id);

      if (updateErr) {
        console.error("Error updating avatar_url:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      console.log("Avatar_url updated successfully");
    } else {
      console.log("Avatar_url is already up to date");
    }

    return NextResponse.json({ message: "Profile updated" }, { status: 200 });
  }

  // If not, insert user into profiles table
  const { error: insertErr } = await supabase.from("profiles").insert([
    {
      email: user.email,
      full_name: user.name || "",
      avatar_url: user.image || "",
    },
  ]);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: "User synced to DB" });
}
