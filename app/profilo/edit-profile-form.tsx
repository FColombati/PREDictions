"use client";

import { useActionState, useRef, useState } from "react";
import { aggiornaProfilo, type ProfiloState } from "@/lib/actions/profile";
import { ritagliaQuadrato } from "@/lib/image-client";
import { Avatar } from "@/components/achievements/avatar";

const initialState: ProfiloState = {};

export function EditProfileForm({
  avatarAttuale,
  bioAttuale,
  username,
}: {
  avatarAttuale: string | null;
  bioAttuale: string | null;
  username: string;
}) {
  const [state, formAction, isPending] = useActionState(aggiornaProfilo, initialState);
  const [preview, setPreview] = useState<string | null>(avatarAttuale);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [rimuovi, setRimuovi] = useState(false);
  const [bio, setBio] = useState(bioAttuale ?? "");
  const [elaborando, setElaborando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setElaborando(true);
    setRimuovi(false);
    const ritagliata = await ritagliaQuadrato(file);
    setAvatarFile(ritagliata);
    setPreview(URL.createObjectURL(ritagliata));
    setElaborando(false);
  }

  return (
    <form
      action={(fd) => {
        if (avatarFile) fd.set("avatar", avatarFile);
        if (rimuovi) fd.set("rimuoviAvatar", "1");
        formAction(fd);
      }}
      className="panel-cut space-y-4 p-6"
    >
      <div className="flex items-center gap-4">
        <Avatar src={rimuovi ? null : preview} nome={username} taglia="xl" />
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={elaborando}
            className="rounded border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-accent hover:text-text"
          >
            {elaborando ? "Elaboro..." : preview ? "Cambia" : "Carica"}
          </button>
          {(preview || avatarAttuale) && !rimuovi && (
            <button
              type="button"
              onClick={() => {
                setRimuovi(true);
                setPreview(null);
                setAvatarFile(null);
              }}
              className="text-xs text-text-muted hover:text-ember"
            >
              Rimuovi avatar
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-muted">Bio</label>
        <textarea
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 200))}
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <p className="mt-1 text-right text-xs text-text-muted">{bio.length}/200</p>
      </div>

      {state.error && <p className="text-sm text-ember">{state.error}</p>}
      {state.success && <p className="text-sm text-verdant">Profilo aggiornato!</p>}

      <button
        type="submit"
        disabled={isPending}
        className="panel-cut-sm w-full bg-accent py-2.5 font-display font-semibold text-white transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {isPending ? "Salvo..." : "Salva modifiche"}
      </button>
    </form>
  );
}
