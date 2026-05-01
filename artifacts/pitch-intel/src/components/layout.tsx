import { ReactNode } from "react";
import { Link } from "wouter";
import { PwcLogo } from "./pwc-logo";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#2D2D2D]">
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-[#E5E5E5] shrink-0 no-print">
        <div className="flex items-center gap-8">
          <PwcLogo />
          <div className="h-6 w-px bg-[#E5E5E5]" />
          <h1 className="text-sm font-semibold tracking-wide uppercase text-[#696969]">Client Intelligence</h1>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-[#696969]">
          <Link href="/" className="hover:text-[#DC6900] transition-colors">
            Research
          </Link>
          <Link href="/about" className="hover:text-[#DC6900] transition-colors">
            Methodology
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col min-h-0 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC6900] no-print" />
        {children}
      </main>
    </div>
  );
}
