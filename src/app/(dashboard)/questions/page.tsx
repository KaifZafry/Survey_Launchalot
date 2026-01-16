"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import client from "../../../lib/client";


type Company = { id: string; name: string };
type Survey = { id: string; companyId: string; name: string };
type Question = {
  id: string;
  companyId: string;
  surveyId: string;
  segment?: string;
  segmentTitle?: string;
  text: string;
  details?: string;
  image?:string;
  type: "radio" | "checkbox" | "text" | "textarea" | "number";
  order?: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

function TealButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-md bg-[#6bcac4] px-4 py-1.5 text-[14px] font-bold text-white " +
        "shadow-[0_2px_0_0_#ea8f7b] hover:brightness-95 disabled:opacity-50 " +
        (props.className ?? "")
      }
    />
  );
}
function TealLinkButton(
  props: React.ComponentProps<typeof Link> & { children: React.ReactNode }
) {
  return (
    <Link
      {...props}
      className={
        "inline-flex items-center justify-center rounded-md bg-[#6bcac4] " +
        "px-4 py-1.5 text-[14px] font-bold text-white shadow-[0_2px_0_0_#ea8f7b] hover:brightness-95 " +
        (props.className ?? "")
      }
    />
  );
}
function Th({ label, className = "" }: { label: string; className?: string }) {
  return (
    <th
      className={`px-3 py-2 font-semibold text-gray-700 text-[14px] ${className}`}
    >
      {label}
    </th>
  );
}
function PagerButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "h-8 rounded-md border px-3 text-[14px] font-semibold " +
        (disabled
          ? "cursor-not-allowed text-gray-400"
          : "hover:bg-gray-100 text-gray-700")
      }
    >
      {label}
    </button>
  );
}

