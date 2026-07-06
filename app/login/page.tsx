import Link from "next/link";
import { LoginForm } from "./login-form";
import { DiscordButton } from "@/components/discord-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Bentornato</h1>
      <p className="mb-8 text-text-muted">Accedi per compilare le tue schedine.</p>

      <div className="panel-cut space-y-5 p-6">
        <DiscordButton callbackUrl={callbackUrl} />

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border" />
          oppure
          <span className="h-px flex-1 bg-border" />
        </div>

        <LoginForm callbackUrl={callbackUrl} />
      </div>

      <p className="mt-6 text-center text-sm text-text-muted">
        Non hai un account?{" "}
        <Link href="/registrati" className="text-accent-2 hover:underline">
          Registrati
        </Link>
      </p>
    </div>
  );
}
