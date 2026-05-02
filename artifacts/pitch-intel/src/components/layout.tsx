import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Settings as SettingsIcon } from "lucide-react";
import { PwcLogo } from "./pwc-logo";
import { useSettingsStatus } from "@/hooks/use-settings";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { anyConfigured } = useSettingsStatus();

  const navLink = (href: string, label: string) => {
    const active = location === href;
    return (
      <Link
        href={href}
        className={`transition-colors ${
          active ? "text-[#DC6900]" : "hover:text-[#DC6900]"
        }`}
      >
        {label}
      </Link>
    );
  };

  const settingsActive = location === "/settings";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#2D2D2D] print:h-auto print:min-h-0">
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-[#E5E5E5] shrink-0 no-print">
        <div className="flex items-center gap-8">
          <PwcLogo />
          <div className="h-8 w-px shrink-0 self-center bg-[#E5E5E5]" />
          <h1 className="text-sm font-semibold tracking-wide uppercase text-[#696969]">
            Client Intelligence
          </h1>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-[#696969]">
          {navLink("/", "Research")}
          {navLink("/about", "Methodology")}
          <Link
            href="/settings"
            className={`flex items-center gap-2 transition-colors ${
              settingsActive ? "text-[#DC6900]" : "hover:text-[#DC6900]"
            }`}
            aria-label="Settings"
          >
            <span className="relative flex items-center">
              <SettingsIcon className="h-4 w-4" />
              <span
                className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${
                  anyConfigured ? "bg-[#DC6900]" : "bg-[#E0301E]"
                }`}
                aria-hidden
              />
            </span>
            <span>Settings</span>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col min-h-0 relative print:h-auto print:min-h-0 print:flex-none print:overflow-visible">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC6900] no-print" />
        {children}
      </main>
    </div>
  );
}
