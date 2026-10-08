// Small inline outline icons for the sidebar. No icon library dependency: each is a plain SVG.
type IconProps = { className?: string };
const base = "h-[18px] w-[18px]";
const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function PhotoIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="M3 16.5 8.5 12l3 2.5 4-4 5.5 5" />
    </svg>
  );
}

export function ChatIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M4 12c0-4.4 3.8-8 8.5-8S21 7.6 21 12s-3.8 8-8.5 8c-1.1 0-2.2-.2-3.1-.6L5 21l1.3-3.9C4.9 15.9 4 14 4 12Z" />
      <path d="M8.5 11h7M8.5 14h4.5" />
    </svg>
  );
}

export function CommentIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M20 13.5c0 3.6-3.6 6.5-8 6.5-.8 0-1.6-.1-2.3-.3L4 21l1.1-3.4C4.4 16.4 4 15 4 13.5 4 9.9 7.6 7 12 7s8 2.9 8 6.5Z" />
      <circle cx="9" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StoriesIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <rect x="3" y="5" width="13" height="15" rx="2.5" />
      <path d="M8 20.5V21c0 .8.7 1.5 1.5 1.5H19c1.1 0 2-.9 2-2v-9c0-.8-.7-1.5-1.5-1.5h-.5" />
    </svg>
  );
}

export function ChartIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M4 20V10M12 20V4M20 20v-7" />
      <path d="M2.5 20h19" />
    </svg>
  );
}

export function GearIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
    </svg>
  );
}

export function UsersIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M15.5 6.2c1.2.4 2 1.6 2 2.9 0 1.3-.8 2.4-2 2.9M17.8 14.7c2 .5 3.7 2.3 3.7 5.3" />
    </svg>
  );
}

export function EyeIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function HeartIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M12 20s-7.5-4.6-9.6-9.4C1.2 7.3 3 4 6.4 4c2 0 3.3 1 5.6 3.4C14.3 5 15.6 4 17.6 4 21 4 22.8 7.3 21.6 10.6 19.5 15.4 12 20 12 20Z" />
    </svg>
  );
}

export function BoltIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M13 3 4.5 13.5H11L10 21l8.5-10.5H12l1-7.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function SendIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M21 3 11 13" />
      <path d="M21 3 14.5 21l-3.5-8-8-3.5L21 3Z" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckCircleIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  );
}

export function XCircleIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

export function GridIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function TargetIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RefreshIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5" />
      <path d="M4 20v-4.5h4.5" />
    </svg>
  );
}

export function ChevronDownIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CalendarIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
    </svg>
  );
}

export function BellIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function MoreVerticalIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

export function SearchIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function FileIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.2" />
    </svg>
  );
}

export function PlayIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function TrashIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function InstagramIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HashtagIcon({ className = base }: IconProps) {
  return (
    <svg {...svgProps} className={className} aria-hidden>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

