import { useEffect, useMemo, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { Boss, Bosses } from "../../types/types";
import "../../styles/global.css";

import Estus from "./Estus";
import Tips from "./Tips";
import WinModal from "./WinModal";
import LoseModal from "./LoseModal";
import BossRow from "./BossRow";
import BossSuggestions from "./BossSuggestions";

import {
  bgVarFor,
  fieldComparison,
  getDailyBoss,
  getTodayDateString,
} from "../../lib/bossUtils";

interface Props {
  bosses: Bosses;
  sendButtonImage: string;
}

export default function BossList({ bosses, sendButtonImage }: Props) {
  const [inputText, setInputText] = useState("");
  const [inputIsSelected, setInputIsSelected] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [tries, setTries] = useState<Bosses>([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [victory, setVictory] = useState(false);
  const [winModal, setWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [lives, setLives] = useState(7);

  const todayStr = getTodayDateString();
  const dailyBoss = useMemo(() => getDailyBoss(bosses, new Date()), [bosses, todayStr]);

  const normalizedInputText = inputText.trim().toLocaleLowerCase();

  const filteredBosses = useMemo(() => {
    if (normalizedInputText === "") return bosses.filter(b => !tries.some(t => t.name === b.name));
    const triesSet = new Set(tries.map((t) => t.name));
    return bosses
      .filter((b) => b.name.toLowerCase().includes(normalizedInputText) && !triesSet.has(b.name))
      .sort((a, b) => {
        const an = a.name.toLowerCase();
        const bn = b.name.toLowerCase();
        const aStarts = an.startsWith(normalizedInputText);
        const bStarts = bn.startsWith(normalizedInputText);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        const aIdx = an.indexOf(normalizedInputText);
        const bIdx = bn.indexOf(normalizedInputText);
        if (aIdx !== bIdx) return aIdx - bIdx;
        return an.localeCompare(bn);
      });
  }, [bosses, normalizedInputText, tries]);

  const suggestionsIsEmpty = filteredBosses.length === 0;
  const inputIsEmpty = inputText.trim() === "";
  const showSuggestions = inputIsSelected && !inputIsEmpty && !suggestionsIsEmpty;

  function checkIfCorrect(userBossAttempt: Boss): boolean {
    // mais robusto que === por referência
    return userBossAttempt.slug === dailyBoss.slug;
  }

  function checkFields(userBossAttempt: Boss): void {
    // logs de checagem — opcionais
    if (userBossAttempt.name === dailyBoss.name) console.log("Name: Correto");
    else console.error("Name: Errado");

    if (userBossAttempt.hp === dailyBoss.hp) console.log("HP: Correto");
    else console.error("HP: Errado");

    if (userBossAttempt.optional === dailyBoss.optional) console.log("Optional: Correto");
    else console.error("Optional: Errado");

    const cmp = (a: string[], b: string[]) => console.log(fieldComparison(a, b));
    console.log("Resistance:", fieldComparison(userBossAttempt.resistance, dailyBoss.resistance));
    console.log("Weakness:",   fieldComparison(userBossAttempt.weakness,   dailyBoss.weakness));
    console.log("Imunity:",    fieldComparison(userBossAttempt.imunity,    dailyBoss.imunity));
    console.log("Weapons:",    fieldComparison(userBossAttempt.weapons,    dailyBoss.weapons));
  }

  function sendClickHandler(): void {
    const typed = inputText.trim().toLowerCase();
    const resolved =
      selectedBoss && selectedBoss.name === inputText
        ? selectedBoss
        : bosses.find((b) => b.name.toLowerCase() === typed) || null;

    if (lives <= 0 || inputDisabled) return;

    if (!resolved) {
      setSelectedBoss(null);
      return;
    }

    if (!checkIfCorrect(resolved)) {
      setLives((prev) => {
        const newLives = prev - 1;
        localStorage.setItem("livesLeft", String(newLives));
        if (newLives <= 0) {
          setInputDisabled(true);
          const totalAnimationTime = 3500 + 600;
          setTimeout(() => setShowLoseModal(true), totalAnimationTime);
        }
        return newLives;
      });
    }

    const today = getTodayDateString();
    const lastPlayed = localStorage.getItem("lastPlayedDate");
    if (lastPlayed !== today) localStorage.setItem("lastPlayedDate", today);

    const isCorrect = checkIfCorrect(resolved);
    if (isCorrect) {
      setInputDisabled(true);
      setVictory(true);
      localStorage.setItem("victory", "true");
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("streak", String(newStreak));

      const totalAnimationTime = 3500 + 600;
      setTimeout(() => setWinModal(true), totalAnimationTime);
    }

    setTries((curr) => {
      const newTries = [...curr, resolved];
      localStorage.setItem("bossTries", JSON.stringify(newTries));
      return newTries;
    });

    setInputText("");
    setSelectedBoss(null);
    checkFields(resolved);
  }

  function onInputKey(e: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!showSuggestions) return;
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filteredBosses.length - 1));
    }
    if (e.key === "ArrowUp") {
      if (!showSuggestions) return;
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputText.trim() === "") return;

      if (highlightIndex >= 0 && highlightIndex < filteredBosses.length) {
        const boss = filteredBosses[highlightIndex];
        setInputText(boss.name);
        setSelectedBoss(boss);
        setInputIsSelected(false);
        setTimeout(() => sendClickHandler(), 0);
      } else {
        sendClickHandler();
      }
    }
  }

  // efeitos
  useEffect(() => { setHighlightIndex(0); }, [inputText]);

  useEffect(() => {
    if (highlightIndex >= filteredBosses.length) {
      setHighlightIndex(filteredBosses.length - 1);
    }
  }, [filteredBosses.length, highlightIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("streak");
    if (stored) setStreak(parseInt(stored));
  }, []);

  useEffect(() => {
    const today = getTodayDateString();
    const lastPlayed = localStorage.getItem("lastPlayedDate");
    const streakFromStorage = localStorage.getItem("streak");
    const storedLives = localStorage.getItem("livesLeft");

    if (streakFromStorage) setStreak(parseInt(streakFromStorage));

    if (lastPlayed !== today) {
      localStorage.removeItem("bossTries");
      localStorage.removeItem("victory");
      setTries([]);
      setVictory(false);
      setInputDisabled(false);
      setLives(7);
      localStorage.setItem("livesLeft", "7");
      localStorage.setItem("lastPlayedDate", today);
    } else {
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
        const lv = parseInt(storedLives);
        setLives(lv);
        if (lv <= 0) {
          setInputDisabled(true);
          setShowLoseModal(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    bosses.forEach((boss) => {
      const img = new Image();
      img.src = `/bossImages/${boss.slug}.png`;
    });
  }, [bosses]);

  return (
    <div class="boss-list">
      <div class="page-button">
        <div class="page-button__input-wrapper">
          <input
            type="text"
            spellcheck={false}
            placeholder="Write the boss's name"
            value={inputText}
            onInput={(e) => {
              setInputText((e.target as HTMLInputElement).value);
              setInputIsSelected(true);
            }}
            onFocus={() => setInputIsSelected(true)}
            onBlur={() => setTimeout(() => setInputIsSelected(false), 100)}
            disabled={inputDisabled}
            onKeyDown={onInputKey}
          />
        </div>
        <button onClick={sendClickHandler}><img src={sendButtonImage} class="page-button_image" alt="" /></button>
        {showSuggestions && (
          <BossSuggestions
            bosses={filteredBosses}
            highlightIndex={highlightIndex}
            onPick={(boss) => {
              setInputText(boss.name);
              setSelectedBoss(boss);
              setInputIsSelected(false);
            }}
          />
        )}
      </div>

      <div class="lives-counter">
        <Estus lives={lives} />
        <Tips />
      </div>

      <div class="categories">
        {winModal && <WinModal boss={dailyBoss} streak={streak} onClose={() => setWinModal(false)} />}
        {showLoseModal && <LoseModal boss={dailyBoss} onClose={() => setShowLoseModal(false)} />}

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
          {tries.map((boss, i, all) => (
            <BossRow key={boss.slug} boss={boss} index={i} allTries={all} dailyBoss={dailyBoss} />
          ))}
        </div>
      </div>
    </div>
  );
}
