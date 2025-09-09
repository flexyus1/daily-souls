import type { Boss } from "../../types/types"
import StatusIcons from "./StatusIcon";
import { bgVarFor, fieldComparison } from "../../lib/bossUtils";

interface Props {
  boss: Boss;
  index: number;
  allTries: Boss[];
  dailyBoss: Boss;
}

export default function BossRow({ boss, index, allTries, dailyBoss }: Props) {
  const isNewestTry = index === allTries.length - 1;
  const rowClasses = `categories__content-row ${isNewestTry ? "is-revealing" : ""}`;
  const nameClass = boss.name === dailyBoss.name ? "green" : "red";

  const hpClass = boss.hp === dailyBoss.hp ? "green" : "red";
  const hpArrow = boss.hp === dailyBoss.hp ? "" : (boss.hp > dailyBoss.hp ? "arrow-down" : "arrow-up");

  const weaponsClass = fieldComparison(boss.weapons, dailyBoss.weapons);
  const resistanceClass = fieldComparison(boss.resistance, dailyBoss.resistance);
  const weaknessClass = fieldComparison(boss.weakness, dailyBoss.weakness);
  const imunityClass = fieldComparison(boss.imunity, dailyBoss.imunity);
  const optionalClass = boss.optional === dailyBoss.optional ? "green" : "red";

  return (
    <div class={rowClasses} key={boss.slug}>
      <div class="categories__content-cell">
        <img src={`/bossImages/${boss.slug}.png`} alt={boss.name} />
      </div>
      <div class={`categories__content-cell field ${nameClass}`} style={bgVarFor(`${boss.slug}-name`)}>{boss.name}</div>
      <div class={`categories__content-cell ${hpClass} ${hpArrow}`} style={bgVarFor(`${boss.slug}-hp`)}>{boss.hp}</div>
      <div class={`categories__content-cell ${weaponsClass}`}    style={bgVarFor(`${boss.slug}-weapons`)}><StatusIcons statusUses={boss.weapons} /></div>
      <div class={`categories__content-cell ${resistanceClass}`} style={bgVarFor(`${boss.slug}-resistance`)}><StatusIcons statusUses={boss.resistance} /></div>
      <div class={`categories__content-cell ${weaknessClass}`}   style={bgVarFor(`${boss.slug}-weakness`)}><StatusIcons statusUses={boss.weakness} /></div>
      <div class={`categories__content-cell ${imunityClass}`}    style={bgVarFor(`${boss.slug}-imunity`)}><StatusIcons statusUses={boss.imunity} /></div>
      <div class={`categories__content-cell ${optionalClass}`}   style={bgVarFor(`${boss.slug}-optional`)}>
        {boss.optional.trim() ? boss.optional : "none"}
      </div>
    </div>
  );
}
