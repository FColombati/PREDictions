export function cosmeticClassName(id: string) {
  return `cosmetic-${id}`;
}

/**
 * Inietta un tag <style> con le proprietà CSS del cosmetic (avvolte nella
 * classe scoperta `.cosmetic-{id}`) più, se presente, del CSS avanzato
 * grezzo (tipicamente uno o più `@keyframes`, oppure un override
 * responsive tramite `@media`) iniettato così com'è.
 *
 * Il CSS avanzato viene messo DOPO la regola base apposta: così un
 * eventuale `@media (max-width: ...) { .cosmetic-ID.cosmetic-ID {...} }`
 * scritto lì vince sempre sulla regola base (stessa specificità, ma
 * dichiarato dopo), permettendo di avere un trattamento diverso per
 * mobile e desktop nella stessa identica ricompensa.
 *
 * Va renderizzato una volta per ogni cosmetic mostrato in pagina, insieme
 * a un elemento con className={cosmeticClassName(id)}.
 */
export function CosmeticStyleTag({
  id,
  asset,
  cssAvanzato,
  defaultAsset,
}: {
  id: string;
  asset: string;
  cssAvanzato?: string | null;
  /** Proprietà di base applicate prima di `asset` (es. anti-repeat per gli
   * sfondi): l'admin può comunque sovrascriverle scrivendo la stessa
   * proprietà in "Asset", perché viene dopo nella stessa regola. */
  defaultAsset?: string;
}) {
  const classe = cosmeticClassName(id);
  const css = `.${classe}.${classe} {\n${defaultAsset ?? ""}\n${asset}\n}\n${cssAvanzato ?? ""}`;
  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
