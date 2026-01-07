"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import client from "@/lib/client";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type Survey = {
  id: string;
  companyId: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  totalCount: number;
  url?: string | null;
};
type Company = { id: string; name: string };

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
    <th
      className={`px-3 py-2 font-semibold whitespace-nowrap text-gray-700 text-[14px] ${className}`}
    >
      <div className="inline-flex items-center gap-1">
        {label}
        {sortable ? (
          <span className="ml-1 text-[10px] text-gray-400 leading-none">
            ▲▼
          </span>
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
function StatusBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#6bcac4] px-3 py-1 text-[11px] font-bold text-white shadow-[0_2px_0_0_#ea8f7b]">
      {text}
    </span>
  );
}

// ---- page -------------------------------------------------------------------
export default function ManageSurveysPage() {
  const qc = useQueryClient();

  // data
  const { data: surveys = [], isLoading } = useQuery<Survey[]>({
    queryKey: ["surveys"],
    queryFn: () => client.get("/surveys"),
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });

  const companyName = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return (id: string) => map.get(id) ?? "-";
  }, [companies]);

  // UI state
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageIndex, setPageIndex] = useState<number>(0);

  // filter + paginate
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return surveys;
    return surveys.filter((s) => {
      const comp = companyName(s.companyId).toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        comp.includes(q) ||
        (s.url ?? "").toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      );
    });
  }, [surveys, search, companyName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = pageIndex * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);
  const showingFrom = filtered.length ? pageStart + 1 : 0;
  const showingTo = Math.min(filtered.length, pageStart + pageSize);
  if (pageIndex > pageCount - 1) setPageIndex(Math.max(0, pageCount - 1));

  // actions
  const del = useMutation({
    mutationFn: (id: string) => client.del(`/surveys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });

  const createUrl = useMutation({
    mutationFn: (s: Survey) => client.post(`/surveys/${s.id}/create-url`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });

  const copyToClipboard = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      // ignore
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        {/* heading + controls */}
        <div className="mb-4">
          <h1 className="mb-4 text-[22px] font-semibold">
            Manage Survey Details
          </h1>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* left: show entries */}
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

            {/* right: add button + search */}
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-end">
              <TealLinkButton href="/surveys/new">
                ADD NEW SURVEY
              </TealLinkButton>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
                placeholder="Search records"
                className="h-9 w-[220px] rounded-md border border-gray-300 px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#9ed6d6]"
              />
            </div>
          </div>
        </div>

        {/* ===== MOBILE LIST ===== */}
        <ul className="space-y-3 md:hidden">
          {isLoading ? (
            <li className="rounded-lg border p-4 text-center text-gray-500 text-[14px]">
              Loading…
            </li>
          ) : pageRows.length ? (
            pageRows.map((s, i) => (
              <li key={s.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    #{pageStart + i + 1}
                  </span>
                  <StatusBadge text={s.status} />
                </div>

                <div className="mt-2 text-sm font-semibold break-words">
                  {s.name}
                </div>
                <div className="text-xs text-gray-600 break-words">
                  {companyName(s.companyId)}
                </div>

                <div className="mt-2 text-xs">
                  <span className="font-semibold">URL: </span>
                  {s.url ? (
                    <a
                      href={s.url}
                      className="text-blue-700 "
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.url}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <TealLinkButton href={`/surveys/${s.id}/edit`}>
                    UPDATE
                  </TealLinkButton>
                  <TealButton onClick={() => del.mutate(s.id)}>
                    DELETE
                  </TealButton>
                  <TealButton
                    onClick={() => createUrl.mutate(s)}
                    disabled={createUrl.isPending}
                  >
                    {createUrl.isPending ? "CREATING…" : "CREATE URL"}
                  </TealButton>
                  <button
                    onClick={() => copyToClipboard(s.url)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border bg-white px-3 text-[14px] hover:bg-gray-50"
                    title="Copy URL"
                    type="button"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="rounded-lg border p-4 text-center text-gray-500 text-[14px]">
              No records found
            </li>
          )}
        </ul>

        {/* ===== DESKTOP TABLE (md and up) ===== */}
        <div className="hidden md:block">
          {/* <div className="overflow-x-auto rounded-md border">
            <table className="w-full table-fixed">
              <thead className="bg-gray-100">
                <tr className="text-left">
                  <Th label="S.No." sortable />
                  <Th label="Company Name" sortable />
                  <Th label="Name" sortable />
                  <Th label="Status" sortable />
                  <Th
                    label="Total Count"
                    sortable
                    className="hidden md:table-cell"
                  />
                  <Th label="URL" sortable />
                  <Th
                    label="Action"
                    sortable
                    className="hidden md:table-cell"
                  />
                  <Th
                    label="Update"
                    sortable
                    className="hidden md:table-cell"
                  />
                  <Th
                    label="Create URL"
                    sortable
                    className="hidden md:table-cell"
                  />
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-500 text-[14px]"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((s, i) => (
                    <tr
                      key={s.id}
                      className="bg-white hover:bg-gray-50 align-middle"
                    >
                      <td className="px-3 py-2 text-[14px]">
                        {pageStart + i + 1}
                      </td>
                      <td className="px-3 py-2 text-[14px] break-words max-w-[220px]">
                        {companyName(s.companyId)}
                      </td>
                      <td className="px-3 py-2 text-[14px] break-words max-w-[240px]">
                        {s.name}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge text={s.status} />
                      </td>
                      <td className="px-3 py-2 text-[14px] hidden md:table-cell">
                        {s.totalCount}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 max-w-[520px]">
                          {s.url ? (
                            <a
                              href={s.url}
                              className="text-blue-700 break-all text-[14px]"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {s.url}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[14px]">-</span>
                          )}
                          <button
                            onClick={() => copyToClipboard(s.url)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                            title="Copy URL"
                            type="button"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <TealButton onClick={() => del.mutate(s.id)}>
                          DELETE
                        </TealButton>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <TealLinkButton href={`/surveys/${s.id}/edit`}>
                          UPDATE
                        </TealLinkButton>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <TealButton
                          onClick={() => createUrl.mutate(s)}
                          disabled={createUrl.isPending}
                        >
                          {createUrl.isPending ? "CREATING…" : "CREATE URL"}
                        </TealButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-500 text-[14px]"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot className="bg-gray-100">
                <tr className="text-left">
                  <Th label="S.No." sortable />
                  <Th label="Company Name" sortable />
                  <Th label="Name" sortable />
                  <Th label="Status" sortable />
                  <Th
                    label="Total Count"
                    sortable
                    className="hidden md:table-cell"
                  />
                  <Th label="URL" sortable />
                  <Th
                    label="Action"
                    sortable
                    className="hidden md:table-cell"
                  />
                  <Th
                    label="Update"
                    sortable
                    className="hidden md:table-cell"
                  />
                  <Th
                    label="Create URL"
                    sortable
                    className="hidden md:table-cell"
                  />
                </tr>
              </tfoot>
            </table>
          </div> */}
           <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <Th label="S.No." sortable />
                  <Th label="Company Name" sortable />
                  <Th label="Name" sortable />
                  <Th label="Status" sortable />
                  <Th label="Total Count" sortable />
                  <Th label="URL" sortable />
                  <Th label="Action" sortable />
                  <Th label="Update" sortable />
                  <Th label="Create URL" sortable />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-gray-500 text-sm"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((s, i) => (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {pageStart + i + 1}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="max-w-[180px] break-words">
                          {companyName(s.companyId)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="max-w-[200px] break-words">
                          {s.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge text={s.status} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap text-center">
                        {s.totalCount}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {s.url ? (
                            <>
                              <a
                                href={s.url}
                                className="text-blue-600 hover:text-blue-800 text-sm max-w-[300px] underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {s.url}
                              </a>
                              <button
                                onClick={() => copyToClipboard(s.url)}
                                className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                                title="Copy URL"
                                type="button"
                              >
                                <Copy className="h-4 w-4 text-gray-600" />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <TealButton onClick={() => console.log('Delete', s.id)}>
                          DELETE
                        </TealButton>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <TealLinkButton href={`/surveys/${s.id}/edit`}>
                          UPDATE
                        </TealLinkButton>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <TealButton
  onClick={() => createUrl.mutate(s)}
  disabled={createUrl.isPending}
>
  {createUrl.isPending ? "CREATING…" : "CREATE URL"}
</TealButton>

                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-gray-500 text-sm"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* footer: showing & pagination */}
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
