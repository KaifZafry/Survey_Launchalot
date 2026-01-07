"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer when navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <Topbar onMenuClick={() => setOpen(true)} />

      <div className="relative">
        <div className="lg:grid lg:grid-cols-[280px_1fr]">
          <Sidebar open={open} onClose={() => setOpen(false)} />
          <main className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 w-full overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}
    </div>
  );
}
