"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (res?.error) {
        setError("Email o password non corrette");
        return;
      }
      router.push(callbackUrl || "/dashboard");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-text-muted" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-text outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-text-muted" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-text outline-none focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-ember">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="panel-cut-sm w-full bg-accent py-2.5 font-display font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {isPending ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
}
