"use client";

import { useEffect, useState } from "react";

/* ---------------- IMAGE → BASE64 ---------------- */
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

  const isPNG = file.type === "image/png";
const mimeType = isPNG ? "image/png" : "image/jpeg";
const base64 = canvas.toDataURL(mimeType, quality);
  URL.revokeObjectURL(img.src);

  return base64;
}

/* ---------------- API FUNCTIONS ---------------- */
async function fetchUIConfig(page: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/ui-config/${page}`
  );
  if (!response.ok) throw new Error("Failed to fetch config");
  return response.json();
}

async function updateUIConfig(page: string, config: any) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/ui-config/${page}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config })
    }
  );
  if (!response.ok) throw new Error("Failed to update config");
  return response.json();
}

/* ---------------- COMPONENT ---------------- */
export default function UIConfigForm({
  page,
  initialConfig
}: {
  page: string;
  initialConfig: any;
}) {
  const [config, setConfig] = useState<any>({
    backgroundImage: "",
    checkbox: { text: "" },
    disclaimer: { text: "" },
    poweredBy: { logo: "" }
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  /* ---------------- FETCH DATA ON MOUNT ---------------- */
  useEffect(() => {
    async function loadConfig() {
      try {
        setFetching(true);
        const data = await fetchUIConfig(page);
        
        // Normalize the response structure
        const normalized = data.config ?? data;

        setConfig({
          backgroundImage: normalized.backgroundImage ?? "",
          checkbox: { text: normalized.checkbox?.text ?? "" },
          disclaimer: { text: normalized.disclaimer?.text ?? "" },
          poweredBy: { logo: normalized.poweredBy?.logo ?? "" }
        });
      } catch (err) {
        console.error("Failed to load config:", err);
      } finally {
        setFetching(false);
      }
    }

    loadConfig();
  }, [page]);

  /* ---------------- IMAGE UPLOAD HANDLER ---------------- */
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "backgroundImage" | "poweredBy"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const base64 = await compressImage(file);

    if (key === "backgroundImage") {
      setConfig((prev: any) => ({
        ...prev,
        backgroundImage: base64
      }));
    }

    if (key === "poweredBy") {
      setConfig((prev: any) => ({
        ...prev,
        poweredBy: {
          ...prev.poweredBy,
          logo: base64
        }
      }));
    }
  };

  /* ---------------- SAVE/UPDATE ---------------- */
  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUIConfig(page, config);
      alert("✅ UI Config updated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOADING STATE ---------------- */
  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading configuration...</div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className=" mx-auto p-2">
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          UI Configuration - {page}
        </h2>

        {/* 🔹 Background Image */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Background Image
          </label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => handleImageUpload(e, "backgroundImage")}
          />

          {config.backgroundImage && (
            <img
              src={config.backgroundImage}
              alt="Background preview"
              className="mt-3 h-72 w-full rounded-lg object-cover border"
            />
          )}
        </div>

        {/* 🔹 Checkbox Text */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Checkbox Text
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={config.checkbox.text}
            onChange={(e) =>
              setConfig((prev: any) => ({
                ...prev,
                checkbox: { text: e.target.value }
              }))
            }
            placeholder="Enter checkbox label..."
          />
        </div>

        {/* 🔹 Disclaimer Text */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Disclaimer Text
          </label>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={config.disclaimer.text}
            onChange={(e) =>
              setConfig((prev: any) => ({
                ...prev,
                disclaimer: { text: e.target.value }
              }))
            }
            placeholder="Enter disclaimer text..."
          />
        </div>

        {/* 🔹 Powered By Logo */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Powered By Logo
          </label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => handleImageUpload(e, "poweredBy")}
          />

          {config.poweredBy.logo && (
            <img
              src={config.poweredBy.logo}
              alt="Logo preview"
              className="mt-3 h-12 object-contain border rounded p-2"
            />
          )}
        </div>

        {/* 🔹 Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}