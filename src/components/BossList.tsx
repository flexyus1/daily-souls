import { useState } from "preact/hooks";
import type { Boss, Bosses } from "../types/types";
import "../styles/global.css"

interface Props {
  bosses: Bosses;
  sendButtonImage: string;
}

export default function BossList({ bosses, sendButtonImage }: Props) {
  //
  const [inputText, setInputText] = useState("");
  const [inputIsSelected, setInputIsSelected] = useState(false)
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null)
  const [tries, setTries] = useState<Bosses>([])

  console.log(JSON.stringify(bosses[0]))
  const lastGiant = bosses[0]
  const thePursuer = bosses[1]

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

  function renderBossSuggestion(boss: Boss) {
    const onClickHandler = () => {
      setInputText(boss.name)
      setSelectedBoss(boss)
    }
    return (
      <li onClick={onClickHandler}>{boss.name}</li>
    )
  }

  function sendClickHandler() {
    if (!selectedBoss) return

    setTries(prev => [...prev, selectedBoss])
    setInputText("")
    setSelectedBoss(null)
  }

  function defineNone(arr: string[] | undefined | null): string {
    if (!arr || arr.length === 0) return "none";
    const filtered = arr.filter(item => item.trim() !== "");
    return filtered.length > 0 ? filtered.join(", ") : "none";
  }

  function renderBossRow(boss: Boss) {
    return (
      <div class="categories__content-row" key={boss.slug}>
        <div class="categories__content-cell">
          <img src={`/bossImages/${boss.slug}.png`} alt={boss.name} />
        </div>
        <div class="categories__content-cell">{boss.name}</div>
        <div class="categories__content-cell">{boss.hp}</div>
        <div class="categories__content-cell">{defineNone(boss.weapons)}</div>
        <div class="categories__content-cell">{defineNone(boss.resistance)}</div>
        <div class="categories__content-cell">{defineNone(boss.weakness)}</div>
        <div class="categories__content-cell">{defineNone(boss.imunity)}</div>
        <div class="categories__content-cell">{boss.optional.trim() ? boss.optional : "none"}</div>
      </div>
    );
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