export default function ListQuestionsPage() {
  const qc = useQueryClient();
  const [selectedSurvey, setSelectedSurvey] = useState<string>("all");

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });
  const { data: surveys = [] } = useQuery<Survey[]>({
    queryKey: ["surveys"],
    queryFn: () => client.get("/surveys"),
  });
  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: () => client.get("/questions"),
  });

  const companyName = useMemo(() => {
    const m = new Map<string, string>();
    companies.forEach((c) => m.set(c.id, c.name));
    return (id: string) => m.get(id) ?? "-";
  }, [companies]);

  const surveyName = useMemo(() => {
    const m = new Map<string, string>();
    surveys.forEach((s) => m.set(s.id, s.name));
    return (id: string) => m.get(id) ?? "-";
  }, [surveys]);

  // filters + paging
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageIndex, setPageIndex] = useState<number>(0);

 const filtered = useMemo(() => {
  let list = questions;

  // Filter by survey selection
  if (selectedSurvey !== "all") {
    list = list.filter((x) => x.surveyId === selectedSurvey);
  }

  // Search filter
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter((x) => {
      const fields = [
        companyName(x.companyId).toLowerCase(),
        surveyName(x.surveyId).toLowerCase(),
        x.segment?.toLowerCase() ?? "",
        x.segmentTitle?.toLowerCase() ?? "",
        x.text.toLowerCase(),
        x.details?.toLowerCase() ?? "",
        x.type.toLowerCase(),
      ];
      return fields.some((f) => f.includes(q));
    });
  }

  return list;
}, [questions, search, selectedSurvey, companyName, surveyName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = pageIndex * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);
  const showingFrom = filtered.length ? pageStart + 1 : 0;
  const showingTo = Math.min(filtered.length, pageStart + pageSize);
  if (pageIndex > pageCount - 1) setPageIndex(Math.max(0, pageCount - 1));

  // actions
  const del = useMutation({
    mutationFn: (id: string) => client.del(`/questions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        {/* header controls */}
        <div className="mb-3">
          <h1 className="mb-4 text-[22px] font-semibold">
            List Survey Questions
          </h1>
          <div className="grid grid-cols-1 gap-3  md:grid-cols-[1fr_2fr]">
            <div className="flex items-center gap-2">
              <span className="text-[14px]">Show</span>
              <select
                className="h-8 w-20 rounded-md border bg-[#bfe3df] px-2 text-center text-[14px] outline-none"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0);
                }}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-[14px]">entries</span>
            </div>
            <div className="flex md:items-center flex-col md:flex-row items-start justify-end gap-2">
              {/* Survey filter */}
              <select
                value={selectedSurvey}
                onChange={(e) => {
                  setSelectedSurvey(e.target.value);
                  setPageIndex(0);
                }}
                className="h-9 rounded-md border border-gray-300 px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#9ed6d6]"
              >
                <option value="all">All Surveys</option>
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <TealLinkButton href="/questions/new">
                ADD SURVEY QUESTION
              </TealLinkButton>

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
                placeholder="Search records"
                className="h-9 w-[240px] rounded-md border border-gray-300 px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#9ed6d6]"
              />
            </div>
          </div>
        </div>

        {/* ===== MOBILE LIST  */}
        <ul className="space-y-3 md:hidden">
          {isLoading ? (
            <li className="rounded-lg border p-4 text-center text-gray-500 text-[14px]">
              Loading…
            </li>
          ) : pageRows.length ? (
            pageRows.map((q, i) => (
              <li key={q.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    #{pageStart + i + 1}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-[#6bcac4] px-3 py-1 text-[11px] font-bold text-black shadow-[0_2px_0_0_#ea8f7b]">
                    {q.type.toUpperCase()}
                  </span>
                </div>

                <div className="mt-2 text-sm font-semibold break-words">
                  {q.text}
                </div>
                <div className="mt-1 text-xs text-gray-600 break-words">
                  <span className="font-semibold">Company:</span>{" "}
                  {companyName(q.companyId)}
                </div>
                <div className="text-xs text-gray-600 break-words">
                  <span className="font-semibold">Survey:</span>{" "}
                  {surveyName(q.surveyId)}
                </div>
                <div className="mt-1 text-xs text-gray-600 break-words">
                  <span className="font-semibold">Segment:</span>{" "}
                  {q.segment || "—"}
                </div>
                <div className="text-xs text-gray-600 break-words">
                  <span className="font-semibold">Segment title:</span>{" "}
                  {q.segmentTitle || "—"}
                </div>
                <div className="mt-1 text-xs text-gray-600 break-words">
                  <span className="font-semibold">Details:</span>{" "}
                  {q.details || "—"}
                </div>

                {q.image && (
  <div className="mt-2">
    <img
      src={`${process.env.NEXT_PUBLIC_API_URL}${q.image}`}
      alt="Question image"
      className="w-full max-h-48 rounded-md object-cover border"
    />
  </div>
)}


                <div className="mt-3 flex flex-wrap gap-2">
                  <TealLinkButton href={`/questions/${q.id}/edit`}>
                    UPDATE
                  </TealLinkButton>
                  <TealButton onClick={() => del.mutate(q.id)}>
                    DELETE
                  </TealButton>
                </div>
              </li>
            ))
          ) : (
            <li className="rounded-lg border p-4 text-center text-gray-500 text-[14px]">
              No records found
            </li>
          )}
        </ul>

        {/* ===== DESKTOP TABLE  ===== */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr className="text-left">
                  <Th label="S.No." />
                  <Th label="Company" />
                  {/* <Th label="Survey" /> */}
                  <Th label="Segment" />
                  <Th label="Segment Title" />
                  <Th label="Question" />
                  <Th label="Details" />
                  <Th label="Image" />
                  <Th label="Type" />
                  <Th label="Action" />
                  <Th label="Update" />
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-gray-500 text-[14px]"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((q, i) => (
                    <tr
                      key={q.id}
                      className="bg-white hover:bg-gray-50 align-middle"
                    >
                      <td className="px-3 py-2 text-[14px]">
                        {pageStart + i + 1}
                      </td>
                      <td className="px-3 py-2 text-[14px] whitespace-nowrap ">
                        {companyName(q.companyId)}
                      </td>
                      {/* <td className="px-3 py-2 text-[14px] whitespace-nowrap ">
                        {surveyName(q.surveyId)}
                      </td> */}
                      <td className="px-3 py-2 text-[14px] whitespace-nowrap ">
                        {q.segment || "-"}
                      </td>
                      <td className="px-3 py-2 text-[14px] whitespace-nowrap ">
                        {q.segmentTitle || "-"}
                      </td>
                      <td className="px-3 py-2 text-[14px] whitespace-nowrap ">
                        {q.text}
                      </td>
                      <td className="px-3 py-2 text-[14px] whitespace-nowrap ">
                        {q.details || "-"}
                      </td>
                      <td className="px-3 py-2">
  {q.image ? (
    <img
      src={`${process.env.NEXT_PUBLIC_API_URL}${q.image}`}
      alt="Question image"
      className="h-14 w-20 rounded object-cover border"
    />
  ) : (
    <span className="text-gray-400 text-xs">—</span>
  )}
</td>

                      <td className="px-3 py-2 text-[14px]">{q.type}</td>
                      <td className="px-1 py-2">
                        <TealButton onClick={() => del.mutate(q.id)}>
                          DELETE
                        </TealButton>
                      </td>
                      <td className="px-3 py-2">
                        <TealLinkButton href={`/questions/${q.id}/edit`}>
                          UPDATE
                        </TealLinkButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-gray-500 text-[14px]"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* footer */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-[14px] text-gray-700">
            Showing <b>{showingFrom}</b> to <b>{showingTo}</b> of{" "}
            <b>{filtered.length}</b> entries
          </div>
          <div className="flex items-center gap-2">
            <PagerButton
              label="FIRST"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex(0)}
            />
            <PagerButton
              label="PREVIOUS"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            />
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#1c8ed8] px-3 text-white text-[14px]">
              {pageIndex + 1}
            </span>
            <PagerButton
              label="NEXT"
              disabled={pageIndex >= pageCount - 1}
              onClick={() =>
                setPageIndex((p) => Math.min(pageCount - 1, p + 1))
              }
            />
            <PagerButton
              label="LAST"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setPageIndex(pageCount - 1)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
