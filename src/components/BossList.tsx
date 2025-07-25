import { useState } from "preact/hooks";
import type { Boss, Bosses } from "../types/types";
import "../styles/global.css"
import type { JSX } from "preact/jsx-runtime";

interface Props {
  bosses: Bosses;
  sendButtonImage: string;
}

export default function BossList({ bosses, sendButtonImage }: Props) {
  const [inputText, setInputText] = useState("");
  const [inputIsSelected, setInputIsSelected] = useState(false)
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null)
  const [tries, setTries] = useState<Bosses>([])
  const normalizedInputText = inputText.trim().toLocaleLowerCase()

  let filteredBosses: Bosses = bosses
  const triesSet = new Set(tries.map((t) => t.name))
  if (normalizedInputText !== "") {
    filteredBosses = bosses
      .filter(boss => boss.name.toLowerCase().includes(normalizedInputText) && !triesSet.has(boss.name))
      .sort((a, b) => {
        const an = a.name.toLowerCase()
        const bn = b.name.toLowerCase()

        const aStarts = an.startsWith(normalizedInputText)
        const bStarts = bn.startsWith(normalizedInputText)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1

        const aIdx = an.indexOf(normalizedInputText)
        const bIdx = bn.indexOf(normalizedInputText)
        if (aIdx !== bIdx) return aIdx - bIdx

        return an.localeCompare(bn)
      })
  }

  function renderBossSuggestion(boss: Boss): JSX.Element {
    const onClickHandler = () => {
      setInputText(boss.name)
      setSelectedBoss(boss)
    }
    return (
      <li onClick={onClickHandler}>{boss.name}</li>
    )
  }

  function sendClickHandler(): void {
    if (!selectedBoss) return

    const isCorrect = checkIfCorrect(selectedBoss)
    // console.log(isCorrect)
    setTries(prev => [...prev, selectedBoss])
    setInputText("")
    setSelectedBoss(null)
    console.log("------------------------------------------------------------")
    checkFields(selectedBoss)
    console.log("------------------------------------------------------------")
    return
  }
  //verifica se o boss tentado é o mesmo do dia e retorna verdadeiro ou falso
  function checkIfCorrect(userBossAttempt: Boss): boolean {
    if (userBossAttempt === getDailyBoss()) {
      return true
    }
    return false
  }

  function defineNone(arr: string[] | undefined | null): string {
    if (!arr || arr.length === 0) return "none";
    const filtered = arr.filter(item => item.trim() !== "");
    return filtered.length > 0 ? filtered.join(", ") : "none";
  }

  function renderBossRow(boss: Boss): JSX.Element {
    const dailyBoss = getDailyBoss()
    const nameClass = boss.name === dailyBoss.name ? "green" : "red"
    const hpClass = boss.hp === dailyBoss.hp ? "green" : "red"
    const hpArrow = boss.hp > dailyBoss.hp ? "arrow-down" : "arrow-up"
    const weaponsClass = fieldComparison(boss.weapons, dailyBoss.weapons)
    const resistanceClass = fieldComparison(boss.resistance, dailyBoss.resistance)
    const weaknessClass = fieldComparison(boss.weakness, dailyBoss.weakness)
    const imunityClass = fieldComparison(boss.imunity, dailyBoss.imunity)
    const optionalClass = boss.optional === dailyBoss.optional ? "green" : "red"
    return (
      <div class="categories__content-row" key={boss.slug}>
        <div class="categories__content-cell">
          <img src={`/bossImages/${boss.slug}.png`} alt={boss.name} />
        </div>
        <div class={`categories__content-cell ${nameClass}`}>{boss.name}</div>
        <div class={`categories__content-cell ${hpClass} ${hpArrow}`}>{boss.hp}</div>
        <div class={`categories__content-cell ${weaponsClass}`}>{defineNone(boss.weapons)}</div>
        <div class={`categories__content-cell ${resistanceClass}`}>{defineNone(boss.resistance)}</div>
        <div class={`categories__content-cell ${weaknessClass}`}>{defineNone(boss.weakness)}</div>
        <div class={`categories__content-cell ${imunityClass}`}>{defineNone(boss.imunity)}</div>
        <div class={`categories__content-cell ${optionalClass}`}>{boss.optional.trim() ? boss.optional : "none"}</div>
      </div>
    );
  }

  function getDailyBoss() {
    const today = new Date().getUTCDate()
    const boss = bosses[today % bosses.length]

    return boss
  }

  function fieldComparison(attemptCategory: string[], answerCategory: string[]) {
    const attemptCategorySorted = [...attemptCategory].sort()
    const answerCategorySorted = [...answerCategory].sort()

    if (attemptCategorySorted.join(",") === answerCategorySorted.join(",")) {
      return "green"
    }

    for (let i = 0; i < attemptCategory.length; i++) {

      const itemToVerify = attemptCategory[i]
      if (answerCategory.includes(itemToVerify)) {
        return "yellow"
      }
    }
    return "red"
  }

  function checkFields(userBossAttempt: Boss): void {
    const dailyBoss = getDailyBoss()

    if (userBossAttempt.name === dailyBoss.name) {
      console.log("Name: Correto")
    } else {
      console.error(`Name: Errado - deveria ser ${dailyBoss.name}`)
    }

    if (userBossAttempt.hp === dailyBoss.hp) {
      console.log("HP: Correto")
    } else {
      console.error(`HP: Errado - deveria ser ${dailyBoss.hp}`)
    }

    if (userBossAttempt.optional === dailyBoss.optional) {
      console.log("Optional: Correto")
    } else {
      console.error(`Optional: Errado - deveria ser ${dailyBoss.optional}`)
    }

    const resistanceComparison = fieldComparison(userBossAttempt.resistance, dailyBoss.resistance)
    console.log(`Resistance: ${resistanceComparison}`)

    const weaknessComparison = fieldComparison(userBossAttempt.weakness, dailyBoss.weakness)
    console.log(`Weakness: ${weaknessComparison}`)

    const imunityComparison = fieldComparison(userBossAttempt.imunity, dailyBoss.imunity)
    console.log(`Imunity: ${imunityComparison}`)

    const weaponsComparison = fieldComparison(userBossAttempt.weapons, dailyBoss.weapons)
    console.log(`Weapons: ${weaponsComparison}`)
  }

  const suggestionsIsEmpty = filteredBosses.length === 0
  const inputIsEmpty = inputText.trim() === ""
  const showSuggestions = inputIsSelected && !inputIsEmpty && !suggestionsIsEmpty
  return (
    <div class="boss-list">
      <div class="page-button">
        <div class="page-button__input-wrapper">
          <input
            type="text"
            spellcheck={false}
            placeholder="write the boss's name"
            value={inputText}
            onInput={e => setInputText((e.target as HTMLInputElement).value)}
            onFocus={() => setInputIsSelected(true)}
            onBlur={() => setTimeout(() => setInputIsSelected(false), 100)}

          />
        </div>
        <button onClick={sendClickHandler}>
          <img src={sendButtonImage} class="page-button_image" alt="" />
        </button>
        {showSuggestions && (
          <div class="page-button__boss-list">
            <ul class="page-button__list">
              {filteredBosses.map(renderBossSuggestion)}
            </ul>
          </div>
        )}
      </div>
      <div class="categories">
        <div class="categories__header">
          <div class="categories__category">BOSS</div>
          <div class="categories__category">NAME</div>
          <div class="categories__category">HP</div>
          <div class="categories__category">WEAPONS</div>
          <div class="categories__category">RESISTANCE</div>
          <div class="categories__category">WEAKNESS</div>
          <div class="categories__category">IMUNITY</div>
          <div class="categories__category">OPTIONAL</div>
        </div>
        <div class="categories__content">
          {tries.map(renderBossRow)}

        </div>
      </div>
    </div>
  );

}