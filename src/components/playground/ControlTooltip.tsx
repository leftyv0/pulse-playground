"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

/* ── Tooltip definition interface ── */

export interface TooltipDef {
  title: string;
  description: string;
  type: string;
  default: string;
  min?: number;
  max?: number;
  step?: number;
  options?: number;
  format?: string;
  affects?: string;
  scope?: string;
}

/* ── Active tooltip state ── */

export interface TooltipState {
  def: TooltipDef;
  key: string;
  rect: DOMRect;
}

/* ── Hook: useControlTooltips ── */

export function useControlTooltips(
  containerRef: React.RefObject<HTMLDivElement | null>,
  tooltipMap: Record<string, TooltipDef>
): TooltipState | null {
  const [active, setActive] = useState<TooltipState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  const mapRef = useRef(tooltipMap);
  mapRef.current = tooltipMap;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function findLabelKey(target: EventTarget | null): { key: string; label: HTMLElement } | null {
      let el = target as HTMLElement | null;
      for (let i = 0; i < 5 && el; i++) {
        if (el.tagName === "LABEL") {
          const text = el.textContent?.trim();
          if (text && mapRef.current[text]) {
            return { key: text, label: el };
          }
        }
        el = el.parentElement;
      }
      return null;
    }

    function onPointerOver(e: PointerEvent) {
      const result = findLabelKey(e.target);
      if (!result) {
        clearTimer();
        activeKeyRef.current = null;
        setActive(null);
        return;
      }

      if (result.key === activeKeyRef.current) return;

      clearTimer();
      activeKeyRef.current = result.key;
      timerRef.current = setTimeout(() => {
        const rect = result.label.getBoundingClientRect();
        setActive({ def: mapRef.current[result.key], key: result.key, rect });
      }, 250);
    }

    function onPointerLeave() {
      clearTimer();
      activeKeyRef.current = null;
      setActive(null);
    }

    container.addEventListener("pointerover", onPointerOver);
    container.addEventListener("pointerleave", onPointerLeave);
    return () => {
      container.removeEventListener("pointerover", onPointerOver);
      container.removeEventListener("pointerleave", onPointerLeave);
      clearTimer();
    };
  }, [containerRef, clearTimer]);

  return active;
}

/* ── Range bar component (for continuous sliders) ── */

function RangeBar({ def, currentValue }: { def: TooltipDef; currentValue: number }) {
  const { min = 0, max = 1, step = 0.1 } = def;
  const pct = Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100));
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));

  return (
    <div style={{ margin: "10px 0 6px" }}>
      <div
        style={{
          position: "relative",
          height: 4,
          borderRadius: 2,
          background: "#2a2a35",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 4,
            borderRadius: 2,
            background: "#22d3ee",
            width: `${pct}%`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 11,
          color: "#808080",
        }}
      >
        <span>{min.toFixed(decimals)}</span>
        <span style={{ color: "#22d3ee", fontWeight: 500 }}>
          {currentValue.toFixed(decimals)}
        </span>
        <span>{max.toFixed(decimals)}</span>
      </div>
    </div>
  );
}

/* ── Spec row ── */

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        fontSize: 12,
      }}
    >
      <span style={{ color: "#808080" }}>{label}</span>
      <span style={{ fontWeight: 500, color: "#ffffff" }}>{value}</span>
    </div>
  );
}

/* ── Tooltip portal ── */

export function ControlTooltipPortal({
  tooltip,
  getValue,
}: {
  tooltip: TooltipState;
  getValue: (key: string) => unknown;
}) {
  const { def, key, rect } = tooltip;
  const currentValue = getValue(key);
  const hasRange = def.min !== undefined && def.max !== undefined;

  const tooltipHeight = 240;
  const spaceBelow = window.innerHeight - rect.bottom;
  const top =
    spaceBelow < tooltipHeight + 16
      ? rect.top - tooltipHeight - 8
      : rect.bottom + 8;

  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 296));

  const specRows: { label: string; value: string }[] = [];
  specRows.push({ label: "Type", value: def.type });
  specRows.push({ label: "Default", value: def.default });

  if (def.step !== undefined) {
    specRows.push({ label: "Step", value: String(def.step) });
  }
  if (def.options !== undefined) {
    specRows.push({ label: "Options", value: `${def.options} values` });
  }
  if (def.format) {
    specRows.push({ label: "Format", value: def.format });
  }
  if (def.affects) {
    specRows.push({ label: "Affects", value: def.affects });
  }
  if (def.scope) {
    specRows.push({ label: "Scope", value: def.scope });
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top,
        left,
        background: "#111118",
        border: "0.5px solid #2a2a35",
        borderRadius: 8,
        padding: "14px 16px",
        width: 280,
        pointerEvents: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          paddingBottom: 8,
          marginBottom: 8,
          borderBottom: "1px solid #2a2a35",
        }}
      >
        {def.title}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#b0b0b0",
          lineHeight: 1.5,
          marginBottom: hasRange ? 0 : 10,
        }}
      >
        {def.description}
      </div>

      {hasRange && typeof currentValue === "number" && (
        <RangeBar def={def} currentValue={currentValue} />
      )}

      <div
        style={{
          borderTop: "1px solid #2a2a35",
          paddingTop: 8,
          marginTop: 4,
        }}
      >
        {specRows.map((r) => (
          <SpecRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>,
    document.body
  );
}
