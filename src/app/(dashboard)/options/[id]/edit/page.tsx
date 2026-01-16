"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../../../../../lib/client";

type Question = { id: string; text: string };
type Option = {
  id: string;
  questionId: string;
  text: string;
  risk: "Green" | "Amber" | "Red";
  score?: number;
  order?: number;
};

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-md bg-[#1aa1e5] px-8 py-2 text-sm font-semibold text-white " +
        "shadow-[0_2px_0_0_#0c6e9f] hover:brightness-95 disabled:opacity-50 " +
        (props.className ?? "")
      }
    />
  );
}

export default function EditOptionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: () => client.get("/questions"),
  });
  const { data: option, isLoading } = useQuery<Option>({
    queryKey: ["option", id],
    queryFn: () => client.get(`/options/${id}`),
  });

  const [form, setForm] = useState<Omit<Option, "id"> | null>(null);

  useEffect(() => {
    if (option) {
      setForm({
        questionId: option.questionId,
        text: option.text,
        risk: option.risk,
        score: option.score ?? 0,
        order: option.order ?? 0,
      });
    }
  }, [option]);

  const update = useMutation({
    mutationFn: () => client.put(`/options/${id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["options"] });
      qc.invalidateQueries({ queryKey: ["option", id] });
      router.push("/options");
    },
  });

  if (isLoading || !form) return <div className="p-6">Loading…</div>;

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-[#bfe3df] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-6 text-[24px] font-semibold">
          Update Question Option
        </h1>

        <div className="grid gap-6 max-w-3xl">
          {/* Question */}
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Question</div>
            <select
              value={form.questionId}
              onChange={(e) => setForm({ ...form, questionId: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.text}
                </option>
              ))}
            </select>
          </label>

          {/* Text */}
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Option Text</div>
            <input
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>

          {/* Risk + Score + Order */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block">
              <div className="mb-2 text-[15px] font-medium">Risk</div>
              <select
                value={form.risk}
                onChange={(e) =>
                  setForm({ ...form, risk: e.target.value as Option["risk"] })
                }
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="Green">Green</option>
                <option value="Amber">Amber</option>
                <option value="Red">Red</option>
              </select>
            </label>
            <label className="block">
              <div className="mb-2 text-[15px] font-medium">Score</div>
              <input
                type="number"
                value={form.score ?? 0}
                onChange={(e) =>
                  setForm({ ...form, score: Number(e.target.value) })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="block">
              <div className="mb-2 text-[15px] font-medium">Order</div>
              <input
                type="number"
                value={form.order ?? 0}
                onChange={(e) =>
                  setForm({ ...form, order: Number(e.target.value) })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <PrimaryButton
            disabled={!form.text.trim() || update.isPending}
            onClick={() => update.mutate()}
          >
            {update.isPending ? "UPDATING…" : "UPDATE"}
          </PrimaryButton>
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
