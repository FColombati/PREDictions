"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const attivo = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link href={href} className={`relative pb-1 ${className}`}>
      {children}
      {attivo && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-accent-2 to-signal" />
      )}
    </Link>
  );
}
