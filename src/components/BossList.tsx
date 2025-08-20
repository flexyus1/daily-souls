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
  const [winModal, setWinModal] = useState(false)
  const [showLoseModal, setShowLoseModal] = useState(false)
  const [streak, setStreak] = useState(0)
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [lives, setLives] = useState(7);
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

  const statusIconMap: Record<string, string> = {
  bleed: "/icons/bleed.png",
  lightning: "/icons/lightning.png",
  slash: "/icons/slash.png",
  strike: "/icons/strike.png",
  thrust: "/icons/thrust.png",
  magic: "/icons/magic.png",
  fire: "/icons/fire.png",
  dark: "/icons/dark.png",
  physical: "/icons/physical.png",
  poison: "icons/poison.png"
  };

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
    if (lives <= 0 || inputDisabled) {
      return; // não permite tentativa se não houver vidas
    }
    if (!resolved) {
      setSelectedBoss(null)
      return
    }
   if (!checkIfCorrect(resolved)) {
      setLives(prev => {
       const newLives = prev - 1;
       localStorage.setItem("livesLeft", String(newLives));
      if (newLives <= 0) {
           setInputDisabled(true);
      const totalAnimationTime = 3500 + 600;
          setTimeout(() => {
          setShowLoseModal(true);
      }, totalAnimationTime);
    }
    return newLives;
      });
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

      const totalAnimationTime = 3500 + 600;
      setTimeout(() => {
        setWinModal(true);
      }, totalAnimationTime);
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

function StatusIcons({ statusUses: statusUses }: { statusUses: string[] | undefined | null }) {
  // Se o array estiver vazio ou não existir, retorne "none"
  if (!statusUses || statusUses.length === 0 || statusUses.every(s => s.trim() === "")) {
    return <span>none</span>;
  }
  return (
    <div class="status-icon-container">
      {statusUses.map(status => {
        const iconSrc = statusIconMap[status.toLowerCase().trim()];
        if (!iconSrc) {
          return <span>{status}</span>;
        }
        return (<img src={iconSrc} class="status-icon"/>);
      })}
    </div>
        );
  }

  function renderBossRow(boss: Boss, index: number, allTries: Boss[]): JSX.Element {
    const dailyBoss = getDailyBoss()
    const isNewestTry = index === allTries.length - 1;
    const rowClasses = `categories__content-row ${isNewestTry ? "is-revealing" : ""}`

    const nameClass = boss.name === dailyBoss.name ? "green" : "red"
    const hpClass = boss.hp === dailyBoss.hp ? "green" : "red"
    const hpArrow = boss.hp === dailyBoss.hp ? "" : (boss.hp > dailyBoss.hp ? "arrow-down" : "arrow-up");
    const weaponsClass = fieldComparison(boss.weapons, dailyBoss.weapons)
    const resistanceClass = fieldComparison(boss.resistance, dailyBoss.resistance)
    const weaknessClass = fieldComparison(boss.weakness, dailyBoss.weakness)
    const imunityClass = fieldComparison(boss.imunity, dailyBoss.imunity)
    const optionalClass = boss.optional === dailyBoss.optional ? "green" : "red"
    return (
      <div class={rowClasses} key={boss.slug}>
        <div class="categories__content-cell">
          <img src={`/bossImages/${boss.slug}.png`} alt={boss.name} />
        </div>
        <div class={`categories__content-cell ${nameClass}`}>{boss.name}</div>
        <div class={`categories__content-cell ${hpClass} ${hpArrow}`}>{boss.hp}</div>
        <div class={`categories__content-cell ${weaponsClass}`}><StatusIcons statusUses={boss.weapons} /></div>
        <div class={`categories__content-cell ${resistanceClass}`}><StatusIcons statusUses={boss.resistance} /></div>
        <div class={`categories__content-cell ${weaknessClass}`}><StatusIcons statusUses={boss.weakness} /></div>
        <div class={`categories__content-cell ${imunityClass}`}><StatusIcons statusUses={boss.imunity} /></div>
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

  function WinModal({ onClose }: { onClose: () => void }) {
  const boss = getDailyBoss();

  useEffect(() => {
    const audio = new Audio("/sounds/victory.mp3");
    audio.play().catch(() => {
      console.log("Autoplay bloqueado pelo navegador");
    });

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

function LoseModal({ onClose }: { onClose: () => void }) {
  const boss = getDailyBoss();

  useEffect(() => {
    const audio = new Audio("/sounds/defeat.mp3");
    audio.play().catch(() => {
      console.log("Autoplay bloqueado pelo navegador");
    });
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
      if (inputText.trim() === "") return;

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
    setHighlightIndex(0)
  }, [inputText])

  useEffect(() => {
    if (highlightIndex >= filteredBosses.length) {
      setHighlightIndex(filteredBosses.length - 1)
    }
  }, [filteredBosses.length, highlightIndex])

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
    const storedLives = localStorage.getItem("livesLeft");

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
      setLives(7); // resetar vidas
      localStorage.setItem("livesLeft", "7");
      //defini a data de hoje para evitar que essa lógica rode de novo se o usuário recarregar a página
      localStorage.setItem("lastPlayedDate", today)
    } else {
      //se for o mesmo dia, carregamos o progresso salvo.
      const getBossTriesStored = localStorage.getItem("bossTries");
      const victoryFromStorage = localStorage.getItem("victory");

      if (victoryFromStorage === "true") {
        setVictory(true);
        setInputDisabled(true);
        setWinModal(true);
      }

      if (getBossTriesStored) {
        const parsedTries = JSON.parse(getBossTriesStored);
        setTries(parsedTries);
      }
      if (storedLives !== null) {
        setLives(parseInt(storedLives));
          if (parseInt(storedLives) <= 0) {
          setInputDisabled(true);
          setShowLoseModal(true);
       }
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
      <div class="lives-counter">
        <img
          src={
            lives >= 5
              ? "/images/estus-full.png"
              : lives >= 2
              ? "/images/estus-midle.png"
              : "/images/estus-empty.png"
          } class="estus-image" />
      </div>
      <div class="categories">
        {winModal && <WinModal onClose={() => setWinModal(false)} />}
        {showLoseModal && <LoseModal onClose={() => setShowLoseModal(false)} />}
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