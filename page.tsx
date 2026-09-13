import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("plan, usage_count")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return <Dashboard user={user} initialProfile={profile} />;
}
