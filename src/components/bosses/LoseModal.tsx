import { useEffect } from "preact/hooks";
import type { Boss } from "../../types/types";

export default function LoseModal({ boss, onClose }: { boss: Boss; onClose: () => void }) {
  useEffect(() => {
    const audio = new Audio("/sounds/defeat.mp3");
    audio.play().catch(() => {});
  }, []);

  return (
    <div class="defeat-screen" onClick={onClose}>
      <div class="defeat-screen__text">Você Perdeu</div>
      <div class="defeat-screen__boss-info">
        <img src={`/bossImages/${boss.slug}.png`} alt={boss.name} />
        <div class="defeat-screen__boss-name">{boss.name}</div>
      </div>
    </div>
  );
}
