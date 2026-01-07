"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Menu, UserCircle2, LogOut } from "lucide-react";
import client from "@/lib/client";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!menuRef.current || !btnRef.current) return;
      if (menuRef.current.contains(t) || btnRef.current.contains(t)) return;
      setOpenUserMenu(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleLogout() {
    try {
      await client.post("/auth/logout");
    } catch {
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b">
      <div className="relative flex h-16 sm:h-20 items-center justify-between pl-4 sm:pl-6 lg:pl-0 pr-4 sm:pr-6">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="relative h-10 sm:h-12 md:h-16 w-[200px] sm:w-[280px] md:w-[280px] max-w-[55vw] bg-[#a8dcdc]">
            <Image
              src="/launchalot-logo.png"
              alt="Launchalot"
              fill
              className="object-contain"
              sizes="(max-width: 640px) 200px, (max-width: 1024px) 280px, 360px"
              priority
            />
          </div>
        </div>

        {/* Center*/}
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 rounded-md border bg-white px-4 py-2 text-sm font-semibold shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
          LANGUAGE
        </div>

        {/* Right: user */}
        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpenUserMenu((v) => !v)}
            className="flex items-center gap-2 text-base sm:text-lg font-semibold rounded-md px-2 py-1 hover:bg-gray-100"
            aria-haspopup="menu"
            aria-expanded={openUserMenu}
          >
            <UserCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="hidden xs:inline">SUPER ADMIN</span>
          </button>

          {/* Dropdown */}
          {openUserMenu && (
            <div
              ref={menuRef}
              role="menu"
              className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg z-50 overflow-hidden"
            >
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
