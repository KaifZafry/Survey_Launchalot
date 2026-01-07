"use client";

import { useEffect, useState } from "react";

type Props = {
  logos?: string[];
  companyName?: string;
  onDownload?: () => void;
  bgimg: string;
  footerlogo: string;
};

type ThankYouConfig = {
  image: string;
  heading: string;
  text: string;
};

export default function ThankYouCard({
  logos = [],
  companyName,
  onDownload,
  bgimg,
  footerlogo
}: Props) {
  const [config, setConfig] = useState<ThankYouConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Thank You Config
 useEffect(() => {
  async function fetchConfig() {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/thankyou-config/thank-you`
      );

      if (!response.ok) throw new Error("Failed to fetch config");

      const data = await response.json();

      console.log("fetched data:", data); // ← yaha data mil raha hai

     setConfig(data);
    } catch (error) {
      console.error("Error fetching thank you config:", error);
    } finally {
      setLoading(false);
    }
  }

  fetchConfig();
}, []);

// Config update ke baad check karne ke liye
useEffect(() => {
  console.log("config state updated:", config);
}, [config]);


  // Prevent scroll
  useEffect(() => {
    const { body, documentElement: html } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const scrollY = window.scrollY;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBody.overflow;
      body.style.position = prevBody.position;
      body.style.top = prevBody.top;
      body.style.width = prevBody.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-y-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="relative min-h-full px-4 pt-16 pb-10">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              `radial-gradient(ellipse at bottom, #2a95c4b5, #0d1b2af2), url(${bgimg})`,
            backgroundSize: "cover, cover",
            backgroundPosition: "center, center",
            backgroundRepeat: "no-repeat, no-repeat",
            backgroundAttachment: "fixed",
          }}
        />

        {/* rotating */}
        <img
          src="/bg-water.png"
          alt=""
          className="pointer-events-none select-none absolute md:left-28 md:top-24 h-36 md:h-36 animate-[spin_18s_linear_infinite]"
        />

        {/* content */}
        <div className="relative z-10">
          {/* company logos */}
          <div className="mx-auto mb-6 flex max-w-4xl justify-center">
            <div className="flex max-w-full items-center gap-6 overflow-x-auto whitespace-nowrap rounded-2xl bg-white/95 px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,.15)]">
              {logos.length ? (
                logos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`logo-${i}`}
                    className="h-14 w-auto object-contain"
                  />
                ))
              ) : companyName ? (
                <div className="text-sm text-gray-600">{companyName}</div>
              ) : null}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="mx-auto w-[92%] max-w-[1150px] rounded-[12px] bg-white/20 p-6 md:p-8 backdrop-blur-sm shadow-[0_25px_60px_rgba(0,0,0,.28)]">
              <div className="flex items-center justify-center py-20">
                <div className="text-white text-lg">Loading...</div>
              </div>
            </div>
          ) : (
            /* compact panel */
            <div className="mx-auto w-[92%] max-w-[1150px] rounded-[12px] bg-[#fff]/90 p-6 md:p-8 backdrop-blur-sm shadow-[0_25px_60px_rgba(0,0,0,.28)]">
              <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
                <div className="md:col-span-5">
                  <img
                    src={config?.image}
                    alt="Thank you"
                    className="w-full rounded-lg object-cover"
                  />
                </div>
                <div className="md:col-span-7">
                  <h2 className="mb-2 font-serif text-[36px] leading-tight text-gray-800 drop-shadow md:text-[46px]">
                    {config?.heading }
                  </h2>
                  <p className="text-[18px] leading-relaxed text-gray-700">
                    {config?.text } </p>
                </div>
              </div>
            </div>
          )}

          {/* download button */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <span className="hidden text-[18px] text-white/90 md:inline">
              Want to see your responses?
            </span>
            <button
              type="button"
              onClick={onDownload}
              className="rounded-xl bg-[#19a957] px-6 py-3 font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.2)] hover:brightness-110"
            >
              Download PDF
            </button>
          </div>

          {/* Powered by */}
          <div className="mt-6 mb-6 flex items-center justify-center gap-3 text-white/90">
            <span className="text-base md:text-lg">Powered by</span>

            <img
              src={footerlogo}
              alt="Launchalot"
              className="h-12 w-auto object-contain md:h-14"
            />
          </div>
        </div>
      </div>
    </div>
  );
}