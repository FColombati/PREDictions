"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registraUtente, type RegisterState } from "@/lib/actions/auth";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registraUtente, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/login");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-text-muted" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          minLength={3}
          className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-text outline-none focus:border-accent"
        />
      </div>
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
          minLength={6}
          className="w-full rounded border border-border bg-panel-2 px-3 py-2 text-text outline-none focus:border-accent"
        />
      </div>

      {state.error && <p className="text-sm text-ember">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="panel-cut-sm w-full bg-accent py-2.5 font-display font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {isPending ? "Creazione account..." : "Registrati"}
      </button>
    </form>
  );
}
