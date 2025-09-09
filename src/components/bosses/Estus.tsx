interface Props { lives: number; max?: number }

export default function Estus({ lives, max = 7 }: Props) {
  const safeLives = Math.max(0, Math.min(max, lives));
  const fill = safeLives / max;
  const uses = Math.max(0, safeLives - 1);
  const animate = safeLives > 2;

  return (
    <div
      class={`estus ${animate ? "is-animated" : ""}`}
      style={{ ["--fill" as any]: `${fill * 100}%` }}
      role="img"
      aria-label={`${safeLives}/${max} vidas`}
    >
      <img src="/images/estus-full.png"  alt=""       class="estus__fill"  />
      <img src="/images/estus-empty.png" alt="Vidas"  class="estus__glass" />
      <div class="estus__counter">{uses}</div>
    </div>
  );
}
