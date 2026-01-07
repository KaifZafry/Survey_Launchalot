"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Building2,
  ClipboardList,
  HelpCircle,
  ListChecks,
  BarChart2,
  LogOut,
  X,
  CircuitBoard,
} from "lucide-react";
import clsx from "clsx";

function Group({
  title,
  icon,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3 text-left font-semibold text-gray-900"
      >
        {icon}
        <span className="text-[18px]">{title}</span>
        {isOpen ? (
          <ChevronDown className="ml-auto h-5 w-5" />
        ) : (
          <ChevronRight className="ml-auto h-5 w-5" />
        )}
      </button>
      <div className="border-b border-black/30 mx-4" />
      {isOpen && (
        <div className="mt-1 mb-3 ml-10 flex flex-col gap-1">{children}</div>
      )}
    </div>
  );
}

function Item({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-md px-3 py-2 text-[16px] font-medium",
        active ? "bg-[#93cfcf] text-black" : "hover:bg-[#9ed6d6] text-gray-900"
      )}
    >
      {children}
    </Link>
  );
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const toggleGroup = (title: string) => {
    setOpenGroup((prev) => (prev === title ? null : title));
  };

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-50 w-[300px] sm:w-[200px] bg-[#a7d8d8] shadow-[0_10px_30px_rgba(0,0,0,0.1)] transform transition-transform duration-300 lg:static lg:z-auto lg:w-[280px] lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      role="dialog"
      aria-modal="true"
    >
      {/* Mobile close button row */}
      <div className="flex items-center justify-end lg:hidden px-4 pt-4">
        <button
          onClick={onClose}
          className="rounded-md p-2 hover:bg-[#9ed6d6]"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Dashboard quick link */}
      <div className="mx-3 mt-2 lg:mt-4 rounded-md bg-[#93cfcf]">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-5 py-3 text-[18px] font-semibold text-black"
          onClick={onClose}
        >
          <LayoutGrid className="h-5 w-5" />
          Dashboard
        </Link>
      </div>
      <div className="border-b border-black/30 mx-4 my-3" />

      <Group
        title="Company"
        icon={<Building2 className="h-5 w-5" />}
        isOpen={openGroup === "Company"}
        onToggle={() => toggleGroup("Company")}
      >
        <Item href="/company">Manage Company</Item>
      </Group>

      <Group
        title="Survey"
        icon={<ClipboardList className="h-5 w-5" />}
        isOpen={openGroup === "Survey"}
        onToggle={() => toggleGroup("Survey")}
      >
        <Item href="/surveys/new">Add Survey</Item>
        <Item href="/surveys">Manage Survey</Item>
      </Group>

      <Group
        title="Survey Question"
        icon={<HelpCircle className="h-5 w-5" />}
        isOpen={openGroup === "Survey Question"}
        onToggle={() => toggleGroup("Survey Question")}
      >
        <Item href="/questions/new">Add Survey Question</Item>
        <Item href="/questions">List Survey Question</Item>
      </Group>

      <Group
        title="Question Options"
        icon={<ListChecks className="h-5 w-5" />}
        isOpen={openGroup === "Question Options"}
        onToggle={() => toggleGroup("Question Options")}
      >
        <Item href="/options/new">Add Question Option</Item>
      </Group>

      <Group
        title="Survey Result"
        icon={<BarChart2 className="h-5 w-5" />}
        isOpen={openGroup === "Survey Result"}
        onToggle={() => toggleGroup("Survey Result")}
      >
        <Item href="/results">List Survey Result</Item>
      </Group>

      <Group title="UI Configuration"
        icon={<CircuitBoard className="h-5 w-5" />}
        isOpen={openGroup === "UI Configuration"}
        onToggle={() => toggleGroup("UI Configuration")}
      >
        <Item href="/ui-config">Disclaimer UI-Config</Item>
        <Item href="/thankyou-config">Thank You UI-Config</Item>
      </Group>

      <div className="mt-4">
        <div className="border-b border-black/30 mx-4" />
        <Link
          href="/login"
          className="mt-2 flex items-center gap-3 px-5 py-3 text-[18px] font-semibold hover:bg-[#9ed6d6]"
          onClick={onClose}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
