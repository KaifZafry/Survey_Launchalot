"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import client from "@/lib/client";

type Company = { id: string; name: string };
type Survey = { id: string; companyId: string; name: string };
type Question = {
  id: string;
  surveyId: string;
  text: string;
  type: "radio" | "checkbox" | "text" | string;
};
type Option = { id: string; questionId: string; text: string; risk?: string };

type ResultRow = {
  id: string;
  companyId?: string;
  surveyId?: string;
  questionId?: string;
  optionId?: string;
  questionText?: string;
  optionText?: string;
  type?: string;
  total?: number;
  percentage?: number; // 0..100
};

const PAGE_SIZES = [10, 25, 50, 100];

function Th({
  label,
  sortable = false,
  className = "",
}: {
  label: string;
  sortable?: boolean;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3 font-semibold text-gray-700 ${className}`}>
      <div className="inline-flex items-center gap-1">
        {label}
        {sortable ? (
          <span className="ml-1 text-xs text-gray-400 leading-none">▲▼</span>
        ) : null}
      </div>
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
        "h-9 rounded-md border px-3 text-[13px] font-semibold " +
        (disabled
          ? "cursor-not-allowed text-gray-400"
          : "hover:bg-gray-100 text-gray-700")
      }
    >
      {label}
    </button>
  );
}

export default function SurveyResultsPage() {
  // data
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });
  const { data: surveys = [] } = useQuery<Survey[]>({
    queryKey: ["surveys"],
    queryFn: () => client.get("/surveys"),
  });
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: () => client.get("/questions"),
  });
  const { data: options = [] } = useQuery<Option[]>({
    queryKey: ["options"],
    queryFn: () => client.get("/options"),
  });
  const { data: results = [], isLoading } = useQuery<ResultRow[]>({
    queryKey: ["results"],
    queryFn: () => client.get("/results"),
  });

  // maps for quick name lookups
  const companyName = useMemo(() => {
    const m = new Map<string, string>();
    companies.forEach((c) => m.set(c.id, c.name));
    return (id?: string) => (id ? m.get(id) ?? "-" : "-");
  }, [companies]);

  const surveyById = useMemo(() => {
    const m = new Map<string, Survey>();
    surveys.forEach((s) => m.set(s.id, s));
    return (id?: string) => (id ? m.get(id) : undefined);
  }, [surveys]);

  const questionById = useMemo(() => {
    const m = new Map<string, Question>();
    questions.forEach((q) => m.set(q.id, q));
    return (id?: string) => (id ? m.get(id) : undefined);
  }, [questions]);

  const optionById = useMemo(() => {
    const m = new Map<string, Option>();
    options.forEach((o) => m.set(o.id, o));
    return (id?: string) => (id ? m.get(id) : undefined);
  }, [options]);

  // filters in the blue card
  const [filterCompanyId, setFilterCompanyId] = useState<string>("");
  const [filterSurveyId, setFilterSurveyId] = useState<string>("");

  const surveysForCompany = useMemo(() => {
    if (!filterCompanyId) return surveys;
    return surveys.filter((s) => s.companyId === filterCompanyId);
  }, [surveys, filterCompanyId]);

  // table UI state
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const normalizedRows = useMemo(() => {
    return results.map((r) => {
      const q = r.questionId ? questionById(r.questionId) : undefined;
      const s = r.surveyId
        ? surveyById(r.surveyId)
        : q
        ? surveyById(q.surveyId)
        : undefined;
      const companyId = r.companyId ?? s?.companyId;
      const surveyId = r.surveyId ?? s?.id;
      const type = r.type ?? q?.type ?? "-";
      const questionText = r.questionText ?? q?.text ?? "-";
      const opt = r.optionId ? optionById(r.optionId) : undefined;
      const optionText = r.optionText ?? opt?.text ?? "-";
      return {
        ...r,
        companyId,
        surveyId,
        type,
        questionText,
        optionText,
        total: r.total ?? 0,
        percentage: r.percentage ?? 0,
      };
    });
  }, [results, questionById, surveyById, optionById]);

  // apply filters + search
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedRows.filter((row) => {
      if (filterCompanyId && row.companyId !== filterCompanyId) return false;
      if (filterSurveyId && row.surveyId !== filterSurveyId) return false;
      if (!q) return true;
      const blob = [
        companyName(row.companyId),
        surveyById(row.surveyId)?.name ?? "-",
        row.questionText ?? "-",
        row.type ?? "-",
        row.optionText ?? "-",
        String(row.total ?? ""),
        String(row.percentage ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [
    normalizedRows,
    search,
    filterCompanyId,
    filterSurveyId,
    companyName,
    surveyById,
  ]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageStart = pageIndex * pageSize;
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);
  const showingFrom = filteredRows.length ? pageStart + 1 : 0;
  const showingTo = Math.min(filteredRows.length, pageStart + pageSize);
  if (pageIndex > pageCount - 1) setPageIndex(Math.max(0, pageCount - 1));

  return (
    <section className="space-y-6 overflow-x-hidden">
      {/* Top filter card */}
      <div className="rounded-[18px] bg-[#bfe3df] p-6">
        <h2 className="mb-4 text-[24px] font-semibold">
          Survey Result By Company and Category
        </h2>

        <div className="space-y-8">
          <div>
            <div className="mb-1 text-xs">Company</div>
            <select
              value={filterCompanyId}
              onChange={(e) => {
                setFilterCompanyId(e.target.value);
                setFilterSurveyId("");
                setPageIndex(0);
              }}
              className="h-10 w-[280px] rounded-sm bg-[#1c8ed8] px-3 text-white outline-none"
            >
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs">Category</div>
            <select
              value={filterSurveyId}
              onChange={(e) => {
                setFilterSurveyId(e.target.value);
                setPageIndex(0);
              }}
              className="h-10 w-[280px] rounded-sm bg-[#1c8ed8] px-3 text-white outline-none disabled:opacity-60"
              disabled={!!filterCompanyId && !surveysForCompany.length}
            >
              <option value="">Category</option>
              {surveysForCompany.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results card */}
      <div className="rounded-[18px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-4 text-[24px] font-semibold">Survey Result</h1>

        {/* controls */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <span className="text-[15px]">Show</span>
            <select
              className="h-9 w-20 rounded-md border bg-[#bfe3df] px-2 text-center text-[15px] outline-none"
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
            <span className="text-[15px]">entries</span>
          </div>

          <div className="flex items-center justify-start md:justify-end">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(0);
              }}
              placeholder="Search records"
              className="h-10 w-[240px] rounded-md border border-gray-300 px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#9ed6d6]"
            />
          </div>
        </div>

        {/* ===== MOBILE LIST  ===== */}
        <ul className="space-y-3 md:hidden">
          {isLoading ? (
            <li className="rounded-lg border p-4 text-center text-gray-500">
              Loading…
            </li>
          ) : pageRows.length ? (
            pageRows.map((row, i) => {
              const s = row.surveyId ? surveyById(row.surveyId) : undefined;
              return (
                <li key={row.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      #{pageStart + i + 1}
                    </span>
                    <span className="rounded-md bg-[#6bcac4] px-2 py-0.5 text-[11px] font-bold text-black shadow-[0_2px_0_0_#ea8f7b]">
                      {String(row.type ?? "-").toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-semibold break-words">
                    {row.questionText ?? "-"}
                  </div>
                  <div className="text-xs text-gray-600 break-words">
                    <span className="font-semibold">Company:</span>{" "}
                    {companyName(row.companyId ?? s?.companyId)}
                  </div>
                  <div className="text-xs text-gray-600 break-words">
                    <span className="font-semibold">Category:</span>{" "}
                    {s?.name ?? "-"}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 break-words">
                    <span className="font-semibold">Option:</span>{" "}
                    {row.optionText ?? "-"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <span className="rounded bg-gray-100 px-2 py-1">
                      Total: <b>{row.total ?? 0}</b>
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-1">
                      %:{" "}
                      <b>
                        {typeof row.percentage === "number"
                          ? Math.round(row.percentage)
                          : 0}
                        %
                      </b>
                    </span>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="rounded-lg border p-4 text-center text-gray-500">
              No data available
            </li>
          )}
        </ul>

        {/* ===== DESKTOP TABLE  ===== */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full table-fixed">
              <thead className="bg-gray-100">
                <tr className="text-left text-[15px]">
                  <Th label="S.No." sortable />
                  <Th label="Company Name" sortable />
                  <Th label="Survey" sortable />
                  <Th label="Question" sortable />
                  <Th label="Type" sortable />
                  <Th label="Option" sortable />
                  <Th label="Total" sortable />
                  <Th label="Percentage" sortable />
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((row, i) => {
                    const s = row.surveyId
                      ? surveyById(row.surveyId)
                      : undefined;
                    return (
                      <tr
                        key={row.id}
                        className="bg-white hover:bg-gray-50 align-top"
                      >
                        <td className="px-4 py-4 text-[15px]">
                          {pageStart + i + 1}
                        </td>
                        <td className="px-4 py-4 text-[15px] break-words">
                          {companyName(row.companyId ?? s?.companyId)}
                        </td>
                        <td className="px-4 py-4 text-[15px] break-words">
                          {s?.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-[15px]">
                          <div className="whitespace-pre-wrap break-words">
                            {row.questionText ?? "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[15px] capitalize">
                          {row.type ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-[15px] break-words">
                          {row.optionText ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-[15px]">
                          {row.total ?? 0}
                        </td>
                        <td className="px-4 py-4 text-[15px]">
                          {typeof row.percentage === "number"
                            ? `${Math.round(row.percentage)}%`
                            : "0%"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot className="bg-gray-100">
                <tr className="text-left text-[15px]">
                  <Th label="S.No." sortable />
                  <Th label="Company Name" sortable />
                  <Th label="Survey" sortable />
                  <Th label="Question" sortable />
                  <Th label="Type" sortable />
                  <Th label="Option" sortable />
                  <Th label="Total" sortable />
                  <Th label="Percentage" sortable />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* footer / pager */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-[14px] text-gray-700">
            Showing <b>{showingFrom}</b> to <b>{showingTo}</b> of{" "}
            <b>{filteredRows.length}</b> entries
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
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1c8ed8] px-3 text-white">
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
