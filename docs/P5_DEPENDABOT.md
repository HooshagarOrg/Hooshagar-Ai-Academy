# P5 — Dependabot (برش باریک)

**وضعیت این موج:** قرارداد اجرا ثبت شد؛ mass-upgrade انجام نمی‌شود.

## قفل‌ها

- Next.js روی `14.2.35` پین بماند؛ major به ۱۵/۱۶ در این موج نیست.
- فقط alertهای **Critical / High** بازبینی شوند.
- هر رفع در PR جدا با changelog و تست؛ Dependabot بدون مرور merge نشود.
- بعد از هر رفع، نسخهٔ امن پین شود.

## کار باقی (انسانی)

1. در GitHub Dependabot، Critical/High را فهرست کنید.
2. برای هر مورد یک PR کوچک باز کنید (نه batch).
3. پس از merge، پین نسخه را در `package.json` / lockfile تأیید کنید.

مرجع برنامه: [`FULL_PRODUCT_EXECUTION.md`](FULL_PRODUCT_EXECUTION.md) — فاز E.
