'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';

interface Props {
  founderId: string;
  slug: string; // Added startupId prop
}

export default function EditButton({ founderId, slug }: Props) {
  const { data: session } = useSession();
  const router = useRouter(); // Added router hook
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", session.user.email)
          .single();

        if (error) {
          console.error("❌ Error fetching profile:", error.message);
          setLoading(false);
          return;
        }

        if (profile?.id === founderId) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("❌ Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [session?.user?.email, founderId]);

  const handleEdit = () => {
    router.push(`/create?edit=${slug}`);
  };

  // Show nothing while loading or if user is not the owner
  if (loading || !isOwner) return null;

  return (
    <button
      onClick={handleEdit}
      className="bg-gradient-to-br from-yellow-300 via-pink-300 to-yellow-400 text-black font-semibold px-4 py-2 rounded-xl shadow-md hover:scale-105 transition-transform duration-200 ease-in-out hover:shadow-lg"
    >
      Edit
    </button>
  );
}