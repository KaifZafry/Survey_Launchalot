"use client";

import { useEffect, useState } from "react";

/* ================= TYPES ================= */
type ThankYouConfig = {
  image: string;
  heading: string;
  text: string;
};

/* ================= IMAGE → BASE64 ================= */
async function compressImage(
  file: File,
  maxW = 1600,
  maxH = 1600,
  quality = 0.8
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

  const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const base64 = canvas.toDataURL(mimeType, quality);

  URL.revokeObjectURL(img.src);
  return base64;
}

/* ================= API FUNCTIONS ================= */
async function fetchThankYouConfig(
  page: string
): Promise<ThankYouConfig | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/thankyou-config/${page}`
  );

  if (!res.ok) return null;
  return res.json();
}

async function updateThankYouConfig(
  page: string,
  data: ThankYouConfig
): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/thankyou-config/${page}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }
  );

  if (!res.ok) {
    throw new Error("Update failed");
  }
}

/* ================= COMPONENT ================= */
export default function ThankYouConfigForm({ page }: { page: string }) {
  const [form, setForm] = useState<ThankYouConfig>({
    image: "",
    heading: "",
    text: ""
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  /* ---------- FETCH ON LOAD ---------- */
  useEffect(() => {
    async function load() {
      try {
        setFetching(true);
        const data = await fetchThankYouConfig(page);

        if (data) {
          setForm({
            image: data.image ?? "",
            heading: data.heading ?? "",
            text: data.text ?? ""
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [page]);

  /* ---------- IMAGE CHANGE ---------- */
  const onImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const base64 = await compressImage(file);
    setForm((prev) => ({ ...prev, image: base64 }));
  };

  /* ---------- SAVE ---------- */
  const handleSave = async () => {
    try {
      setLoading(true);
      await updateThankYouConfig(page, form);
      alert("✅ Thank You config updated successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update config");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- LOADING ---------- */
  if (fetching) {
    return (
      <div className="flex justify-center items-center p-12">
        <p className="text-gray-500">Loading configuration...</p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className=" mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow border space-y-6">
        <h2 className="text-xl font-bold">
           Thank You Page UI Configuration 
        </h2>

        {/* IMAGE */}
        <div>
          <label className="font-medium block mb-2">
            Thank You Image
          </label>
          <input type="file" accept="image/*" onChange={onImageChange} />

          {form.image && (
            <img
              src={form.image}
              alt="Preview"
              className="mt-3 h-40 object-contain border rounded p-2"
            />
          )}
        </div>

        {/* HEADING */}
        <div>
          <label className="font-medium block mb-2">
            Heading
          </label>
          <input
            className="w-full border rounded p-2"
            value={form.heading}
            onChange={(e) =>
              setForm({ ...form, heading: e.target.value })
            }
          />
        </div>

        {/* TEXT */}
        <div>
          <label className="font-medium block mb-2">
            Text
          </label>
          <textarea
            rows={4}
            className="w-full border rounded p-2"
            value={form.text}
            onChange={(e) =>
              setForm({ ...form, text: e.target.value })
            }
          />
        </div>

        {/* SAVE */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="h-8 w-full rounded-md border bg-[#bfe3df] font-bold px-2 text-center text-[16px] outline-none shadow-[0_2px_0_0_#ea8f7b] hover:brightness-95 disabled:bg-gray-400"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
