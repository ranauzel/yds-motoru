"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.replace("/giris");
        router.refresh();
      }}
      className="min-h-12 rounded-full border border-border bg-surface px-4 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      Çıkış
    </button>
  );
}
