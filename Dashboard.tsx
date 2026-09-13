"use client";

import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ShieldCheck, Copy, Trash2, X, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Platform } from "@/lib/tag-engine";
import PlatformSelector from "@/components/PlatformSelector";
import AuthButton from "@/components/AuthButton";
import UpgradeModal from "@/components/UpgradeModal";

const FREE_LIMIT = 5;

interface Profile {
  plan: "free" | "pro";
  usage_count: number;
}

export default function Dashboard({
  user,
  initialProfile,
}: {
  user: User | null;
  initialProfile: Profile | null;
}) {
  const [platform, setPlatform] = useState<Platform>("redbubble");
  const [keyword, setKeyword] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const remaining = profile ? Math.max(FREE_LIMIT - profile.usage_count, 0) : FREE_LIMIT;
  const isPro = profile?.plan === "pro";
  const locked = !!user && !isPro && remaining <= 0;

  const totalChars = useMemo(() => tags.join(", ").length, [tags]);

  async function handleGenerate() {
    if (!user) {
      toast.error("سجّل الدخول أولاً لبدء التوليد.");
      return;
    }
    if (!keyword.trim()) {
      toast.error("أدخل كلمة مفتاحية أولاً.");
      return;
    }
    if (locked) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, platform }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) {
        toast.error(data.message || data.error || "حدث خطأ ما.");
        return;
      }

      setTags(data.tags);
      setProfile((prev) =>
        prev
          ? { ...prev, usage_count: data.usage.used }
          : { plan: data.usage.plan, usage_count: data.usage.used }
      );
      if (data.removedCount > 0) {
        toast.success(`تم توليد الوسوم — تم حذف ${data.removedCount} علامة تجارية محمية.`);
      } else {
        toast.success("تم توليد الوسوم بنجاح.");
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (tags.length === 0) return;
    navigator.clipboard.writeText(tags.join(", "));
    toast.success("تم نسخ جميع الكلمات المفتاحية.");
  }

  function clearAll() {
    setTags([]);
  }

  function removeTag(index: number) {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-paper">
            Smart Tags
          </h1>
          <p className="text-mist text-sm mt-1">
            كلمات مفتاحية آمنة وجاهزة للنشر في ثوانٍ
          </p>
        </div>
        <AuthButton user={user} />
      </header>

      {/* Trademark-safe badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-signal2/30 bg-signal2/10 px-3 py-1.5 text-xs font-medium text-signal2">
        <ShieldCheck size={14} />
        100% Trademark Safe
      </div>

      {/* Platform selector */}
      <div className="mb-6">
        <PlatformSelector value={platform} onChange={setPlatform} />
      </div>

      {/* Input field */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="اكتب فكرة التصميم أو الموضوع… مثال: قهوة الصباح"
          disabled={locked}
          className="flex-1 rounded-md border border-line bg-panel2 px-4 py-3 text-paper placeholder:text-mist/70 disabled:opacity-50"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || locked}
          className="flex items-center justify-center gap-2 rounded-md bg-signal px-6 py-3 font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          توليد الوسوم
        </button>
      </div>

      {!user && (
        <p className="text-sm text-mist mb-6">
          سجّل الدخول عبر Google لتفعيل الأداة والحصول على 5 محاولات مجانية.
        </p>
      )}

      {/* Live stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="عدد الوسوم" value={tags.length} />
        <StatCard label="إجمالي الحروف" value={totalChars} />
        <StatCard
          label="المحاولات المتبقية"
          value={isPro ? "∞" : `${remaining} / ${FREE_LIMIT}`}
          accent={!isPro && remaining <= 1}
        />
      </div>

      {/* Actions */}
      {tags.length > 0 && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-paper hover:border-signal/50 transition-colors"
          >
            <Copy size={14} /> نسخ الكل
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-mist hover:text-danger hover:border-danger/50 transition-colors"
          >
            <Trash2 size={14} /> مسح الكل
          </button>
        </div>
      )}

      {/* Tag chips */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-panel p-4 min-h-[96px]">
        {tags.length === 0 ? (
          <p className="text-mist text-sm self-center">
            ستظهر الكلمات المفتاحية الناتجة هنا…
          </p>
        ) : (
          tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="group flex items-center gap-1.5 rounded-md bg-panel2 border border-line px-3 py-1.5 text-sm text-paper"
            >
              {tag}
              <button
                onClick={() => removeTag(i)}
                aria-label={`حذف ${tag}`}
                className="text-mist hover:text-danger transition-colors"
              >
                <X size={13} />
              </button>
            </span>
          ))
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-panel px-4 py-3 text-center">
      <div
        className={`font-display text-xl font-semibold ${
          accent ? "text-danger" : "text-paper"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-mist mt-1">{label}</div>
    </div>
  );
}
