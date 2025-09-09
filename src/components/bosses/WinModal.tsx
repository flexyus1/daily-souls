import { useEffect } from "preact/hooks";
import type { Boss } from "../../types/types";

interface Props { boss: Boss; streak: number; onClose: () => void }

export default function WinModal({ boss, streak, onClose }: Props) {
  useEffect(() => {
    const audio = new Audio("/sounds/victory.mp3");
    audio.play().catch(() => {});
  }, []);

  return (
    <div class="victory-screen" onClick={onClose}>
      <div class="victory-screen__text">Boss Encontrado</div>
      <div class="victory-screen__boss-info">
        <img src={`/bossImages/${boss.slug}.png`} alt={boss.name} />
        <div class="victory-screen__boss-name">{boss.name}</div>
        <div class="victory-screen__streak">Streak Atual: {streak}</div>
      </div>
    </div>
  );
}
