# PredIction — Pronostici Tornei ARAM Predecessor

MVP full-stack per la piattaforma di pronostici descritta nel PRD: gli utenti
compilano schedine prima del Prediction Lock, l'admin inserisce i risultati
reali e il sistema calcola automaticamente i punti e la classifica.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Prisma 7** + **PostgreSQL** (con driver adapter `@prisma/adapter-pg`)
- **NextAuth v5** — Credenziali (email/password) + **Discord OAuth**, sessione JWT, ruoli ADMIN/USER
- **Tailwind CSS v4** — tema dark ispirato a Predecessor (pannelli con angoli
  tagliati, countdown live per il Prediction Lock, stato attivo immediato
  sulle risposte della schedina)

## Setup locale

1. **Installa le dipendenze**

   ```bash
   npm install
   ```

2. **Configura il database**

   Serve un database PostgreSQL (locale, Docker, o un servizio come Neon/
   Supabase/Railway). Copia `.env.example` in `.env`:

   ```bash
   cp .env.example .env
   ```

   e imposta `DATABASE_URL`. Genera anche un `AUTH_SECRET` reale:

   ```bash
   openssl rand -base64 32
   ```

3. **(Opzionale ma consigliato) Login con Discord**

   1. Vai su https://discord.com/developers/applications → **New Application**
   2. Sezione **OAuth2** → copia **Client ID** e **Client Secret** in `.env`:
      ```
      AUTH_DISCORD_ID="..."
      AUTH_DISCORD_SECRET="..."
      ```
   3. Sempre in **OAuth2 → Redirects**, aggiungi:
      ```
      http://localhost:3000/api/auth/callback/discord
      ```
      (in produzione: `https://tuodominio.it/api/auth/callback/discord`)

   Se non configuri Discord, il bottone "Accedi con Discord" comparirà
   comunque ma darà errore al click: basta non usarlo, il login classico con
   email/password continua a funzionare senza Discord.

4. **Genera il client Prisma e crea le tabelle**

   > ⚠️ Prisma 7 ha cambiato molto rispetto alle versioni precedenti: l'URL
   > del database ora vive in `prisma.config.ts` (non più in `schema.prisma`)
   > e il client richiede un "driver adapter" esplicito. È già tutto
   > configurato in questo progetto — ti basta eseguire i comandi.

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Popola il database con dati di esempio**

   ```bash
   npx prisma db seed
   ```

   Crea:
   - un admin → `admin@prediction.local` / `admin1234`
   - un utente demo → `demo@prediction.local` / `user1234`
   - un torneo "ARAM Cup Stagione 1" con 2 squadre, 4 giocatori, 1 partita
     con schedina già pronta (Prediction Lock tra 1 ora)

   **Per usare le funzioni admin, accedi con `admin@prediction.local` /
   `admin1234`** (non con un account creato tramite il form di registrazione
   normale, che crea sempre utenti standard).

   Se hai già registrato un account e vuoi renderlo admin senza usare quello
   seedato:

   ```bash
   npx tsx prisma/make-admin.ts tuaemail@esempio.com
   ```

6. **Avvia il server di sviluppo**

   ```bash
   npm run dev
   ```

   Vai su `http://localhost:3000`.

## Troubleshooting

- **"The datasource property `url` is no longer supported"** → stai
  guardando una versione vecchia del progetto. In questa versione l'URL è in
  `prisma.config.ts`, `schema.prisma` contiene solo `provider = "postgresql"`.
- **Da admin non riesco a creare tornei/squadre/schedine** → quasi sempre
  significa che l'utente con cui hai fatto login ha `ruolo = USER`. Usa
  l'account seedato (`admin@prediction.local`) oppure lancia
  `npx tsx prisma/make-admin.ts <tuaemail>`.
- **Errore Prisma sull'adapter mancante** → assicurati di aver fatto
  `npm install` (installa anche `pg` e `@prisma/adapter-pg`) e che
  `DATABASE_URL` sia impostato in `.env`.

## Come mappa il PRD

| Sezione PRD | Dove si trova nel codice |
|---|---|
| 3.1 Creazione tornei | `/admin/tornei`, `lib/actions/admin.ts` (`creaTorneo`) |
| 3.2 / 3.3 Squadre e giocatori | `/admin/tornei/[id]` (form inline) |
| 3.4 Gestione partite | `/admin/tornei/[id]` → crea partita, `/admin/partite/[id]` → gestione |
| 4. Schedina (5 tipi di domanda) | `PredictionQuestion.tipo` enum, form dinamico in `app/partite/[matchId]/schedina-form.tsx` (stato attivo live su ogni selezione) |
| 5. Sistema punteggio configurabile | campo `punti` su ogni domanda |
| 6. Prediction Lock | `proxy.ts` (ex middleware) + controllo server-side in `inviaSchedina`, countdown live in `components/countdown-lock.tsx` |
| 7. Inserimento risultati | `/admin/partite/[id]` → form risultati → `MatchResult` |
| 8. Calcolo automatico punteggi | `lib/scoring.ts` (`calcolaPunteggiPartita`) |
| 9. Profilo utente + statistiche | `/profilo` |
| 10. Storico schedine | `/storico` |
| 11. Classifica torneo (pubblica) | `/tornei/[id]/classifica` |
| 12. Dashboard amministratore | `/admin` |
| 14. Schema database | `prisma/schema.prisma`, fedele 1:1 alle entità del PRD |

Autenticazione: oltre a email/password, gli utenti possono registrarsi/accedere
con **Discord** — al primo login viene creato automaticamente un account
collegato (via email) con ruolo USER.

## Cosa manca per andare oltre l'MVP

Il PRD stesso elenca le evoluzioni future (sezione 16): notifiche, pronostici
"Jolly", badge/achievement, classifiche stagionali, export CSV/PDF, API
risultati automatici, supporto multi-gioco.

Altre cose da considerare prima di andare in produzione:
- upload reale di immagini (loghi/avatar) invece di URL testuali
- validazione più granulare lato server sui form admin
- test automatici sul calcolo punteggi
- rate limiting su login/registrazione
- una pagina admin per cambiare il ruolo di un utente dall'interfaccia
  (oggi si fa solo via `prisma/make-admin.ts`)
