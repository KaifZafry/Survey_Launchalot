"use client";

import { useQuery } from "@tanstack/react-query";
import client from "@/lib/client";
import { FileText, HelpCircle, BarChart2, Bell } from "lucide-react";
import Link from "next/link";

type Summary = {
  companiesCount: number;
  questionsCount: number;
  resultsCount: number;
  pendingCount: number;
};

function Tile({
  icon,
  title,
  value,
  href
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  href:string;
}) {
  return (
    <Link href={href} className="block">
   <div className="rounded-[28px] bg-[#a5e7e7] p-5 shadow-[8px_8px_16px_#9dc1be,_-8px_-8px_16px_#e7fffd]">
  <div className="mb-4 flex justify-center">{icon}</div>
  <div className="text-center text-[26px] font-extrabold leading-tight">
    {title}
  </div>
  <div className="mt-2 text-center text-[32px] font-extrabold">{value}</div>
</div>
</Link>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<Summary>({
    queryKey: ["stats-summary"],
    queryFn: () => client.get<Summary>("/stats/summary"),
  });

  const fmt = (v?: number) => (isLoading ? "…" : (v ?? 0).toString());

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Tile
          icon={<FileText className="h-12 w-12 text-[#0c5b67]" />}
          title="Number of Companies"
          value={fmt(data?.companiesCount)}
          href="/company"
        />
        <Tile
          icon={<HelpCircle className="h-12 w-12 text-[#0c5b67]" />}
          title="Survey Questions"
          value={fmt(data?.questionsCount)}
          href="/surveys"
        />
        <Tile
          icon={<BarChart2 className="h-12 w-12 text-[#0c5b67]" />}
          title="Survey Results"
          value={fmt(data?.resultsCount)}
          href="/results"
        />
        <Tile
          icon={<Bell className="h-12 w-12 text-[#0c5b67]" />}
          title="Pending Feedback"
          value={fmt(data?.pendingCount)}
          href="/"
        />
      </div>
    </section>
  );
}
