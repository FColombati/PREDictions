export function cosmeticClassName(id: string) {
  return `cosmetic-${id}`;
}

/**
 * Inietta un tag <style> con le proprietà CSS del cosmetic (avvolte nella
 * classe scoperta `.cosmetic-{id}`) più, se presente, del CSS avanzato
 * grezzo (tipicamente uno o più `@keyframes`) iniettato così com'è.
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
  const css = `${cssAvanzato ?? ""}\n.${classe}.${classe} {\n${defaultAsset ?? ""}\n${asset}\n}`;
  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
