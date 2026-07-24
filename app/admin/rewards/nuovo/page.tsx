import { creaCosmeticReward } from "@/lib/actions/achievements-admin";
import { RewardForm } from "../reward-form";

export default function NuovaRewardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold">Nuova ricompensa cosmetica</h1>
      <RewardForm azione={creaCosmeticReward} />
    </div>
  );
}
