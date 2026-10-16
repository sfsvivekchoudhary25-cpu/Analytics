'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, SparklesIcon, Tick02Icon } from '@hugeicons/core-free-icons';

export type ThoughtLineGlyph = 'sparkle' | 'dot' | 'none' | ReactNode;

export interface ThoughtLineProps {
  label?: string;
  doneLabel?: string;
  renderLabel?: (text: string, working: boolean) => ReactNode;
  glyph?: ThoughtLineGlyph;
  steps?: string[];
  activeStep?: number;
  collapsible?: boolean;
  collapseOnSettle?: boolean;
  color?: string;
  glyphColor?: string;
  fontSize?: number;
  breathPeriod?: number;
  breathDepth?: number;
  shimmer?: boolean;
  shimmerDuration?: number;
  settleDuration?: number;
  settleBlur?: number;
  working?: boolean;
  settleAfter?: number;
  elapsed?: number;
  showTimer?: boolean;
  onSettle?: (seconds: number) => void;
  className?: string;
  style?: CSSProperties;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const GLYPH_DONE = 0.55;
const EMPTY_STEPS: string[] = [];

const fmt = (ds: number) =>
  ds < 600 ? `${(ds / 10).toFixed(1)}s` : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;
const spoken = (ds: number) =>
  ds < 600
    ? `${(ds / 10).toFixed(1)} seconds`
    : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;

const STYLE = `
@keyframes thought-line-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.2); }
}
@keyframes thought-line-shimmer {
  0% { background-position: 125% 0; }
  100% { background-position: -125% 0; }
}
@keyframes thought-line-breath {
  0%, 100% { opacity: 0.45; transform: scale(0.94); }
  50% { opacity: 1; transform: scale(1.08); }
}
@keyframes thought-step-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes thought-tick-pop {
  0% { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}
.tl-shimmer-text {
  background-image: linear-gradient(
    100deg,
    var(--tl-color, #0f172a) 15%,
    #6366f1 45%,
    #a855f7 50%,
    #6366f1 55%,
    var(--tl-color, #0f172a) 85%
  ) !important;
  background-size: 250% 100% !important;
  background-position: 125% 0;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  animation: thought-line-shimmer var(--tl-shimmer, 1.8s) linear infinite !important;
}
.tl-pulse-dot {
  animation: thought-line-pulse 1.4s cubic-bezier(0.77, 0, 0.175, 1) infinite !important;
}
.tl-breath-glyph {
  display: inline-flex;
  animation: thought-line-breath var(--tl-breath, 1.6s) cubic-bezier(0.77, 0, 0.175, 1) infinite !important;
}
.tl-step-enter {
  animation: thought-step-in 240ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
.tl-tick-enter {
  animation: thought-tick-pop 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
.tl-trace-grid {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows var(--tl-settle, 350ms) cubic-bezier(0.23, 1, 0.32, 1), opacity var(--tl-settle, 350ms) ease;
  overflow: hidden;
}
.tl-trace-grid.tl-collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
}
.tl-timer-text {
  font-variant-numeric: tabular-nums;
  transition: opacity var(--tl-settle, 350ms) ease, transform var(--tl-settle, 350ms) cubic-bezier(0.77, 0, 0.175, 1);
}
`;

const ThoughtLine: React.FC<ThoughtLineProps> = ({
  label = 'Thinking…',
  doneLabel = '',
  renderLabel,
  glyph = 'sparkle',
  steps = EMPTY_STEPS,
  activeStep,
  collapsible = true,
  collapseOnSettle = true,
  color = '#0f172a',
  glyphColor = '',
  fontSize = 16,
  breathPeriod = 1.6,
  breathDepth = 0.45,
  shimmer = true,
  shimmerDuration = 1.8,
  settleDuration = 350,
  settleBlur = 2,
  working = true,
  settleAfter = 0,
  elapsed,
  showTimer = true,
  onSettle,
  className = '',
  style
}) => {
  const reduce = useReducedMotion();
  const [autoSettled, setAutoSettled] = useState(false);
  const [open, setOpen] = useState(true);
  const isWorking = working && !autoSettled;
  const doneText = doneLabel || (showTimer ? 'Thought for' : 'Done thinking');
  const hasTrace = steps.length > 0;
  const depth = reduce ? Math.min(breathDepth, 0.2) : breathDepth;
  const period = reduce ? breathPeriod * 1.5 : breathPeriod;
  const trough = 1 - depth;
  const sheen = shimmer && !reduce;

  const glyphRef = useRef<HTMLSpanElement>(null);
  const breathRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const stackRef = useRef<HTMLSpanElement>(null);
  const workRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<HTMLSpanElement>(null);
  const dsRef = useRef(0);
  const prevWorking = useRef(isWorking);
  const latest = useRef<{ onSettle?: (seconds: number) => void }>({});
  latest.current = { onSettle };
  const [announce, setAnnounce] = useState(label);

  useEffect(() => {
    if (working) setAutoSettled(false);
  }, [working]);

  useEffect(() => {
    if (isWorking) {
      setOpen(true);
    } else if (collapseOnSettle) {
      setOpen(false);
    }
  }, [isWorking, collapseOnSettle]);

  useEffect(() => {
    const glyphEl = glyphRef.current;
    const breathEl = breathRef.current;
    if (!breathEl) return undefined;
    const s = settleDuration / 1000;
    const loop = (el: HTMLElement, delay: number) =>
      animate(el, { opacity: [trough, 1, trough] }, { duration: period, ease: EASE_IN_OUT, repeat: Infinity, delay });
    let cancelled = false;
    const running: AnimationPlaybackControls[] = [];
    if (isWorking) {
      if (depth > 0) {
        if (sheen) running.push(animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
        if (glyphEl) {
          const lead = animate(glyphEl, { opacity: trough }, { duration: 0.2, ease: EASE_OUT });
          running.push(lead);
          lead.then(() => {
            if (cancelled) return;
            running.push(loop(glyphEl, 0));
            if (!sheen) running.push(loop(breathEl, 0.14));
          });
        } else if (!sheen) {
          running.push(loop(breathEl, 0.14));
        }
      } else {
        if (glyphEl) running.push(animate(glyphEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
        running.push(animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
      }
    } else {
      if (glyphEl) running.push(animate(glyphEl, { opacity: GLYPH_DONE }, { duration: s, ease: EASE_OUT }));
      running.push(animate(breathEl, { opacity: 1 }, { duration: s, ease: EASE_OUT }));
    }
    return () => {
      cancelled = true;
      running.forEach(a => a.stop());
    };
  }, [isWorking, period, depth, trough, settleDuration, glyph, sheen]);

  const paint = (ds: number) => {
    dsRef.current = ds;
    if (timerRef.current) timerRef.current.textContent = fmt(ds);
  };

  useLayoutEffect(() => {
    if (elapsed != null) {
      paint(Math.round(elapsed * 10));
      return undefined;
    }
    if (!isWorking) return undefined;
    const startedAt = performance.now();
    paint(0);
    const id = setInterval(() => {
      const ds = Math.floor((performance.now() - startedAt) / 100);
      paint(ds);
      if (settleAfter > 0 && ds >= Math.round(settleAfter * 10)) setAutoSettled(true);
    }, 100);
    return () => clearInterval(id);
  }, [isWorking, elapsed, settleAfter]);

  useLayoutEffect(() => {
    const t = timerRef.current;
    const stack = stackRef.current;
    if (!t || !stack) return undefined;
    const place = (glide: boolean) => {
      const active = isWorking ? workRef.current : doneRef.current;
      if (!active) return;
      const shift = active.offsetWidth - stack.offsetWidth;
      if (!glide) t.style.transition = 'none';
      t.style.transform = `translateX(${shift}px)`;
      if (!glide) {
        void t.offsetWidth;
        t.style.transition = '';
      }
    };
    place(prevWorking.current !== isWorking);
    prevWorking.current = isWorking;
    const ro = new ResizeObserver(() => place(false));
    if (workRef.current) ro.observe(workRef.current);
    if (doneRef.current) ro.observe(doneRef.current);
    return () => ro.disconnect();
  }, [isWorking, label, doneText, fontSize, showTimer]);

  useEffect(() => {
    if (isWorking) {
      setAnnounce(label);
      return;
    }
    setAnnounce(showTimer ? `${doneText} ${spoken(dsRef.current)}` : doneText);
    latest.current.onSettle?.(dsRef.current / 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorking]);

  const toggle = hasTrace && collapsible;
  const head = (
    <>
      {glyph !== 'none' ? (
        <span
          ref={glyphRef}
          className={`mr-[0.3em] inline-flex h-[1.15em] w-[1.15em] flex-none [color:var(--tl-glyph)] [&>svg]:block [&>svg]:h-full [&>svg]:w-full transition-opacity duration-300 ${
            isWorking ? "tl-breath-glyph opacity-100" : "opacity-55"
          }`}
          aria-hidden="true"
        >
          {glyph === 'sparkle' ? (
            <HugeiconsIcon icon={SparklesIcon} size="100%" strokeWidth={2} />
          ) : glyph === 'dot' ? (
            <span className="m-auto h-[0.5em] w-[0.5em] rounded-full bg-current" />
          ) : (
            glyph
          )}
        </span>
      ) : null}
      <span ref={stackRef} className="inline-grid" aria-hidden="true">
        <span
          ref={workRef}
          className={`w-max [grid-area:1/1] transition-all duration-350 ease-out ${
            isWorking ? "opacity-100 filter-none pointer-events-auto" : "opacity-0 blur-[2px] pointer-events-none"
          }`}
        >
          <span
            ref={breathRef}
            className={`inline-block ${sheen && isWorking ? "tl-shimmer-text" : ""}`}
          >
            {renderLabel ? renderLabel(label, true) : label}
          </span>
        </span>
        <span
          ref={doneRef}
          className={`w-max [grid-area:1/1] transition-all duration-350 ease-out ${
            !isWorking ? "opacity-[var(--tl-done)] filter-none pointer-events-auto" : "opacity-0 blur-[2px] pointer-events-none"
          }`}
        >
          {renderLabel ? renderLabel(doneText, false) : doneText}
        </span>
      </span>
      {showTimer ? (
        <span
          ref={timerRef}
          className={`tl-timer-text ml-[0.3em] ${
            isWorking ? "opacity-75 font-semibold text-slate-900" : "opacity-55 font-normal text-slate-600"
          }`}
          aria-hidden="true"
        >
          0.0s
        </span>
      ) : null}
      {collapsible ? (
        <span
          className={`ml-[0.25em] inline-flex items-center justify-center transition-transform duration-300 text-slate-500 hover:text-slate-900 ${
            hasTrace ? "opacity-70 cursor-pointer" : "opacity-0 pointer-events-none"
          } ${open ? "rotate-180" : "rotate-0"}`}
          aria-hidden="true"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size="1.05em" strokeWidth={2.4} />
        </span>
      ) : null}
      <span className="sr-only" role="status">
        {announce}
      </span>
    </>
  );

  return (
    <div
      className={`group inline-flex flex-col items-start leading-[1.25] font-medium [color:var(--tl-color)] [font-family:inherit] [font-size:var(--tl-font)]${className ? ` ${className}` : ''}`}
      data-working={isWorking ? '' : undefined}
      data-open={open && hasTrace ? '' : undefined}
      style={
        {
          '--tl-font': `${fontSize}px`,
          '--tl-color': color,
          '--tl-glyph': glyphColor || color,
          '--tl-settle': `${settleDuration}ms`,
          '--tl-blur': `${settleBlur}px`,
          '--tl-shimmer': `${shimmerDuration}s`,
          '--tl-breath': `${breathPeriod}s`,
          '--tl-done': '0.6',
          '--tl-timer': '0.6',
          ...style
        } as CSSProperties
      }
    >
      <style>{STYLE}</style>
      {collapsible ? (
        <button
          type="button"
          className="relative m-0 inline-flex cursor-default items-center gap-[0.2em] border-0 bg-transparent p-0 text-left whitespace-nowrap text-inherit outline-none [font:inherit] data-[toggle]:cursor-pointer data-[toggle]:[-webkit-tap-highlight-color:transparent]"
          data-toggle={toggle ? '' : undefined}
          aria-expanded={toggle ? open : undefined}
          tabIndex={toggle ? 0 : -1}
          onClick={() => {
            if (toggle) setOpen(v => !v);
          }}
        >
          {head}
        </button>
      ) : (
        <div className="relative m-0 inline-flex cursor-default items-center gap-[0.2em] border-0 bg-transparent p-0 text-left whitespace-nowrap text-inherit outline-none [font:inherit]">
          {head}
        </div>
      )}
      {hasTrace ? (
        <div
          className={`tl-trace-grid w-full ${open ? '' : 'tl-collapsed'}`}
          aria-hidden={!open}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col gap-[0.55em] pt-[0.65em] pb-[0.2em] pl-[1.6em] text-[0.875em] font-normal whitespace-nowrap">
              {steps.map((text, i) => {
                const done = !isWorking || (activeStep !== undefined ? i < activeStep : i < steps.length - 1);
                return (
                  <div
                    key={`${i}-${text}`}
                    className="flex items-center gap-[0.55em] tl-step-enter whitespace-nowrap"
                  >
                    <span
                      className="inline-grid h-[1em] w-[1em] flex-none place-items-center opacity-70"
                      aria-hidden="true"
                    >
                      {done ? (
                        <HugeiconsIcon icon={Tick02Icon} size="1.15em" strokeWidth={2.8} className="text-emerald-600 tl-tick-enter" />
                      ) : (
                        <i className="block h-[0.45em] w-[0.45em] rounded-full bg-slate-900 tl-pulse-dot" />
                      )}
                    </span>
                    <span className={`transition-all duration-300 ${done ? "opacity-60 text-slate-700" : "opacity-100 text-slate-950 font-medium"}`}>
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ThoughtLine;
