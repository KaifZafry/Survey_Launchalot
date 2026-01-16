"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../../../../../lib/client";

/* tiny helpers */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
async function filesToBase64(files: File[] | FileList): Promise<string[]> {
  const list = Array.isArray(files) ? files : Array.from(files);
  return Promise.all(list.map((f) => fileToBase64(f)));
}

type Company = {
  id: string;
  name: string;
  logoUrl?: string;
  logoUrls?: string[];
};

export default function EditCompanyPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const qc = useQueryClient();

  const {
    data: company,
    isLoading,
    isError,
  } = useQuery<Company>({
    queryKey: ["company", id],
    queryFn: () => client.get(`/companies/${id}`),
    enabled: !!id,
  });

  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!company) return;
    setName(company.name ?? "");
    const seed =
      Array.isArray(company.logoUrls) && company.logoUrls.length
        ? company.logoUrls
        : company.logoUrl
        ? [company.logoUrl]
        : [];
    setImages(seed);
  }, [company]);

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const b64s = await filesToBase64(files);
    setImages((prev) => [...prev, ...b64s]);
    e.target.value = "";
  };

  const removeAt = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const save = useMutation({
    mutationFn: () =>
      client.put(`/companies/${id}`, {
        name,
        logoUrls: images,
        logoUrl: images[0],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company", id] });
      router.push("/company");
    },
  });

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError || !company) return <div className="p-6">Not found</div>;

  return (
    <section className="space-y-6">
      <div className="rounded-[18px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <h1 className="mb-6 text-[24px] font-semibold">Update Company</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Company Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-md border bg-white px-3 text-[14px] outline-none"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-[15px] font-medium">Add Images</div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="h-10 w-full rounded-md border bg-white px-3 py-1 text-[14px] outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can upload multiple images. Removing a thumbnail excludes it
              from save.
            </p>
          </label>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-[15px] font-medium">Company Image(s)</div>
          {images.length ? (
            <div className="flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="group relative h-20 w-32 overflow-hidden rounded border bg-white"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute right-1 top-1 rounded bg-black/65 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No images selected.</div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => save.mutate()}
            disabled={!name.trim() || save.isPending}
            className="rounded-md bg-[#1aa1e5] px-8 py-2 text-sm font-semibold text-white shadow-[0_2px_0_0_#0c6e9f] hover:brightness-95 disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md bg-[#e0f1ff] px-8 py-2 text-sm font-semibold text-[#0f6aa0] hover:brightness-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}
