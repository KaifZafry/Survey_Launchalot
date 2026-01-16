"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../../../../lib/client";

export default function EditQuestionPage() {
  const { id } = useParams() as { id: string };
  const qc = useQueryClient();
  const router = useRouter();

  const { data: question, isLoading } = useQuery({
    queryKey: ["question", id],
    queryFn: () => client.get(`/questions/${id}`),
    enabled: !!id,
  });

  const [segmentTitle, setSegmentTitle] = useState("");
  const [text, setText] = useState("");
  const [details, setDetails] = useState("");
  const [type, setType] = useState("radio");
  const [image, setImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

useEffect(() => {
  if (!question) return;

  setSegmentTitle(question.segmentTitle ?? "");
  setText(question.text);
  setDetails(question.details ?? "");
  setType(question.type);

  if (question.image) {
    setImagePreview(`${API_BASE}${question.image}`);
  }
}, [question]);


const save = useMutation({
  mutationFn: () => {
    const fd = new FormData();
    fd.append("segmentTitle", segmentTitle);
    fd.append("text", text);
    fd.append("details", details);
    fd.append("type", type);

    if (image) {
      fd.append("image", image);
    }

    return client.put(`/questions/${id}`, fd); // ✅ ONLY 2 ARGS
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["questions"] });
    alert("Question updated successfully!");
    //router.push("/questions");
  },
});



  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <section className="p-6 space-y-6">
      <div className="bg-white rounded-md p-6 shadow">
        <h1 className="text-xl font-semibold mb-4">Edit Question</h1>

        {/* Segment Title */}
        <label className="block mb-3">
          <div className="font-medium mb-1">Segment Title</div>
          <input
            className="border w-full p-2 rounded"
            value={segmentTitle}
            onChange={(e) => setSegmentTitle(e.target.value)}
            placeholder="e.g. Personal Information"
          />
        </label>

        {/* Question */}
        <label className="block mb-3">
          <div className="font-medium mb-1">Question</div>
          <input
            className="border w-full p-2 rounded"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        {/* Explanation */}
        <label className="block mb-3">
          <div className="font-medium mb-1">Explanation (optional)</div>
          <textarea
            className="border w-full p-2 rounded"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </label>

        {/* Type */}
        <label className="block mb-5">
          <div className="font-medium mb-1">Type</div>
          <select
            className="border w-full p-2 rounded"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="radio">Radio</option>
            <option value="checkbox">Checkbox</option>
            <option value="text">Text</option>
          </select>
        </label>
        {/* Image */}
<label className="block mb-5">
  <div className="font-medium mb-1">Question Image (optional)</div>

  {imagePreview && (
    <img
      src={imagePreview}
      alt="preview"
      className="mb-3 h-40 rounded border object-contain"
    />
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }}
  />
</label>


        <button
          onClick={() => save.mutate()}
          className="bg-[#1aa1e5] text-white px-4 py-2 rounded font-semibold"
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}
