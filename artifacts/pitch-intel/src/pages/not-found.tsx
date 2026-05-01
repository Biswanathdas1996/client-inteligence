import { Link } from "wouter";
import { PwcLogo } from "@/components/pwc-logo";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6 bg-[#FAFAFA]">
      <div className="w-full max-w-md bg-white p-8 border border-[#E5E5E5] text-center shadow-sm">
        <div className="flex justify-center mb-8">
          <PwcLogo />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">Page Not Found</h2>
        <p className="mt-4 text-sm text-[#696969] leading-relaxed">
          The page you are looking for does not exist or has been moved. 
          Please return to the main intelligence interface to generate a new report.
        </p>
        <Link 
          href="/" 
          className="mt-8 inline-flex h-10 items-center justify-center bg-[#DC6900] px-8 text-sm font-medium text-white hover:bg-[#c25d00] transition-colors"
        >
          Return to Research
        </Link>
      </div>
    </div>
  );
}
