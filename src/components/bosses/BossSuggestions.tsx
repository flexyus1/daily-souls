import type { JSX } from "preact/jsx-runtime";
import type { Boss, Bosses } from "../../types/types";

interface Props {
  bosses: Bosses;
  highlightIndex: number;
  onPick: (boss: Boss) => void;
}

export default function BossSuggestions({ bosses, highlightIndex, onPick }: Props) {
  const renderItem = (boss: Boss, idx: number): JSX.Element => {
    const isHighlighted = idx === highlightIndex;
    return (
      <li
        key={boss.slug}
        onMouseDown={(e) => e.preventDefault()}
        class={isHighlighted ? "highlighted" : ""}
        onClick={() => onPick(boss)}
      >
        {boss.name}
      </li>
    );
  };

  return (
    <div class="page-button__boss-list">
      <ul class="page-button__list">
        {bosses.map(renderItem)}
      </ul>
    </div>
  );
}
