"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import client from "@/lib/client";
import ThankYouCard from "@/components/ThankYouCard";
import { SurveyUIConfig } from "@/types/uiConfig";

/* ---------- API types ---------- */
type Risk = "green" | "yellow" | "red";
type PublicOption = { id: string; text: string; risk?: string };
type PublicQuestion = {
  id: string;
  text: string;
  details?: string;
   image?: string | null; 
  type: "radio" | "checkbox" | "text";
  options: PublicOption[];
};
type PublicSegment = { title: string; questions: PublicQuestion[] };
type PublicSurvey = {
  companyName: string;
  companyLogo?: string;
  companyLogos?: string[];
  surveyName: string;
  segments: PublicSegment[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(
  /\/+$/,
  ""
);
type DisclaimerProps = {
  onClose: () => void; // onClose function, koi argument nahi aur return void
};

function Disclaimer({ onClose }: DisclaimerProps) {
  const [checked, setChecked] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
   const { data: uiConfig, isLoading, error } = useQuery<SurveyUIConfig, Error>({
    queryKey: ["ui-config", "survey"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ui-config/survey`
      );
      if (!res.ok) throw new Error("Failed to fetch UI config");
      return res.json();
    },
  });

  // 👇 ONLY FOR CONSOLE DEBUGGING
  useEffect(() => {
    if (isLoading) {
      console.log("UI Config loading...");
    }

    if (error) {
      console.error("UI Config error:", error);
    }

    if (uiConfig) {
      // console.log("UI Config data:", uiConfig);
    }
  }, [uiConfig, isLoading, error]);

  const handleProceed = () => {
    if (checked) {
      if (onClose) onClose();
    } else {
      alert("Please check the box to proceed.");
    }
  };

  return (
    <div
      style={{
        backgroundImage:
          `radial-gradient(ellipse at bottom, #2a95c4b5, #0d1b2af2), url(${uiConfig?.backgroundImage})`,
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundAttachment: "fixed",
      }}
      className="user-dashboard-wraper fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-50"
    >
      <div className=" rounded-lg p-6 max-w-4xl w-full mx-4 shadow-lg bg-[#fff]/80">
        <h2 className="text-lg font-bold mb-4 text-gray-900">DISCLAIMER</h2>
        <p className="text-sm text-gray-800 mb-4 leading-snug">
         {uiConfig?.disclaimer.text}
        </p>
        <label className="flex items-center mb-4 space-x-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-800">{uiConfig?.checkbox.text} </span>
        </label>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleProceed}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Proceed
          </button>
        </div>
      </div>
      <div className="flex justify-center mt-6 pb-2">
        <p className="text-white text-sm opacity-80">
          Powered by&nbsp;
          <img
            src={uiConfig?.poweredBy.logo}
            alt="logo"
            className="inline-block h-12 align-middle"
          />
        </p>
      </div>
    </div>
  );
}

export default function PublicSurveyPage() {
  const { url } = useParams() as { url: string };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-survey", url],
    queryFn: () => client.get<PublicSurvey>(`/public/surveys/${url}`),
  });

  const { data: uiConfig, isLoading: uiLoading, error: uiError } = useQuery<SurveyUIConfig, Error>({
  queryKey: ["ui-config", "survey"],
  queryFn: async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ui-config/survey`);
    if (!res.ok) throw new Error("Failed to fetch UI config");
    return res.json();
  },
});


  // console.log(data);

  const questions: PublicQuestion[] = useMemo(
    () => (data ? data.segments.flatMap((s) => s.questions) : []),
    [data]
  );

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [index, setIndex] = useState(0);
  const [showThanks, setShowThanks] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const q = questions[index];




  const isLast = index === questions.length - 1;

  const logos = useMemo(() => {
    const arr =
      (data as any)?.companyLogos ??
      ((data as any)?.companyLogo ? [(data as any).companyLogo] : []);
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  /* -------- helpers for unified multi-select ---------- */
  const currentArr = (qid: string) => {
    const v = answers[qid];
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v) return [v];
    return [];
  };

  const toggleSelect = (
    qid: string,
    optionId: string,
    type: "radio" | "checkbox"
  ) =>
    setAnswers((prev) => {
      // ✅ RADIO: sirf ek hi option allow
      if (type === "radio") {
        return {
          ...prev,
          [qid]: [optionId], // overwrite previous
        };
      }

      // ✅ CHECKBOX: multiple allow
      const set = new Set(prev[qid] || []);
      set.has(optionId) ? set.delete(optionId) : set.add(optionId);

      return { ...prev, [qid]: Array.from(set) };
    });

  const setText = (qid: string, value: string) =>
    setAnswers((p) => ({ ...p, [qid]: value }));

  const answeredCount = useMemo(
    () =>
      Object.entries(answers).filter(([key, val]) => {
        const qq = questions.find((x) => x.id === key);
        if (!qq) return false;
        if (qq.type === "text") return typeof val === "string" && val.trim();
        if (qq.type === "radio" || qq.type === "checkbox") {
          const arr = Array.isArray(val)
            ? val
            : typeof val === "string"
            ? [val]
            : [];
          return arr.length > 0;
        }
        return false;
      }).length,
    [answers, questions]
  );

  const halfReached = questions.length
    ? answeredCount >= Math.ceil(questions.length / 2)
    : false;

  const answeredThis = useMemo(() => {
    if (!q) return false;
    const val = answers[q.id];
    if (q.type === "text") return typeof val === "string" && val.trim();
    const arr = Array.isArray(val) ? val : typeof val === "string" ? [val] : [];
    return arr.length > 0;
  }, [answers, q]);

  // ----- submit -----
  const submit = useMutation({
    mutationFn: () => client.post(`/public/surveys/${url}/submit`, { answers }),
    onSuccess: () => setShowThanks(true),
  });

  const onNext = () => setIndex((i) => Math.min(i + 1, questions.length - 1));
  const onBack = () => setIndex((i) => Math.max(i - 1, 0));
  const onSubmit = () => submit.mutate();

  const buildSections = () => {
    if (!data) return [];
    return data.segments
      .map((seg, sIdx) => {
        const rows = seg.questions.map((qq) => {
          let answersArr: string[] = [];
          let risksArr: ("green" | "yellow" | "red" | undefined)[] = [];

          if (qq.type === "text") {
            const a = String((answers[qq.id] as string) || "").trim();
            answersArr = a ? [a] : [];
          } else if (qq.type === "radio" || qq.type === "checkbox") {
            const sel = currentArr(qq.id);
            const chosen = qq.options.filter((o) => sel.includes(o.id));
            answersArr = chosen.map((o) => o.text);
            risksArr = chosen.map((o) => {
              const r = (o.risk || "").toLowerCase();
              return r === "red"
                ? "red"
                : r === "yellow" || r === "amber"
                ? "yellow"
                : r === "green"
                ? "green"
                : undefined;
            });
          }

          return {
            question: qq.text,
            answer: answersArr.join(", "),
            answers: answersArr,
            risks: risksArr,
          };
        });

        const filtered = rows.filter(
          (r) =>
            (r.answers && r.answers.length > 0) ||
            (typeof r.answer === "string" && r.answer.trim().length > 0)
        );

        return {
          title: `Segment ${sIdx + 1}: ${seg.title || ""}`,
          rows: filtered,
        };
      })
      .filter((sec) => sec.rows.length > 0);
  };

  const handleDownloadPdf = async () => {
    try {
      const sections = buildSections();

      const res = await fetch(`${API_BASE}/public/report.pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data?.companyName || "",
          companyLogo: data?.companyLogos || data?.companyLogo || "",
          sections,
        }),
      });

      if (!res.ok) throw new Error("PDF build failed");

      const blob = await res.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = `${(data?.companyName || "report")
        .replace(/[^a-z0-9-_]/gi, "_")
        .toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlObj);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-gray-200">Loading survey…</div>
    );
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-gray-200">
        Something went wrong. Please refresh and try again.
      </div>
    );
  }
  if (showDisclaimer)
    return <Disclaimer onClose={() => setShowDisclaimer(false)} />;

  const details = q?.details ? String(q.details) : "";
  // console.log(q);
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage:
          `radial-gradient(ellipse at bottom, #2a95c4b5, #0d1b2af2), url(${uiConfig?.backgroundImage})`,
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <img
        src="/bg-water.png"
        alt=""
        className="pointer-events-none select-none absolute md:left-28 md:top-24 h-36 md:h-36 animate-[spin_18s_linear_infinite]"
      />

      <div className="relative z-10 px-4 py-8 md:py-10">
        {/* logos pill */}
        <div className="mx-auto mb-6 flex max-w-4xl justify-center">
          <div className="flex max-w-full items-center gap-6 overflow-x-auto whitespace-nowrap rounded-2xl bg-[#fff]/95 px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,.15)]">
            {logos.length ? (
              logos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`logo-${i}`}
                  className="h-10 w-auto object-contain"
                />
              ))
            ) : (
              <div className="text-sm text-gray-500">{data.companyName}</div>
            )}
          </div>
        </div>

        {/* panel */}
        <div className="mx-auto w-[92%] max-w-[1050px] rounded-[8px] mt-10 p-5 md:p-6 shadow-[0_25px_60px_rgba(0,0,0,.28)] bg-[#fff]/80 backdrop-blur-sm">
          <h1 className="mb-2 text-center font-serif text-[30px] leading-tight text-gray-800 drop-shadow md:text-[34px]">
            {q?.text ?? ""}
          </h1>


            {/*images*/ }
       {q.image ? (
  <img
    src={`${process.env.NEXT_PUBLIC_API_URL}${q.image}`}
    alt="Question image"
    className="max-h-[250px] w-auto mx-auto rounded-lg shadow-md mt-4 object-contain"
    loading="lazy"
  />
) : (
  <div className="">  </div>
)}


          {!!details && (
            <p className="mb-4 text-center text-[16px] leading-relaxed text-gray-700">
              {details}
            </p>
          )}

          {q ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-0 backdrop-blur-[1px]">
                {/* MULTI-SELECT for RADIO */}
                {q.type === "radio" &&
                  q.options.map((o, i) => {
                    const selected = currentArr(q.id).includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`block cursor-pointer bg-[#dde7f5] px-6 py-4 transition-colors ${
                          i > 0 ? "border-t-2 border-[#c6e0e0]" : ""
                        }`}
                        onClick={() => {
                          if (q.type === "radio" || q.type === "checkbox") {
                            toggleSelect(q.id, o.id, q.type);
                          }
                        }}
                      >
                        <div className="flex items-center gap-5">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                              selected
                                ? "bg-[#0a9b8c] border-white"
                                : "bg-[#e7efef] border-transparent"
                            }`}
                          >
                            {selected ? (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5 text-white"
                                fill="currentColor"
                              >
                                <path d="M9 16.17l-3.88-3.88-1.42 1.41L9 19 20.3 7.71l-1.41-1.41z" />
                              </svg>
                            ) : (
                              <span className="h-3.5 w-3.5 rounded-full bg-[#cdd7d7]" />
                            )}
                          </span>
                          <span className="text-[17px] leading-snug text-[#133a4b]">
                            {o.text}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                {/* MULTI-SELECT for CHECKBOX */}
                {q.type === "checkbox" &&
                  q.options.map((o, i) => {
                    const checked = currentArr(q.id).includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`block cursor-pointer bg-[#dde7f5] px-6 py-4 transition-colors ${
                          i > 0 ? "border-t-2 border-[#c6e0e0]" : ""
                        }`}
                        onClick={() => {
                          if (q.type === "radio" || q.type === "checkbox") {
                            toggleSelect(q.id, o.id, q.type);
                          }
                        }}
                      >
                        <div className="flex items-center gap-5">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                              checked ? "bg-[#0a9b8c]" : "bg-[#e7efef]"
                            }`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className={`h-5 w-5 ${
                                checked ? "text-white" : "text-[#c9d6d6]"
                              }`}
                              fill="currentColor"
                            >
                              <path d="M9 16.17l-3.88-3.88-1.42 1.41L9 19 20.3 7.71l-1.41-1.41z" />
                            </svg>
                          </span>
                          <span className="text-[17px] leading-snug text-[#133a4b]">
                            {o.text}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                {/* TEXT */}
                {q.type === "text" && (
                  <div className="bg-[#dde7f5] p-5">
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-[#c6e0e0] bg-white p-4 text-[#133a4b] outline-none focus:border-[#1e6aa4] focus:ring-2 focus:ring-[#1e6aa4]/20"
                      placeholder="Schrijf uw antwoord…"
                      value={(answers[q.id] as string) || ""}
                      onChange={(e) => setText(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* footer  */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* progress pill */}
                <div className="flex sm:justify-end">
                  <div
                    className="shrink-0 rounded-full bg-gradient-to-br from-[#00c6ff] to-[#0e4b82] text-white
                    px-4 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base"
                  >
                    <span className="font-semibold">
                      {index + 1}/{questions.length}
                    </span>
                  </div>
                </div>

                {/* left buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={onBack}
                    disabled={index === 0}
                    className={`rounded-xl px-5 py-2 text-white shadow-md ${
                      index === 0
                        ? "bg-gray-400"
                        : "bg-gray-600 hover:brightness-110"
                    }`}
                  >
                    Back
                  </button>

                  <button
                    onClick={onNext}
                    disabled={!answeredThis || isLast}
                    className={`rounded-xl px-5 py-2 text-white shadow-md ${
                      !answeredThis || isLast
                        ? "bg-gray-400"
                        : "bg-[#134a80] hover:brightness-110"
                    }`}
                  >
                    Next
                  </button>

                  {isLast && (
                    <button
                      onClick={onSubmit}
                      disabled={submit.isPending}
                      className={`rounded-xl px-5 py-2 text-white shadow-md ${
                        submit.isPending
                          ? "bg-gray-400"
                          : "bg-[#2aa85b] hover:brightness-110"
                      }`}
                    >
                      {submit.isPending ? "Submitting…" : "Submit"}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-200">No questions</div>
          )}
        </div>

        {/* Powered by */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/90">
          <span className="text-sm">Powered by</span>

          <img
            src={uiConfig?.poweredBy.logo??""}
            alt="Launchalot"
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>

      {showThanks && (
        <ThankYouCard
          logos={logos}
          companyName={data.companyName}
          onDownload={handleDownloadPdf}
          bgimg={uiConfig?.backgroundImage ?? ""}
          footerlogo={uiConfig?.poweredBy.logo??""}
        />
      )}
    </div>
  );
}
