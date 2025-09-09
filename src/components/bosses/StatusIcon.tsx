import { useEffect, useRef, useState } from "preact/hooks";
import { statusIconMap } from "../../lib/bossUtils";

interface Props {
  statusUses?: string[] | null;
}

export default function StatusIcons({ statusUses }: Props) {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const tooltipRefs = useRef<Map<string, HTMLElement>>(new Map());
  const checkInterval = useRef<number | null>(null);

  useEffect(() => {
    checkInterval.current = window.setInterval(() => {
      let foundHover = false;
      tooltipRefs.current.forEach((element, status) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const mouseX = (window as any).lastMouseX || 0;
        const mouseY = (window as any).lastMouseY || 0;
        if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
          if (hoveredTooltip !== status) setHoveredTooltip(status);
          foundHover = true;
        }
      });
      if (!foundHover && hoveredTooltip !== null) setHoveredTooltip(null);
    }, 100);

    const handleMouseMove = (e: MouseEvent) => {
      (window as any).lastMouseX = e.clientX;
      (window as any).lastMouseY = e.clientY;
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [hoveredTooltip]);

  const registerTooltip = (status: string, element: HTMLElement | null) => {
    if (element) tooltipRefs.current.set(status, element);
    else tooltipRefs.current.delete(status);
  };

  if (!statusUses || statusUses.length === 0 || statusUses.every((s) => s.trim() === "")) {
    return (
      <div class="status-icon-container icon-mode count-1">
        <div class="tooltip" ref={(el) => registerTooltip("none", el)}>
          <span class="status-badge">
            <img src={statusIconMap.none} class="status-icon" alt="none" />
          </span>
          <span class={`tooltip-text ${hoveredTooltip === "none" ? "visible" : ""}`}>none</span>
        </div>
      </div>
    );
  }

  const normalized = statusUses.map((s) => s.toLowerCase().trim());
  const isTextMode = normalized.every((s) => !statusIconMap[s]);

  return (
    <div class={`status-icon-container ${isTextMode ? "text-mode" : "icon-mode"} count-${statusUses.length}`}>
      {normalized.map((status) => {
        const iconSrc = statusIconMap[status];
        if (!iconSrc) return <span class="status-text" key={status}>{status}</span>;
        return (
          <div class="tooltip" key={status} ref={(el) => registerTooltip(status, el)}>
            <span class="status-badge">
              <img src={iconSrc} class="status-icon" alt={status} />
            </span>
            <span class={`tooltip-text ${hoveredTooltip === status ? "visible" : ""}`}>{status}</span>
          </div>
        );
      })}
    </div>
  );
}
