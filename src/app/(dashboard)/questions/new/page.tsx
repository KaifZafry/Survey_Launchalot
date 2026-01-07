"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import client from "@/lib/client";

type Company = { id: string; name: string };
type Survey = {
  id: string;
  companyId: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

/* --------- small inputs --------- */
function LineInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      <div className="mb-2 text-[15px] font-medium">{label}</div>
      <input
        {...rest}
        className={
          "w-full bg-transparent outline-none border-b border-gray-500 pb-2 " +
          (className ?? "")
        }
      />
    </label>
  );
}

function TextareaInput(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      <div className="mb-2 text-[15px] font-medium">{label}</div>
      {/* <textarea
        {...rest}
        className={
          "w-full bg-transparent outline-none border-b border-gray-500 pb-2 min-h-[90px] " +
          (className ?? "")
        }
      /> */}
      <textarea
    {...rest}
    rows={1} // Optional: Good practice to start with 1 row
    onInput={(e) => {
      
      e.currentTarget.style.height = "auto";
      
      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;

    }}
    className={
      "w-full bg-transparent outline-none border-b border-gray-500 pb-2 " +
      "resize-none " + "overflow-hidden " + // Add this to disable manual resize
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
        "rounded-md bg-[#1aa1e5] px-8 py-2 text-sm font-semibold text-white " +
        "shadow-[0_2px_0_0_#0c6e9f] hover:brightness-95 disabled:opacity-50 " +
        (props.className ?? "")
      }
    />
  );
}

/* ========= PAGE ========= */
export default function NewQuestionPage() {
  const router = useRouter();
  const qc = useQueryClient();

  // load companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => client.get("/companies"),
  });

  const [companyId, setCompanyId] = useState("");

  // load surveys for selected company
  const { data: surveys = [] } = useQuery<Survey[]>({
    queryKey: ["surveys", companyId],
    queryFn: () => client.get(`/surveys?companyId=${companyId}`),
    enabled: !!companyId,
  });

  // ---- form state ----
  const [surveyId, setSurveyId] = useState("");

  // Segment dropdown (1..10). We store numeric and send "Segment: N"
  const segmentNumbers = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 1),
    []
  );
  const [segmentNum, setSegmentNum] = useState<number>(1);
  const segmentString = useMemo(() => `Segment: ${segmentNum}`, [segmentNum]);

  const [segmentTitle, setSegmentTitle] = useState("");

  const [text, setText] = useState("");
  const [details, setDetails] = useState("");
  const [type, setType] = useState<"radio" | "checkbox" | "text">("radio");
 const [image, setImage] = useState<File | null>(null);

  const canSubmit =
    companyId && surveyId && text.trim().length > 0 && type.length > 0;

  // create question
const addQuestion = useMutation({
  mutationFn: () => {
    const formData = new FormData();

    formData.append("companyId", companyId);
    formData.append("surveyId", surveyId);
    formData.append("segment", segmentString);
    formData.append("segmentTitle", segmentTitle);
    formData.append("text", text);
    formData.append("details", details);
    formData.append("type", type);

    if (image) {
      formData.append("image", image);
    }

    return client.post("/questions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["questions", surveyId] });

    setText("");
    setDetails("");
    setType("radio");
    setSegmentNum(1);
    setSegmentTitle("");
    setImage(null);

    alert("Question added successfully!");
  },
});



  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-[#bfe3df] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-6 text-[24px] font-semibold">
          Add Question By Category Details
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Company */}
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Select Company</div>
            <select
              className="h-10 w-full rounded-md border bg-white px-2"
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setSurveyId("");
              }}
            >
              <option value="">— Select —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {/* Survey */}
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Survey</div>
            <select
              className="h-10 w-full rounded-md border bg-white px-2"
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              disabled={!companyId}
            >
              <option value="">— Select —</option>
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {/* Segment number dropdown (1..10) */}
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Segment (1–10)</div>
            <select
              className="h-10 w-full rounded-md border bg-white px-2"
              value={segmentNum}
              onChange={(e) => setSegmentNum(Number(e.target.value))}
            >
              {segmentNumbers.map((n) => (
                <option key={n} value={n}>
                  Segment: {n}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-600">
              Stored value: <b>{segmentString}</b>
            </div>
          </label>

          {/* Segment Title (optional / free text) */}
          <TextareaInput
            label="Segment Title"
            value={segmentTitle}
            onChange={(e) => setSegmentTitle(e.target.value)}
          />

          {/* Question */}
          <TextareaInput
            label="Question"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Explain Question */}
          <TextareaInput
            label="Explain Question"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          <label className="block">
  <div className="mb-2 text-[15px] font-medium">
    Upload Image (optional)
  </div>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setImage(e.target.files?.[0] || null)}
    className="w-full text-sm"
  />

  {image && (
    <div className="mt-2 text-xs text-gray-600">
      Selected: <b>{image.name}</b>
    </div>
  )}
</label>

          {/* Type */}
          <label className="block">
            <div className="mb-2 text-[15px]  font-medium">Type</div>
            <select
              className="h-10 w-full rounded-md border bg-white px-2"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "radio" | "checkbox" | "text")
              }
            >
              <option value="radio">Radio</option>
              <option value="checkbox">Checkbox</option>
              <option value="text">Text</option>
            </select>
          </label>
        </div>

        <div className="mt-8 flex gap-4">
          <PrimaryButton
            disabled={!canSubmit || addQuestion.isPending}
            onClick={() => addQuestion.mutate()}
          >
            {addQuestion.isPending ? "ADDING…" : "ADD"}
          </PrimaryButton>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md bg-[#e0f1ff] px-8 py-2 text-sm font-semibold text-[#0f6aa0] hover:brightness-95"
          >
            CANCEL
          </button>
        </div>
      </div>
    </section>
  );
}
