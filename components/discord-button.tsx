"use client";

import { signIn } from "next-auth/react";

export function DiscordButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("discord", { callbackUrl: callbackUrl || "/dashboard" })}
      className="panel-cut-sm flex w-full items-center justify-center gap-2 border border-border bg-[#5865F2]/10 py-2.5 font-display font-semibold text-[#c9cdff] transition-colors hover:bg-[#5865F2]/20"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.211.375-.457.882-.63 1.283a18.27 18.27 0 0 0-5.516 0A12.6 12.6 0 0 0 9.108 3a19.79 19.79 0 0 0-4.432 1.37C1.653 8.72.978 12.938 1.315 17.099a19.9 19.9 0 0 0 5.99 3.03 14.6 14.6 0 0 0 1.283-2.075 12.9 12.9 0 0 1-2.02-.968c.17-.124.336-.253.497-.386 3.895 1.79 8.116 1.79 11.966 0 .163.133.33.262.497.386-.639.383-1.32.71-2.02.969a14.5 14.5 0 0 0 1.283 2.074 19.86 19.86 0 0 0 5.993-3.03c.396-4.833-.676-9.014-2.867-12.73ZM8.68 14.552c-1.169 0-2.128-1.07-2.128-2.386 0-1.315.94-2.386 2.128-2.386 1.196 0 2.146 1.08 2.128 2.386 0 1.315-.94 2.386-2.128 2.386Zm6.64 0c-1.17 0-2.128-1.07-2.128-2.386 0-1.315.94-2.386 2.128-2.386 1.196 0 2.146 1.08 2.128 2.386 0 1.315-.932 2.386-2.128 2.386Z" />
      </svg>
      Accedi con Discord
    </button>
  );
}
