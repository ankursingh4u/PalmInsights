"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Bottom tab bar shown only in app mode. Fixed to the bottom, safe-area aware.

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <path
        d="M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function ScanIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      {/* viewfinder corners */}
      <path
        d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* palm/sparkle */}
      <path
        d="M12 8.5v7M9 10v3.5M15 10v3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={active ? 1 : 0.85}
      />
    </svg>
  );
}

function ReadingsIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <path
        d="M12 6.5C10.5 5 8.5 4.5 5 4.7A1 1 0 0 0 4 5.7v12.1a1 1 0 0 0 1.1 1c3-.2 5 .3 6.9 1.7 1.9-1.4 3.9-1.9 6.9-1.7a1 1 0 0 0 1.1-1V5.7a1 1 0 0 0-1-1c-3.5-.2-5.5.3-7 1.8Zm0 0V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function ProfileIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="8.5"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <path
        d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon, exact: true },
  { href: "/scan", label: "Scan", Icon: ScanIcon, exact: false },
  { href: "/readings", label: "Readings", Icon: ReadingsIcon, exact: false },
  { href: "/profile", label: "Profile", Icon: ProfileIcon, exact: false },
] as const;

export function AppTabBar() {
  const pathname = usePathname() || "/";

  return (
    <nav className="app-tabbar" aria-label="Primary">
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`app-tab ${active ? "app-tab--active" : ""}`}
              >
                <span className="app-tab__dot" aria-hidden />
                <Icon active={active} />
                <span className="app-tab__label">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
