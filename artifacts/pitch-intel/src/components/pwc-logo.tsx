import { Link } from "wouter";

export function PwcLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-sm transition-opacity duration-200 hover:opacity-[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC6900]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <img
        src="/pwc-logo.png"
        alt="PwC"
        className="h-10 w-auto object-contain object-left select-none"
        decoding="async"
        draggable={false}
      />
    </Link>
  );
}
