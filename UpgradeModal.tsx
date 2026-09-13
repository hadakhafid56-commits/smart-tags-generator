"use client";

import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("تعذر بدء عملية الدفع. حاول مرة أخرى.");
        setLoading(false);
      }
    } catch {
      toast.error("حدث خطأ في الاتصال بالخادم.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-4 top-4 text-mist hover:text-paper"
        >
          <X size={20} />
        </button>

        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-gold/15 text-gold">
          <Sparkles size={22} />
        </div>

        <h2 className="font-display text-xl font-semibold text-paper mb-2">
          لقد استنفدت محاولاتك المجانية
        </h2>
        <p className="text-mist text-sm leading-relaxed mb-6">
          استخدمت 5 من 5 محاولات مجانية. اشترك في الخطة Pro للحصول على توليد
          غير محدود للكلمات المفتاحية عبر جميع المنصات، بدون قيود يومية.
        </p>

        <ul className="space-y-2 mb-6 text-sm text-paper/90">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal2" /> توليد غير محدود
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal2" /> دعم لجميع المنصات الخمس
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal2" /> فلترة العلامات التجارية مفعّلة دائماً
          </li>
        </ul>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-md bg-signal py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "جارٍ التحويل..." : "الاشتراك الآن — الترقية إلى Pro"}
        </button>
      </div>
    </div>
  );
}
