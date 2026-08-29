export type SquadraSnapshot = { id: string; nome: string; colore: string | null };
export type GiocatoreSnapshot = { id: string; nome: string; nickname: string };
export type RosaSnapshot = {
  teamA: SquadraSnapshot;
  teamB: SquadraSnapshot;
  giocatori: GiocatoreSnapshot[];
};

type MatchConSquadreLive = {
  rosaSnapshot: unknown;
  teamA: { id: string; nome: string; colore: string | null; players?: { id: string; nome: string; nickname: string }[] } | null;
  teamB: { id: string; nome: string; colore: string | null; players?: { id: string; nome: string; nickname: string }[] } | null;
};

function leggiSnapshot(match: MatchConSquadreLive): RosaSnapshot | null {
  const snap = match.rosaSnapshot as RosaSnapshot | null;
  if (snap && snap.teamA && snap.teamB) return snap;
  return null;
}

/** Costruisce la fotografia da salvare su Match al momento della creazione. */
export function costruisciRosaSnapshot(
  teamA: { id: string; nome: string; colore: string | null; players: { id: string; nome: string; nickname: string }[] },
  teamB: { id: string; nome: string; colore: string | null; players: { id: string; nome: string; nickname: string }[] }
): RosaSnapshot {
  return {
    teamA: { id: teamA.id, nome: teamA.nome, colore: teamA.colore },
    teamB: { id: teamB.id, nome: teamB.nome, colore: teamB.colore },
    giocatori: [...teamA.players, ...teamB.players].map((p) => ({ id: p.id, nome: p.nome, nickname: p.nickname })),
  };
}

/** Squadra A da mostrare: fotografia se presente, altrimenti la squadra live (partite vecchie), altrimenti un placeholder. */
export function squadraA(match: MatchConSquadreLive): SquadraSnapshot {
  const snap = leggiSnapshot(match);
  if (snap) return snap.teamA;
  if (match.teamA) return { id: match.teamA.id, nome: match.teamA.nome, colore: match.teamA.colore };
  return { id: "", nome: "Squadra eliminata", colore: null };
}

export function squadraB(match: MatchConSquadreLive): SquadraSnapshot {
  const snap = leggiSnapshot(match);
  if (snap) return snap.teamB;
  if (match.teamB) return { id: match.teamB.id, nome: match.teamB.nome, colore: match.teamB.colore };
  return { id: "", nome: "Squadra eliminata", colore: null };
}

/** Tutti i giocatori delle due squadre coinvolte, per i menu a tendina "chi ha fatto First Blood" ecc. */
export function giocatoriPartita(match: MatchConSquadreLive): GiocatoreSnapshot[] {
  const snap = leggiSnapshot(match);
  if (snap) return snap.giocatori;
  return [...(match.teamA?.players ?? []), ...(match.teamB?.players ?? [])].map((p) => ({
    id: p.id,
    nome: p.nome,
    nickname: p.nickname,
  }));
}
