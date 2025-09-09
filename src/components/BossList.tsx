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
  poison: "/icons/poison.png",
  none: "/images/x.png"
  };

    const textures = [
  "/images/background2.png",
  "/images/background3.png",
  "/images/background4.png",
  "/images/background5.png",
  ];

  // hash simples e rápido -> 0..(n-1)
  function pickIndex(key: string, modulo = textures.length): number {
    let h = 2166136261 >>> 0;                // FNV-like
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % modulo;
  }

  // devolve o style com a CSS var preenchida
  function bgVarFor(key: string) {
    const idx = pickIndex(key);
    const url = textures[idx];
    return { ["--bg-images" as any]: `url("${url}")` };
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

function StatusIcons({ statusUses }: { statusUses: string[] | undefined | null }) {
  if (!statusUses || statusUses.length === 0 || statusUses.every(s => s.trim() === "")) {
    return (
      <div class="status-icon-container icon-mode count-1">
        <div class="tooltip">
          <span class="status-badge">
            <img src="/icons/none.png" class="status-icon" alt="none" />
          </span>
          <span class="tooltip-text">none</span>
        </div>
      </div>
    );
  }

  const normalized = statusUses.map(s => s.toLowerCase().trim());
  const isTextMode = normalized.every(s => !statusIconMap[s]);

  return (
    <div class={`status-icon-container ${isTextMode ? "text-mode" : "icon-mode"} count-${statusUses.length}`}>
      {normalized.map((status) => {
        const iconSrc = statusIconMap[status];
        if (!iconSrc) return <span class="status-text" key={status}>{status}</span>;
        return (
          <div class="tooltip" key={status}>
            <span class="status-badge">
              <img src={iconSrc} class="status-icon" alt={status} />
            </span>
            <span class="tooltip-text">{status}</span>
          </div>
        );
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
        <div class="categories__content-cell" >
          <img src={`/bossImages/${boss.slug}.png`} alt={boss.name} />
        </div>
        <div class={`categories__content-cell field ${nameClass}`} style={bgVarFor(`${boss.slug}-name`)}>{boss.name}</div>
        <div class={`categories__content-cell ${hpClass} ${hpArrow}`} style={bgVarFor(`${boss.slug}-hp`)}>{boss.hp}</div>
        <div class={`categories__content-cell ${weaponsClass}`} style={bgVarFor(`${boss.slug}-weapons`)}><StatusIcons statusUses={boss.weapons} /></div>
        <div class={`categories__content-cell ${resistanceClass}`}  style={bgVarFor(`${boss.slug}-resistance`)}><StatusIcons statusUses={boss.resistance} /></div>
        <div class={`categories__content-cell ${weaknessClass}`} style={bgVarFor(`${boss.slug}-weakness`)}><StatusIcons statusUses={boss.weakness} /></div>
        <div class={`categories__content-cell ${imunityClass}`} style={bgVarFor(`${boss.slug}-imunity`)}><StatusIcons statusUses={boss.imunity}/></div>
        <div class={`categories__content-cell ${optionalClass}`} style={bgVarFor(`${boss.slug}-optional`)}>{boss.optional.trim() ? boss.optional : "none"}</div>
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

function Estus({ lives, max = 7 }: { lives: number; max?: number }) {
  const safeLives = Math.max(0, Math.min(max, lives));
  const fill = safeLives / max;

  const animate = safeLives > 2; // sem animação quando <= 2

  return (
    <div
      class={`estus ${animate ? "is-animated" : ""}`}
      style={{ ["--fill" as any]: `${fill * 100}%` }}
      role="img"
      aria-label={`${safeLives}/${max} vidas`}
    >
      <img src="/images/estus-full.png"  alt=""       class="estus__fill"  />
      <img src="/images/estus-empty.png" alt="Vidas"  class="estus__glass" />
    </div>
  );
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

  // Pré-carregamento das imagens dos chefes
  useEffect(() => {
    bosses.forEach(boss => {
      const img = new Image()
      img.src = `/bossImages/${boss.slug}.png`
    })
  }, [bosses])

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
            placeholder="Write the boss's name"
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
        <Estus lives={lives}/>
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