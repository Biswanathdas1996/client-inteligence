import { Link } from "wouter";

export function PwcLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-1 hover:opacity-90 transition-opacity">
      <span className="font-bold text-2xl tracking-tighter text-black lowercase leading-none">pwc</span>
      <div className="grid grid-cols-2 grid-rows-2 gap-[1px] ml-1">
        <div className="w-[6px] h-[6px] bg-[#FFB600]" />
        <div className="w-[6px] h-[6px] bg-[#E45C2B]" />
        <div className="w-[6px] h-[6px] bg-[#DC6900]" />
        <div className="w-[6px] h-[6px] bg-[#E0301E]" />
      </div>
    </Link>
  );
}
