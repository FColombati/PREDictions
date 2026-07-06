import Link from "next/link";
import { RegisterForm } from "./register-form";
import { DiscordButton } from "@/components/discord-button";

export default function RegistratiPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">Crea account</h1>
      <p className="mb-8 text-text-muted">Registrati per iniziare a pronosticare.</p>

      <div className="panel-cut space-y-5 p-6">
        <DiscordButton />

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border" />
          oppure
          <span className="h-px flex-1 bg-border" />
        </div>

        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="text-accent-2 hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
}
