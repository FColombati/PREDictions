type TeamRef = { id: string; nome: string };
type PlayerRef = { id: string; nome: string; nickname: string };

export function etichettaRisposta(
  tipo: string,
  risposta: string,
  teamA: TeamRef,
  teamB: TeamRef,
  giocatori: PlayerRef[]
): string {
  if (tipo === "SQUADRA") {
    if (risposta === teamA.id) return teamA.nome;
    if (risposta === teamB.id) return teamB.nome;
    return risposta;
  }
  if (tipo === "GIOCATORE") {
    const p = giocatori.find((g) => g.id === risposta);
    return p ? `${p.nome} (${p.nickname})` : risposta;
  }
  return risposta;
}

export function etichettaRispostaTorneo(
  tipo: string,
  risposta: string,
  teams: TeamRef[],
  giocatori: PlayerRef[]
): string {
  if (tipo === "SQUADRA") {
    const t = teams.find((t) => t.id === risposta);
    return t ? t.nome : risposta;
  }
  if (tipo === "GIOCATORE") {
    const p = giocatori.find((g) => g.id === risposta);
    return p ? `${p.nome} (${p.nickname})` : risposta;
  }
  return risposta;
}
