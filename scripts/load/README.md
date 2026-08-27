# بارآزمایی ظرفیت (k6)

نصب: https://k6.io/docs/get-started/installation/

```bash
export BASE_URL=http://localhost:3000
export AUTH_COOKIE='sb-hooshagar-auth-token=...'

k6 run scripts/load/smoke.js
k6 run scripts/load/teacher.js
k6 run scripts/load/parent.js
k6 run scripts/load/student.js
```

نتایج را در `docs/CAPACITY_BASELINE.md` ثبت کنید. روی production مستقیم اجرا نکنید مگر با VU پایین و هماهنگی.
