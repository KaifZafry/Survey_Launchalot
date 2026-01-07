"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/client";
import { useRouter } from "next/navigation";

// Small helpers for styling
function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[15px] font-medium">{children}</div>;
}
function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: React.ReactNode;
  }
) {
  const { className, ...rest } = props;
  return (
    <select
      {...rest}
      className={
        "h-12 w-full rounded-md border bg-white px-3 text-[15px] outline-none " +
        "focus:ring-2 focus:ring-[#9ed6d6] " +
        (className ?? "")
      }
    />
  );
}
function LineInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { className, label, ...rest } = props;
  return (
    <label className="block">
      {label ? <Label>{label}</Label> : null}
      <input
        {...rest}
        className={
          "w-full bg-transparent outline-none border-b border-gray-500 pb-2 text-[15px] " +
          (className ?? "")
        }
      />
    </label>
  );
}
function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-md bg-[#1aa1e5] px-6 py-2 text-sm font-semibold text-white " +
        "shadow-[0_2px_0_0_#0c6e9f] hover:brightness-95 disabled:opacity-50 " +
        (props.className ?? "")
      }
    />
  );
}
function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-md bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white " +
        "hover:brightness-95 disabled:opacity-50"
      }
    />
  );
}

// types (light)
type Company = { id: string; name: string };
type Survey = { id: string; companyId: string; name: string };
type Question = {
  id: string;
  surveyId: string;
  text?: string; // primary text
  title?: string; // fallback
  segmentTitle?: string; // if present
};
type Option = {
  id: string;
  questionId: string;
  text: string;
  risk: "Red" | "Yellow" | "Green";
};

// -------- PAGE ----------
export default function AddOptionsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  // selections
  const [companyId, setCompanyId] = useState("");
  const [surveyId, setSurveyId] = useState("");
  const [questionId, setQuestionId] = useState("");

  // form
  const [text, setText] = useState("");
  const [risk, setRisk] = useState<"Red" | "Yellow" | "Green">("Red");
  const [addedMsg, setAddedMsg] = useState<string | null>(null);

  // queries
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });

  const { data: surveys = [] } = useQuery<Survey[]>({
    queryKey: ["surveys", companyId],
    queryFn: () => client.get(`/surveys?companyId=${companyId}`),
    enabled: !!companyId,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["questions", surveyId],
    queryFn: () => client.get(`/questions?surveyId=${surveyId}`),
    enabled: !!surveyId,
  });

  const { data: options = [], isFetching: optionsLoading } = useQuery<Option[]>(
    {
      queryKey: ["options", questionId],
      queryFn: () => client.get(`/options?questionId=${questionId}`),
      enabled: !!questionId,
    }
  );

  // when company changes, clear lower selections
  useEffect(() => {
    setSurveyId("");
    setQuestionId("");
  }, [companyId]);
  useEffect(() => {
    setQuestionId("");
  }, [surveyId]);

  // add option
  const addOption = useMutation({
    mutationFn: () =>
      client.post("/options", {
        questionId,
        text,
        risk,
      }),
    onSuccess: () => {
      setText("");
      setRisk("Red");
      setAddedMsg("Option added successfully.");
      qc.invalidateQueries({ queryKey: ["options", questionId] });
      // clear message after 2.5s
      setTimeout(() => setAddedMsg(null), 2500);
    },
  });

  // delete option
  const delOption = useMutation({
    mutationFn: (id: string) => client.del(`/options/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["options", questionId] }),
  });

  const canSubmit = questionId && text.trim().length > 0;

  const questionLabel = (q: Question) =>
    [q.segmentTitle && `Segment: ${q.segmentTitle}`, q.title || q.text]
      .filter(Boolean)
      .join(" • ");

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-[#bfe3df] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-6 text-[24px] font-semibold">
          Add Options for Questions
        </h1>

        {/* selectors */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Select Company</Label>
            <Select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">Select…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Survey</Label>
            <Select
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              disabled={!companyId}
            >
              <option value="">Select…</option>
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Select Question</Label>
            <Select
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              disabled={!surveyId}
            >
              <option value="">Select…</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {questionLabel(q)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* form */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <LineInput
            label="Option Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., Daily"
          />

          <div>
            <Label>Select Risk Level</Label>
            <Select
              value={risk}
              onChange={(e) => setRisk(e.target.value as any)}
            >
              <option value="Red">Red</option>
              <option value="Yellow">Yellow</option>
              <option value="Green">Green</option>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <PrimaryButton
            disabled={!canSubmit || addOption.isPending}
            onClick={() => addOption.mutate()}
          >
            {addOption.isPending ? "ADDING…" : "ADD OPTION"}
          </PrimaryButton>

          <button
            className="rounded-md bg-[#e0f1ff] px-6 py-2 text-sm font-semibold text-[#0f6aa0] hover:brightness-95"
            type="button"
            onClick={() => router.back()}
          >
            CANCEL
          </button>
        </div>

        {/* success note */}
        {addedMsg ? (
          <div className="mt-4 text-sm font-semibold text-red-600">
            {addedMsg}
          </div>
        ) : null}
      </div>

      {/* options list for the selected question */}
      {questionId ? (
        <div className="rounded-[18px] bg-[#bfe3df] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <h2 className="mb-4 text-[20px] font-semibold">
            Options for this Question
          </h2>

          <div className="overflow-hidden rounded-md border">
            <table className="min-w-full text-[15px]">
              <thead className="bg-gray-100">
                <tr className="text-left">
                  <th className="px-4 py-3">Option Text</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {optionsLoading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : options.length ? (
                  options.map((o) => (
                    <tr key={o.id} className="bg-white">
                      <td className="px-4 py-3">{o.text}</td>
                      <td className="px-4 py-3">{o.risk}</td>
                      <td className="px-4 py-3">
                        <DangerButton
                          onClick={() => delOption.mutate(o.id)}
                          disabled={delOption.isPending}
                        >
                          Delete
                        </DangerButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No options yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
