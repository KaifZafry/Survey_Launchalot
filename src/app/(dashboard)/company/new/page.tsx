"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import client from "../../../../lib/client";
import { Image as ImageIcon, X } from "lucide-react";

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

async function compressImage(
  file: File,
  maxW = 1200,
  maxH = 1200,
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

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  URL.revokeObjectURL(img.src);
  return dataUrl;
}

export default function NewCompanyPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [logoUrls, setLogoUrls] = useState<string[]>([]);

  const addCompany = useMutation({
    mutationFn: () =>
      client.post("/companies", {
        name,
        logoUrls,
        logoUrl: logoUrls[0],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      router.push("/company");
    },
  });

  const onPickFiles = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    const compressed: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const dataUrl = await compressImage(f, 1200, 1200, 0.8);
      compressed.push(dataUrl);
    }
    setLogoUrls((prev) => [...prev, ...compressed]);
  };

  const removeAt = (idx: number) =>
    setLogoUrls((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit = name.trim().length > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-[#bfe3df] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-6 text-[24px] font-semibold">Add Company</h1>

        <div className="max-w-[900px] space-y-8">
          <LineInput
            label="Enter Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Launchalot BV"
          />

          <div>
            <div className="mb-2 text-[15px] font-medium">Company Images</div>

            <div className="flex items-center gap-4">
              <label className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files)}
                />
                <ImageIcon className="h-6 w-6 text-[#1c8ed8]" />
              </label>
              <span className="text-sm text-gray-600">
                You can add multiple images (logo variations, dark/light, etc.)
              </span>
            </div>

            {logoUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {logoUrls.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative rounded border bg-white p-2 flex items-center justify-center"
                  >
                    <img
                      src={src}
                      alt={`Logo ${idx + 1}`}
                      className="h-20 w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => removeAt(idx)}
                      className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <PrimaryButton
            disabled={!canSubmit || addCompany.isPending}
            onClick={() => addCompany.mutate()}
          >
            {addCompany.isPending ? "ADDING…" : "ADD"}
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
