"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import client from "../../../lib/client";

type Company = {
  id: string;
  name: string;
  logoUrl?: string;
  logoUrls?: string[];
};

function TealButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-md bg-[#6bcac4] px-5 py-2 text-[14px] font-bold text-white " +
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
        "px-5 py-2 text-[14px] font-bold text-white shadow-[0_2px_0_0_#ea8f7b] hover:brightness-95 " +
        (props.className ?? "")
      }
    />
  );
}

export default function ManageCompanyPage() {
  const qc = useQueryClient();

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10); // 0 = All
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? companies.filter((c) => c.name.toLowerCase().includes(q))
      : companies;
  }, [companies, search]);

  // clamp page when filters/pageSize change
  useEffect(() => setPage(1), [search, pageSize]);
  useEffect(() => {
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / (pageSize || total || 1)));
    if (page > pages) setPage(pages);
  }, [filtered.length, pageSize, page]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / (pageSize || total || 1)));
  const startIndex = total ? (pageSize ? (page - 1) * pageSize : 0) + 1 : 0;
  const endIndex = pageSize ? Math.min(total, page * pageSize) : total;

  const visible = useMemo(() => {
    if (!pageSize) return filtered; // show all
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const del = useMutation({
    mutationFn: (id: string) => client.del(`/companies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setPageSize(v === "all" ? 0 : parseInt(v, 10));
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <div className="mb-4">
          <h1 className="mb-4 text-[24px] font-semibold">
            Manage Company Details
          </h1>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="text-[15px]">Show</span>
              <select
                value={pageSize === 0 ? "all" : String(pageSize)}
                onChange={handlePageSizeChange}
                className="h-9 w-28 rounded-md border bg-[#bfe3df] px-2 text-center text-[15px] outline-none"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>
              <span className="text-[15px]">entries</span>
            </div>

            <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-end">
              <TealLinkButton href="/company/new" className="text-white">
                ADD NEW COMPANY
              </TealLinkButton>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search records"
                className="h-10 w-[240px] rounded-md border border-gray-300 px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#9ed6d6]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr className="text-left text-[15px]">
                <th className="px-4 py-3 font-semibold text-gray-700">S.No.</th>
                <th className="px-4 py-3 font-semibold text-gray-700">
                  Company Name
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700">
                  Company Image(s)
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700">
                  Action
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700">
                  Update
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : visible.length ? (
                visible.map((c, i) => {
                  const hasMulti =
                    Array.isArray(c.logoUrls) && c.logoUrls.length > 0;
                  const serial = (pageSize ? (page - 1) * pageSize : 0) + i + 1;
                  return (
                    <tr key={c.id} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-4 text-[15px]">{serial}</td>
                      <td className="px-4 py-4 text-[15px]">{c.name}</td>

                      <td className="px-4 py-4">
                        {hasMulti ? (
                          <div className="flex max-w-[360px] flex-wrap items-center gap-2">
                            {c.logoUrls!.slice(0, 6).map((src, idx) => (
                              <div
                                key={idx}
                                className="relative h-12 w-20 overflow-hidden rounded border bg-white"
                                title={src}
                              >
                                <img
                                  src={src}
                                  alt=""
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            ))}
                            {c.logoUrls!.length > 6 && (
                              <span className="text-xs text-gray-500">
                                +{c.logoUrls!.length - 6} more
                              </span>
                            )}
                          </div>
                        ) : c.logoUrl ? (
                          <div className="relative h-12 w-20 overflow-hidden rounded border bg-white">
                            <img
                              src={c.logoUrl}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <TealButton
                          onClick={() => del.mutate(c.id)}
                          disabled={del.isPending}
                        >
                          DELETE
                        </TealButton>
                      </td>
                      <td className="px-4 py-4">
                        <TealLinkButton href={`/company/${c.id}/edit`}>
                          UPDATE
                        </TealLinkButton>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[14px] text-gray-700">
          <div>
            Showing <b>{startIndex}</b> to <b>{endIndex}</b> of <b>{total}</b>{" "}
            entries
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-md border px-3 py-1 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || pageSize === 0}
            >
              Prev
            </button>
            <span>
              Page <b>{pages === 0 ? 1 : page}</b> of <b>{pages}</b>
            </span>
            <button
              className="rounded-md border px-3 py-1 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages || pageSize === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
