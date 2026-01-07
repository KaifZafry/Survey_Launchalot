"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import client from "@/lib/client";
import { toast } from "sonner";

type Company = { id: string; name: string };
type SurveyIn = {
  companyId: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

export default function NewSurveyPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });

  const [form, setForm] = useState<SurveyIn>({
    companyId: companies[0]?.id || "",
    name: "",
    status: "ACTIVE",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const create = useMutation({
  mutationFn: () => client.post("/surveys", form),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["surveys"] });
    toast.success("Survey added successfully! 🎉");
    setForm({
  companyId: companies[0]?.id || "", 
  name: "",
  status: "ACTIVE",               
});

  },
  onError: (e: any) =>
    toast.error(e?.message || "Failed to add survey"),
});
  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-[#bfe3df] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-6 text-[24px] font-semibold">Add Survey</h1>

        <div className="grid gap-6 max-w-3xl">
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Company</div>
            <select
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="" disabled>
                Select company…
              </option>
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
              placeholder="App Survey DEX"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Status</div>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as SurveyIn["status"],
                })
              }
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>

          {errorMsg ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            className="rounded-md bg-[#1aa1e5] px-8 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!form.companyId || !form.name.trim() || create.isPending}
            onClick={() => {
              setErrorMsg(null);
              create.mutate();
            }}
          >
            {create.isPending ? "SAVING…" : "ADD"}
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
