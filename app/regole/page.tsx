import Link from "next/link";
import { RARITA_INFO } from "@/components/achievements/rarity";

const CATEGORIE = [
  { icona: "🎟️", nome: "Partecipazione", descr: "Quante schedine invii, a quanti tornei partecipi." },
  { icona: "🎯", nome: "Accuratezza", descr: "Quanto spesso indovini i tuoi pronostici." },
  { icona: "🔥", nome: "Streak", descr: "Vittorie o sconfitte consecutive di fila." },
  { icona: "🏆", nome: "Torneo", descr: "Legati a un torneo specifico o alla classifica." },
  { icona: "👥", nome: "Community", descr: "Legati alla partecipazione generale al sito." },
  { icona: "📅", nome: "Stagionale", descr: "Disponibili solo per un periodo limitato." },
  { icona: "❓", nome: "Segreto", descr: "Restano nascosti finché non li sblocchi." },
];

const RICOMPENSE = [
  { icona: "🏅", nome: "Badge", descr: "Piccola icona da esporre sul profilo." },
  { icona: "🏷️", nome: "Titolo", descr: "Testo colorato sotto il tuo nome." },
  { icona: "🖼️", nome: "Cornice avatar", descr: "Bordo decorativo attorno alla tua foto." },
  { icona: "🌌", nome: "Sfondo profilo", descr: "Sfondo personalizzato dell'intestazione." },
  { icona: "🎨", nome: "Tema profilo", descr: "Cambia i colori di bottoni e accenti." },
  { icona: "✨", nome: "Decorazione nome", descr: "Effetto speciale sul tuo username." },
];

const SEZIONI = [
  { id: "categorie", label: "Categorie" },
  { id: "rarita", label: "Rarità" },
  { id: "vinta-persa", label: "Schedina vinta o persa" },
  { id: "streak", label: "Streak" },
  { id: "punteggio", label: "Punteggio" },
  { id: "torneo", label: "Achievement per torneo" },
  { id: "nascosti", label: "Achievement nascosti" },
  { id: "stagionali", label: "Achievement stagionali" },
  { id: "annullate", label: "Partite annullate" },
  { id: "ricompense", label: "Ricompense" },
];

