"use client";

import Link from "next/link";

type Props = { current: "daily" | "calendar" };

const LINKS = [
  { key: "daily", href: "/", label: "Daily" },
  { key: "calendar", href: "/calendar", label: "ปฏิทิน" },
] as const;

export default function PageNav({ current }: Props) {
  return (
    <nav className="page-nav" aria-label="เมนูหลัก">
      {LINKS.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={link.key === current ? "page-nav-item active" : "page-nav-item"}
          aria-current={link.key === current ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
