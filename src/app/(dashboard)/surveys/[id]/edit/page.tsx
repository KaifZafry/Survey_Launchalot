"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../../../../../lib/client";
import { useMemo, useState } from "react";

type Company = { id: string; name: string };
type Survey = {
  id: string;
  companyId: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  totalCount: number;
  url?: string | null;
};

export default function EditSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });

  const { data: survey, isLoading } = useQuery<Survey>({
    queryKey: ["survey", id],
    queryFn: () => client.get(`/surveys/${id}`),
  });

  const [form, setForm] = useState<Omit<
    Survey,
    "id" | "totalCount" | "url"
  > | null>(null);

  useMemo(() => {
    if (survey)
      setForm({
        companyId: survey.companyId,
        name: survey.name,
        status: survey.status,
      } as any);
  }, [survey]);

  const update = useMutation({
    mutationFn: () => client.put(`/surveys/${id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"] });
      qc.invalidateQueries({ queryKey: ["survey", id] });
      router.push("/surveys");
    },
  });

  if (isLoading || !form) return <div className="p-6">Loading…</div>;

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-[#bfe3df] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-6 text-[24px] font-semibold">Update Survey</h1>

        <div className="grid gap-6 max-w-3xl">
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Company</div>
            <select
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Survey Name</div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Status</div>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as Survey["status"] })
              }
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            className="rounded-md bg-[#1aa1e5] px-8 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!form.name.trim() || update.isPending}
            onClick={() => update.mutate()}
          >
            {update.isPending ? "UPDATING…" : "UPDATE"}
          </button>
          <button
            className="rounded-md bg-[#e0f1ff] px-8 py-2 text-sm font-semibold text-[#0f6aa0]"
            onClick={() => router.back()}
          >
            CANCEL
          </button>
        </div>
      </div>
    </section>
  );
}
