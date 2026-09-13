# Smart Tags Generator

مولّد كلمات مفتاحية ذكي وآمن (خالٍ من العلامات التجارية) لمنصات Redbubble, YouTube,
Etsy, Amazon KDP, وGeneral. مبني بـ Next.js 14 (App Router) + Supabase + Stripe،
وجاهز للنشر مباشرة على Vercel.

## 1. بنية المشروع

```
smart-tags-generator/
├── app/
│   ├── page.tsx                        ← الصفحة الرئيسية (Server Component)
│   ├── layout.tsx                      ← الـ layout العام + الخطوط + RTL
│   ├── globals.css                     ← الأنماط العامة (Dark Mode)
│   ├── auth/callback/route.ts          ← استقبال رد Google OAuth
│   └── api/
│       ├── generate-tags/route.ts      ← توليد الوسوم + تتبع الاستخدام + الفلترة
│       └── stripe/
│           ├── checkout/route.ts       ← إنشاء جلسة دفع Stripe Checkout
│           └── webhook/route.ts        ← استقبال أحداث الدفع وتحديث الحساب
├── components/
│   ├── Dashboard.tsx                   ← الواجهة التفاعلية الكاملة (Client Component)
│   ├── PlatformSelector.tsx            ← محدد المنصة
│   ├── AuthButton.tsx                  ← تسجيل الدخول / الخروج
│   ├── UpgradeModal.tsx                ← نافذة الترقية إلى Pro
│   └── ToastProvider.tsx               ← الإشعارات التفاعلية
├── lib/
│   ├── tag-engine.ts                   ← منطق توليد الوسوم + فلتر العلامات التجارية
│   ├── stripe.ts                       ← عميل Stripe
│   └── supabase/
│       ├── client.ts                   ← عميل Supabase (المتصفح)
│       └── server.ts                   ← عميل Supabase (الخادم) + عميل Admin
├── middleware.ts                       ← تحديث جلسة Supabase تلقائياً
├── supabase/schema.sql                 ← بنية قاعدة البيانات كاملة
├── .env.local.example                  ← نموذج متغيرات البيئة
└── tailwind.config.ts                  ← ألوان وخطوط التصميم
```

## 2. التثبيت المحلي

```bash
npm install
cp .env.local.example .env.local   # ثم املأ القيم كما هو موضّح أدناه
npm run dev
```

## 3. إعداد Supabase

1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com).
2. اذهب إلى **SQL Editor** والصق محتوى `supabase/schema.sql` بالكامل ثم شغّله.
   هذا ينشئ:
   - جدول `profiles` (يتتبع الخطة `free/pro` وعدد الاستخدامات).
   - Trigger ينشئ صفاً في `profiles` تلقائياً عند تسجيل أي مستخدم جديد.
   - سياسات RLS تحمي بيانات كل مستخدم.
   - جدول اختياري `blocked_terms` لإدارة قائمة العلامات التجارية المحظورة من لوحة Supabase مباشرة.
3. فعّل تسجيل الدخول عبر Google:
   - **Authentication -> Providers -> Google** → فعّله وأدخل
     `Client ID` و `Client Secret` (من Google Cloud Console -> OAuth consent screen).
   - في Google Cloud Console، أضف رابط الـ Redirect URI الذي يعرضه Supabase
     (شكله: `https://xxxx.supabase.co/auth/v1/callback`).
   - في **Authentication -> URL Configuration**، أضف رابط موقعك (و
     `http://localhost:3000` للتطوير المحلي) إلى **Redirect URLs**.
4. انسخ القيم التالية من **Project Settings -> API** إلى `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (سرّي) → `SUPABASE_SERVICE_ROLE_KEY`

## 4. إعداد Stripe

1. أنشئ حساباً على [stripe.com](https://stripe.com) (وضع Test mode للتجربة).
2. **Product catalog -> Add product** → أنشئ منتج "Pro Plan" مع سعر متكرر شهري
   (Recurring price). انسخ معرف الـ Price (`price_...`) إلى `STRIPE_PRICE_ID`.
3. **Developers -> API keys** → انسخ `Secret key` إلى `STRIPE_SECRET_KEY`.
4. **Developers -> Webhooks -> Add endpoint**:
   - الرابط: `https://your-domain.vercel.app/api/stripe/webhook`
   - الأحداث المطلوبة: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - انسخ `Signing secret` إلى `STRIPE_WEBHOOK_SECRET`.
   - للتجربة المحلية استخدم Stripe CLI:
     `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## 5. متغيرات البيئة (.env.local)

راجع `.env.local.example` — يحتوي شرحاً لكل متغير ومصدره بالتفصيل.

## 6. النشر على Vercel

1. ادفع المشروع إلى GitHub.
2. من Vercel: **Add New -> Project** → اختر المستودع.
3. أضف جميع متغيرات `.env.local` في **Settings -> Environment Variables**
   (غيّر `NEXT_PUBLIC_SITE_URL` إلى رابط النطاق الفعلي بعد أول نشر).
4. انشر. ثم عدّل رابط Stripe webhook ليشير إلى نطاق Vercel النهائي.

## 7. آلية عمل حدود الاستخدام والدفع

- كل مستخدم جديد يبدأ بـ `usage_count = 0` و `plan = 'free'`.
- كل طلب توليد ناجح عبر `/api/generate-tags` يزيد `usage_count` بمقدار 1
  (باستخدام الـ service role key الذي يتجاوز RLS لضمان دقة العدّاد).
- عند الوصول إلى 5 محاولات، يرجع الخادم الحالة `402` فتظهر نافذة الترقية.
- عند إتمام الدفع، يستقبل `/api/stripe/webhook` الحدث `checkout.session.completed`
  ويحدّث `plan = 'pro'` لنفس المستخدم (عبر `client_reference_id`)، فيصبح
  التوليد غير محدود فوراً.

## 8. فلتر العلامات التجارية

الموجود في `lib/tag-engine.ts` (`DEFAULT_BLOCKED_TERMS`) — قائمة ابتدائية
قابلة للتوسيع، وليست ضماناً قانونياً كاملاً. لإدارتها من دون إعادة نشر الكود،
استخدم جدول `blocked_terms` في Supabase واستبدل الاستدعاء في route الخاص
بالتوليد بقراءة القائمة من قاعدة البيانات بدلاً من الثابت المدمج.

## 9. تحسين جودة الوسوم (اختياري)

المولّد الحالي قائم على قواعد ثابتة (بدون أي مفتاح API خارجي) ليعمل المشروع
فوراً بدون تبعيات إضافية. لربطه بنموذج ذكاء اصطناعي حقيقي لتوليد وسوم أكثر
دقة، استبدل داخل `generateTags()` في `lib/tag-engine.ts` باستدعاء إلى
Anthropic API أو أي مزوّد آخر، مع الإبقاء على `filterTrademarks()` كما هي
كخطوة تصفية أخيرة قبل إرجاع النتائج للمستخدم.
