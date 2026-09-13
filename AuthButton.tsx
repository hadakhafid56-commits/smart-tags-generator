"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function AuthButton({ user }: { user: User | null }) {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-mist hidden sm:inline">{user.email}</span>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-mist hover:text-paper hover:border-danger/50 transition-colors"
        >
          <LogOut size={14} /> خروج
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="rounded-md bg-paper px-4 py-2 text-sm font-medium text-ink hover:opacity-90 transition-opacity"
    >
      تسجيل الدخول عبر Google
    </button>
  );
}
