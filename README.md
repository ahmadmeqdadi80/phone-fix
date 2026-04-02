# نظام محاسبة صيانة الموبايل

نظام متكامل لإدارة محلات صيانة الأجهزة المحمولة - العملاء، الصيانة، المخزون، الفواتير، والمصاريف.

## المميزات

- 📊 **لوحة تحكم شاملة** - إحصائيات ورسوم بيانية
- 👥 **إدارة العملاء** - إضافة وتعديل ومتابعة
- 🔧 **طلبات الصيانة** - تتبع كامل من الاستلام للتسليم
- 📦 **إدارة المخزون** - تنبيهات النقص وتتبع القطع
- 💰 **الفواتير والديون** - نظام محاسبة متكامل
- 📈 **التقارير** - تقارير الأرباح والمصاريف
- 🌙 **الوضع الليلي** - دعم كامل للوضع الداكن
- 📱 **متجاوب** - يعمل على جميع الأجهزة

## التقنيات المستخدمة

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Database:** PostgreSQL (Vercel Postgres)
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** Zustand

## التثبيت المحلي

```bash
# تثبيت المتطلبات
bun install

# إعداد قاعدة البيانات
bun run db:push

# إدخال بيانات تجريبية (اختياري)
bun run db:seed

# تشغيل التطبيق
bun run dev
```

## النشر على Vercel

### 1. إنشاء قاعدة البيانات

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. أنشئ مشروع جديد
3. أضف **Vercel Postgres** من تبويب Storage

### 2. إعداد المتغيرات البيئية

في إعدادات المشروع على Vercel، أضف:

```
DATABASE_URL="postgres://..."
DIRECT_DATABASE_URL="postgres://..."
```

### 3. النشر

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel --prod
```

### 4. تشغيل Migration

بعد النشر، شغل الـ migration:

```bash
vercel env pull .env
bun run db:migrate:deploy
```

## هيكل المشروع

```
├── prisma/
│   └── schema.prisma      # قاعدة البيانات
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   ├── page.tsx       # الصفحة الرئيسية
│   │   └── layout.tsx     # التخطيط
│   ├── components/
│   │   ├── ui/            # مكونات UI
│   │   ├── layout/        # التخطيط
│   │   ├── dashboard/     # لوحة التحكم
│   │   ├── customers/     # العملاء
│   │   ├── repairs/       # الصيانة
│   │   ├── inventory/     # المخزون
│   │   ├── invoices/      # الفواتير
│   │   ├── expenses/      # المصاريف
│   │   ├── debts/         # الديون
│   │   ├── reports/       # التقارير
│   │   └── backup/        # النسخ الاحتياطي
│   ├── lib/               # المكتبات
│   └── store/             # إدارة الحالة
└── scripts/
    └── seed.ts            # بيانات تجريبية
```

## الميزات القادمة

- [ ] نظام مصادقة المستخدمين
- [ ] إشعارات البريد الإلكتروني
- [ ] طباعة الفواتير
- [ ] تقارير متقدمة
- [ ] تطبيق موبايل

## الترخيص

MIT License
