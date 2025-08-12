import { useState, useEffect } from "preact/hooks";
import type { Boss, Bosses } from "../types/types";
import "../styles/global.css"
import type { JSX } from "preact/jsx-runtime";

interface Props {
  bosses: Bosses;
  sendButtonImage: string;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

export default function BossList({ bosses, sendButtonImage }: Props) {
  const [inputText, setInputText] = useState("")
  const [inputIsSelected, setInputIsSelected] = useState(false)
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null)
  const [tries, setTries] = useState<Bosses>([])
  const [inputDisabled, setInputDisabled] = useState(false)
  const [victory, setVictory] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [streak, setStreak] = useState(0)
  const normalizedInputText = inputText.trim().toLocaleLowerCase()
  const [highlightIndex, setHighlightIndex] = useState(-1);

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

  function renderBossSuggestion(boss: Boss, idx: number): JSX.Element {
    const isHighlighted = idx === highlightIndex;

    const onClickHandler = () => {
      setInputText(boss.name)
      setSelectedBoss(boss)
      setInputIsSelected(false);
    }
    return (
      <li onMouseDown={e => e.preventDefault()} class={isHighlighted ? "highlighted" : ""} onClick={onClickHandler}>{boss.name}</li>
    )
  }

  function sendClickHandler(): void {
    // resolver o boss a partir do texto, se nada estiver selecionado
    const typed = inputText.trim().toLowerCase()
    const resolved =
      selectedBoss && selectedBoss.name === inputText
        ? selectedBoss
        : bosses.find(b => b.name.toLowerCase() === typed) || null

    if (!resolved) {
      setSelectedBoss(null)
      return
    }

    // usar sempre `resolved` daqui pra frente
    const today = getTodayDateString()
    const lastPlayed = localStorage.getItem("lastPlayedDate")
    if (lastPlayed !== today) localStorage.setItem("lastPlayedDate", today)

    const isCorrect = checkIfCorrect(resolved)
    if (isCorrect) {
      setInputDisabled(true)
      setVictory(true)
      localStorage.setItem("victory", "true")
      const newStreak = streak + 1
      setStreak(newStreak)
      localStorage.setItem("streak", String(newStreak))
    }

    setTries(curr => {
      const newTries = [...curr, resolved]
      localStorage.setItem("bossTries", JSON.stringify(newTries))
      return newTries
    })

    setInputText("")
    setSelectedBoss(null)
    checkFields(resolved)
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
      console.error(`Name: Errado`)
    }

    if (userBossAttempt.hp === dailyBoss.hp) {
      console.log("HP: Correto")
    } else {
      console.error(`HP: Errado`)
    }

    if (userBossAttempt.optional === dailyBoss.optional) {
      console.log("Optional: Correto")
    } else {
      console.error(`Optional: Errado`)
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

  function Modal({ onClose }: { onClose: () => void }) {
    return (
      <div class="victory">
        <div class="victory__background" onClick={onClose}></div>
        <div class="victory__card">
          <h1>VITÓRIA!</h1>
          <img src={`/bossImages/${getDailyBoss().slug}.png`} />
          <p>Você acertou</p>
          <p>Streak Atual: {streak}</p>
          <h2>{getDailyBoss().name}</h2>
        </div>
      </div>
    )
  }

  function onInputKey(e: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!showSuggestions) return;
      e.preventDefault()
      setHighlightIndex(i => Math.min(i + 1, filteredBosses.length - 1))
    }

    if (e.key === 'ArrowUp') {
      if (!showSuggestions) return;
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      if (highlightIndex >= 0 && highlightIndex < filteredBosses.length) {
        const boss = filteredBosses[highlightIndex];

        // alinhe os estados para passar na verificação
        setInputText(boss.name);
        setSelectedBoss(boss);
        setInputIsSelected(false);

        // dispara o envio no próximo tick
        setTimeout(() => {
          sendClickHandler();
        }, 0);
      } else {
        // sem destaque: mantém o comportamento atual
        sendClickHandler();
      }
      return;
    }
  }
  //sempre que o texto muda, ele reseta o highlight
  useEffect(() => {
    setHighlightIndex(-1)
  }, [inputText])

  useEffect(() => {
    if (highlightIndex >= filteredBosses.length) {
      setHighlightIndex(filteredBosses.length - 1)
    }
  }, [filteredBosses.length, highlightIndex])

  //verifica se o vitoria é verdadeiro para exibir o modal
  useEffect(() => {
    if (victory) {
      setShowModal(true)
    }
  }, [victory]);

  // verificação feita para garantir que o código seja executado apenas no lado do cliente, não do servidor
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("streak");
      if (stored) {
        setStreak(parseInt(stored))
      }
    }
  }, []);

  useEffect(() => {
    const today = getTodayDateString();
    const lastPlayed = localStorage.getItem("lastPlayedDate");
    const streakFromStorage = localStorage.getItem("streak");

    if (streakFromStorage) {
      setStreak(parseInt(streakFromStorage));
    }
    //Verifica se o dia mudou.
    if (lastPlayed !== today) {
      //Se for um novo dia, resetamos tudo
      localStorage.removeItem("bossTries");
      localStorage.removeItem("victory");
      //garantimos que o estado do React está limpo também
      setTries([]);
      setVictory(false);
      setInputDisabled(false);
      //defini a data de hoje para evitar que essa lógica rode de novo se o usuário recarregar a página
      localStorage.setItem("lastPlayedDate", today)
    } else {
      //se for o mesmo dia, carregamos o progresso salvo.
      const getBossTriesStored = localStorage.getItem("bossTries");
      const victoryFromStorage = localStorage.getItem("victory");

      if (victoryFromStorage === "true") {
        setVictory(true);
        setInputDisabled(true);
      }

      if (getBossTriesStored) {
        const parsedTries = JSON.parse(getBossTriesStored);
        setTries(parsedTries);
      }
    }
  }, []);

  const suggestionsIsEmpty = filteredBosses.length === 0
  const inputIsEmpty = inputText.trim() === ""
  const showSuggestions = inputIsSelected && !inputIsEmpty && !suggestionsIsEmpty

  return (
    <div class="boss-list">
      <div class="page-button" >
        <div class="page-button__input-wrapper">
          <input
            type="text"
            spellcheck={false}
            placeholder="write the boss's name"
            value={inputText}
            onInput={e => { setInputText((e.target as HTMLInputElement).value); setInputIsSelected(true) }}
            onFocus={() => setInputIsSelected(true)}
            onBlur={() => setTimeout(() => setInputIsSelected(false), 100)}
            disabled={inputDisabled}
            onKeyDown={onInputKey}
          />
        </div>
        <button onClick={sendClickHandler}>
          <img src={sendButtonImage} class="page-button_image" alt="" />
        </button>
        {showSuggestions && (
          <div class="page-button__boss-list">
            <ul class="page-button__list">
              {filteredBosses.map((boss, idx) => renderBossSuggestion(boss, idx))}
            </ul>
          </div>
        )}
      </div>
      <div class="categories">
        {showModal && <Modal onClose={() => setShowModal(false)} />}
        <div class="categories__header">
          <div class="categories__category">BOSS</div>
          <div class="categories__category">NAME</div>
          <div class="categories__category">HP</div>
          <div class="categories__category">WEAPONS</div>
          <div class="categories__category">RESISTANCES</div>
          <div class="categories__category">WEAKNESSES</div>
          <div class="categories__category">IMMUNITIES</div>
          <div class="categories__category">OPTIONAL</div>
        </div>
        <div class="categories__content">
          {tries.map(renderBossRow)}

        </div>
      </div>
    </div>
  );

}