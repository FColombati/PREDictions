import { creaTorneo } from "@/lib/actions/admin";

export default function NuovoTorneoPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Nuovo torneo</h1>

      <form action={creaTorneo} className="panel-cut space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Nome</label>
          <input
            name="nome"
            required
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Descrizione</label>
          <textarea
            name="descrizione"
            rows={3}
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-muted">Logo (URL, opzionale)</label>
          <input
            name="logo"
            className="w-full rounded border border-border bg-panel-2 px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Data inizio</label>
            <input
              type="date"
              name="dataInizio"
              required
              className="w-full rounded border border-border bg-panel-2 px-3 py-2 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Data fine</label>
            <input
              type="date"
              name="dataFine"
              required
              className="w-full rounded border border-border bg-panel-2 px-3 py-2 outline-none focus:border-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          className="panel-cut-sm w-full bg-accent py-2.5 font-display font-semibold text-white transition-colors hover:bg-accent-2"
        >
          Crea torneo
        </button>
      </form>
    </div>
  );
}
