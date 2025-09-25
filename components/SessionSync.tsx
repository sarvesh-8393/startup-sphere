'use client';

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const SessionSync = () => {
  const { data: session, status } = useSession();
  const didSync = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !didSync.current) {
      didSync.current = true;
      console.log("✅ Syncing user to DB...");

      fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: session.user.email,
          startup_id: null, // or pass startup ID if needed here
        }),
      })
        .then(res => res.json())
        .then(data => console.log("🟢 Sync success:", data))
        .catch(err => console.error("🔴 Sync error:", err));
    }
  }, [status, session]);

  return null;
};

export default SessionSync;
