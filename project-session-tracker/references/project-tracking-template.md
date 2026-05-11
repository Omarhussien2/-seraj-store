# Project Tracking Template

استخدم هذا القالب عند إنشاء ملف جديد لتتبع المشروع. احتفظ بأسماء الأعمدة كما هي، واكتب الملاحظات والوصف بالعربي.

## Suggested Layout

```markdown
# Project Tracker

## Basic Info

الوصف: هذا الجدول يحتوي على البيانات الأساسية للمشروع.

| Project_ID | Name | Manager | Project_Path | Current_Stage | Start_Date | End_Date | Total_Budget | Description |
|---|---|---|---|---|---|---|---|---|
| PRJ-001 | اسم المشروع | اسم المدير | /path/to/project | Planning | 2026-04-29 | TBD | TBD | وصف المشروع بالعربي |

## Daily Session Updates

الوصف: هذا القسم يُحدّث بعد كل سيشن على هيئة نقاط مختصرة توضّح ما تم إنجازه وما الذي تغير وما هو المتبقي.

### 2026-04-29
- تم إنشاء ملف متابعة المشروع.
- تم تجهيز الجداول الأساسية.
- المتبقي: إضافة المهام الفعلية والتحديات وروابط الملفات.

## Tasks

الوصف: هذا الجدول خاص بالمهام الرئيسية والفرعية. عمود `Task` هو اسم المهمة الرئيسية، وعمود `Category` هو القسم أو المسار الذي تتبعه المهمة.

| Task_ID | Project_ID | Task | Sub_Task | Category | Owner | Start_Date | End_Date | Cost | Quantity_Total | Quantity_Done | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TSK-001 | PRJ-001 | تجهيز لوحة التحكم | تصميم الصفحة الرئيسية | UI/UX | أحمد | 2026-04-29 | TBD | TBD | 1 | 0 | In Progress |

## Challenges

الوصف: هذا الجدول يسجل التحديات أو المخاطر التي ظهرت أثناء تنفيذ المشروع وكيف سيتم التعامل معها.

| Challenge_ID | Project_ID | Description | Status | Owner | Resolution_Plan | Risk_Impact | Risk_Type |
|---|---|---|---|---|---|---|---|
| CHL-001 | PRJ-001 | تأخر وصول المحتوى من العميل | Open | سارة | متابعة العميل وتحديد موعد تسليم واضح | High | Schedule |

## Files

الوصف: هذا الجدول يحتوي على كل روابط الملفات أو المستندات أو اللوحات المرتبطة بالمشروع.

| Doc_ID | Project_ID | Name | Link_URL |
|---|---|---|---|
| DOC-001 | PRJ-001 | رابط التصميم | https://example.com/file-link |
```

## Field Notes

- `Description` في جدول المشروع: اكتب وصف المشروع بالعربي.
- `Cost`: يمكن أن تكون قيمة فعلية أو تقديرية.
- `Quantity_Total`: إجمالي الكمية أو عدد العناصر المستهدفة.
- `Quantity_Done`: ما تم إنجازه حتى الآن.
- `Status`: استخدم قيمة واضحة وثابتة مثل `Not Started`, `In Progress`, `Blocked`, `Done` أو المقابل العربي إذا طلب المستخدم ذلك.
- `Risk_Impact`: مثل `Low`, `Medium`, `High`.
- `Risk_Type`: مثل `Schedule`, `Budget`, `Technical`, `Resource`.
