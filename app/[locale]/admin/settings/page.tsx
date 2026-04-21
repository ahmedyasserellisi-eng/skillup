"use client";

import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminSettingsPage() {
  async function logout() {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/ar/admin/login";
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm opacity-75">
        Admin settings (placeholder). We’ll add: social links, contact email, YouTube channel, etc.
      </p>

      <Button variant="destructive" onClick={logout} className="w-fit">
        Logout
      </Button>
    </div>
  );
}