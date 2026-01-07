import { LucideIcon } from "lucide-react";

export default function StatCard({
  title,
  value,
  Icon,
}: {
  title: string;
  value: number | string;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-[22px] bg-[#bfe3df] p-6 sm:p-8 md:p-4 text-center shadow-[0_14px_50px_rgba(0,0,0,0.15)]">
      <Icon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#0d3b5d]" />
      <div className="mt-4 text-2xl sm:text-3xl md:text-[32px] font-bold text-black leading-tight">
        {title}
      </div>
      <div className="mt-3 sm:mt-4 text-3xl sm:text-3xl font-extrabold text-black">
        {value}
      </div>
    </div>
  );
}