export default function RegolePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-bold">
        📖 <span className="text-gradient">Regole & Achievement</span>
      </h1>
      <p className="mb-8 text-sm text-text-muted">
        Come funzionano le condizioni di sblocco, spiegate in parole semplici.
      </p>

      <div className="panel-cut mb-10 flex flex-wrap gap-x-5 gap-y-2 p-5">
        {SEZIONI.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-sm text-text-muted hover:text-accent-2">
            {s.label}
          </a>
        ))}
      </div>

      <section id="categorie" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">🗂️ Categorie di achievement</h2>
        <p className="mb-4 text-sm text-text-muted">
          Ogni achievement appartiene a una categoria, visibile anche nella{" "}
          <Link href="/achievements/lista" className="text-accent-2 hover:underline">lista achievement</Link>:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIE.map((c) => (
            <div key={c.nome} className="rounded-lg border border-border bg-panel-2 p-4">
              <span className="mb-1 block text-2xl">{c.icona}</span>
              <p className="text-sm font-semibold">{c.nome}</p>
              <p className="text-xs text-text-muted">{c.descr}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="rarita" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">💎 Rarità</h2>
        <p className="mb-4 text-sm text-text-muted">
          Indica quanto è raro/prestigioso un achievement — non cambia come si sblocca, solo il suo &quot;peso&quot; visivo.
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(RARITA_INFO) as (keyof typeof RARITA_INFO)[]).map((key) => {
            const info = RARITA_INFO[key];
            return (
              <span
                key={key}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${info.bg} ${info.bordo}`}
                style={{ color: info.colore }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: info.colore }} />
                {info.label}
              </span>
            );
          })}
        </div>
      </section>

      <section id="vinta-persa" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">✅❌ Quando una schedina è vinta o persa</h2>
        <p className="mb-3 text-sm text-text-muted">Una schedina (di partita o di torneo) si considera:</p>
        <div className="mb-3 rounded-lg border-l-2 border-accent bg-panel-2 p-4 text-sm text-text-muted">
          <span className="font-bold text-verdant">VINTA</span> se hai indovinato <b className="text-text">più della metà</b> delle domande.
          <br />
          <span className="font-bold text-ember">PERSA</span> se hai indovinato la metà o meno.
        </div>
        <div className="rounded-lg border-l-2 border-accent bg-panel-2 p-4 text-sm text-text-muted">
          <b className="text-text">Esempio:</b> schedina con 4 domande, ne indovini 3 →{" "}
          <span className="font-bold text-verdant">vinta</span> (75%).
          <br />
          Stessa schedina, ne indovini 2 su 4 → <span className="font-bold text-ember">persa</span> (50%, non supera la metà).
        </div>
      </section>

      <section id="streak" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">🔥 Cos&apos;è la &quot;streak&quot;</h2>
        <p className="mb-3 text-sm text-text-muted">
          La streak è la tua <b className="text-text">striscia di schedine vinte (o perse) una dopo l&apos;altra</b>, in ordine di data.
        </p>
        <div className="rounded-lg border-l-2 border-accent bg-panel-2 p-4 text-sm text-text-muted">
          <b className="text-text">Streak di vittorie:</b> ogni volta che vinci una schedina, la striscia sale di 1. Appena perdi una
          schedina, la striscia torna a 0 e riparte da capo.
          <br />
          <br />
          <b className="text-text">Streak di sconfitte:</b> stesso meccanismo, ma al contrario — sale ad ogni sconfitta, si azzera
          alla prima vittoria.
        </div>
        <p className="mt-3 text-sm text-text-muted">
          Il tuo profilo mostra sempre la streak <b className="text-text">attuale</b> e quella{" "}
          <b className="text-text">record</b> (la più lunga mai raggiunta).
        </p>
      </section>

      <section id="punteggio" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">🧮 Punteggio: singola schedina vs totale carriera</h2>
        <h3 className="mb-1 font-semibold text-accent-2">Punteggio di una schedina</h3>
        <p className="mb-4 text-sm text-text-muted">
          Ogni domanda ha un suo valore in punti. Rispondendo correttamente incassi quei punti; il totale della schedina è la somma
          di tutte le domande indovinate.
        </p>
        <h3 className="mb-1 font-semibold text-accent-2">Punti totali (carriera)</h3>
        <p className="text-sm text-text-muted">
          È la somma di tutti i punti che hai accumulato in ogni schedina che hai inviato, da quando ti sei iscritto.
        </p>
      </section>

      <section id="torneo" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">🏆 Achievement legati a un singolo torneo</h2>
        <p className="mb-2 text-sm text-text-muted">
          Alcuni achievement sono agganciati a <b className="text-text">un torneo specifico</b> (es. &quot;Partecipante Summer
          League&quot;). In quel caso, tutto ciò che serve per sbloccarli — schedine inviate, vittorie, streak, punti — viene
          contato <b className="text-text">solo dentro quel torneo</b>, non su tutta la tua carriera.
        </p>
        <p className="text-sm text-text-muted">
          Se invece un achievement non specifica nessun torneo, conta sempre sull&apos;intera tua storia sul sito.
        </p>
      </section>

      <section id="nascosti" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">❓ Achievement nascosti</h2>
        <p className="mb-3 text-sm text-text-muted">
          Alcuni achievement sono segreti: finché non li sblocchi, li vedi così nella tua galleria:
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel-2 px-4 py-2 opacity-70">
          <span className="text-xl grayscale">❓</span>
          <b>???</b>
          <span className="text-xs text-text-muted">— Achievement segreto</span>
        </div>
        <p className="mt-3 text-sm text-text-muted">
          Appena li sblocchi, si rivelano con nome, descrizione e ricompensa — proprio come una sorpresa.
        </p>
      </section>

      <section id="stagionali" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">📅 Achievement stagionali</h2>
        <p className="text-sm text-text-muted">
          Alcuni achievement sono disponibili solo per un periodo limitato (es. legati a un evento speciale). Se non li sblocchi
          entro la finestra di tempo, non saranno più ottenibili — restano comunque visibili a chi li ha già presi.
        </p>
      </section>

      <section id="annullate" className="panel-cut mb-6 scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">🚫 Partite annullate</h2>
        <p className="mb-2 text-sm text-text-muted">
          Se una partita viene annullata (o decisa a tavolino), tutte le domande della sua schedina vengono azzerate a 0 punti e{" "}
          <b className="text-text">non</b> influenzano la tua streak o la tua accuratezza — è come se quella partita non fosse mai
          esistita per le tue statistiche.
        </p>
        <p className="text-sm text-text-muted">
          Fa eccezione l&apos;eventuale domanda &quot;la partita verrà annullata?&quot;, se presente in quella schedina: quella
          viene comunque valutata normalmente, perché l&apos;hai davvero pronosticata.
        </p>
      </section>

      <section id="ricompense" className="panel-cut scroll-mt-24 p-6 sm:p-7">
        <h2 className="mb-3 font-display text-xl font-bold">🎁 Ricompense cosmetiche</h2>
        <p className="mb-4 text-sm text-text-muted">
          Ogni achievement può assegnarti una o più ricompense da mostrare con orgoglio sul tuo profilo:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RICOMPENSE.map((r) => (
            <div key={r.nome} className="rounded-lg border border-border bg-panel-2 p-4">
              <span className="mb-1 block text-2xl">{r.icona}</span>
              <p className="text-sm font-semibold">{r.nome}</p>
              <p className="text-xs text-text-muted">{r.descr}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-text-muted">Puoi scegliere quali indossare dal tuo profilo, in qualsiasi momento.</p>
      </section>
    </div>
  );
}
