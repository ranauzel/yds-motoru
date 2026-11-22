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
      className="rounded-full border border-border bg-surface px-4 py-2 text-sm"
    >
      Çıkış
    </button>
  );
}
