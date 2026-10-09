import type { ReactElement, SVGProps } from "react";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const PATHS: Record<string, ReactElement> = {
  arrow: <path {...S} strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />,
  back: <path {...S} strokeWidth={2} d="M19 12H5M11 6l-6 6 6 6" />,
  check: <path {...S} strokeWidth={2.6} d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path {...S} strokeWidth={2.5} d="M6 6l12 12M18 6L6 18" />,
  coin: <g {...S}><circle cx="12" cy="12" r="9" /><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 3 5.6 1.4 5.6 4.3 0 1.3-1.2 2.1-2.8 2.1-1.3 0-2.4-.5-2.9-1.5M12 6v1.8M12 16.2V18" /></g>,
  shield: <g {...S}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></g>,
  pie: <g {...S}><path d="M21 12A9 9 0 1112 3v9h9z" /><path d="M15 3.5A9 9 0 0120.5 9H15V3.5z" /></g>,
  percent: <g {...S}><path d="M19 5L5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></g>,
  cap: <g {...S}><path d="M2 9l10-5 10 5-10 5L2 9z" /><path d="M6 11v5c2 2 10 2 12 0v-5M22 9v6" /></g>,
  users: <g {...S}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.8.7 3 2.5 3.5 5.2" /></g>,
  doc: <g {...S}><path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></g>,
  file: <g {...S}><path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" /><path d="M14 3v5h5" /></g>,
  bulb: <path {...S} d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />,
  store: <path {...S} d="M4 9l1.5-5h13L20 9M4 9h16M4 9c0 1.7 1.3 3 3 3s2.7-1.3 2.7-3c0 1.7 1.3 3 2.3 3s2.3-1.3 2.3-3c0 1.7 1 3 2.7 3s3-1.3 3-3M5 12v8h14v-8M10 20v-5h4v5" />,
  book: <path {...S} d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2V5zM4 20a2 2 0 002 2h13v-4M9 8h6" />,
  search: <g {...S} strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></g>,
  person: <g fill="currentColor"><circle cx="12" cy="7" r="4" /><path d="M4 21c.6-4.4 3.8-7 8-7s7.4 2.6 8 7H4z" /></g>,
  download: <path {...S} strokeWidth={2} d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  menu: <path {...S} strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />,
  cloud: <path {...S} d="M7 18a4.5 4.5 0 01-.6-9A6 6 0 0118 9.5a4 4 0 01-.5 8.5H7zM9.5 13.5l2 2 3.5-3.5" />,
  upload: <path {...S} d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  edit: <path {...S} d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  print: <path {...S} d="M7 9V3h10v6M7 17H4v-7a1 1 0 011-1h14a1 1 0 011 1v7h-3M7 14h10v7H7z" />,
  copy: <g {...S}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></g>,
  info: <g {...S}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></g>,
  warn: <path {...S} d="M12 3l10 18H2L12 3zM12 10v5M12 18v.5" />,
  trash: <path {...S} d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  logout: <path {...S} d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  grid: <g {...S}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></g>,
  inbox: <path {...S} d="M4 13l2.5-8h11L20 13M4 13v6h16v-6M4 13h4.5l1 2h5l1-2H20" />,
  map: <path {...S} d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4zM9 4v13.5M15 6.5V20" />,
  server: <g {...S}><rect x="4" y="4" width="16" height="7" rx="1.5" /><rect x="4" y="13" width="16" height="7" rx="1.5" /><path d="M8 7.5h.01M8 16.5h.01" strokeWidth={2.6} /></g>,
  globe: <g {...S}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></g>,
  sidebar: <g {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></g>,
  trend: <path {...S} d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  refresh:<path {...S} d="M20 11a8 8 0 00-14.9-3M4 4v4h4M4 13a8 8 0 0014.9 3M20 20v-4h-4" />
};

export function Icon({ name, ...p }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...p}>
      {PATHS[name] ?? null}
    </svg>
  );
}
