/**
 * Confirmed facts and shared copy for the personalized-story service.
 *
 * Every claim here must be owner-confirmed per SEO-CONTENT-STRATEGY.md:
 * - The story is written for one child around the guardian's priority.
 * - A full character sheet supports a consistent look across scenes.
 * - A character sample is sent to the guardian before the full story.
 * - A personal dedication can be included.
 * - The finished book can ship directly to the recipient.
 *
 * Do NOT add page counts, materials, production times, revision counts, or
 * likeness guarantees: they are still pending owner confirmation.
 */

export const personalizedStorySteps = [
  {
    title: "احكيلنا عن طفلك",
    body: "الاسم والعمر والاهتمامات، والرسالة أو الموقف اللي تحب القصة تساعده فيه: شجاعة، ثقة بالنفس، صبر، حب تعلم، أو مناسبة خاصة لعيلتكم.",
  },
  {
    title: "ارفع الصور المناسبة",
    body: "صور واضحة وقريبة لوجه طفلك تساعد فريق سراج يصمم شخصية قريبة من ملامحه عبر مشاهد القصة.",
  },
  {
    title: "نصمم شخصيته",
    body: "نجهز تصميم شخصية متكامل (Character Sheet) للطفل، بيثبت ملامحه وشكله في كل مشاهد الحكاية.",
  },
  {
    title: "راجع العينة",
    body: "نرسل لولي الأمر عينة من تصميم الشخصية قبل استكمال القصة، وبعد اعتمادك نكمل التنفيذ.",
  },
  {
    title: "نكتب ونرسم الحكاية",
    body: "نبني أحداث القصة حول طفلك وأولوية الأسرة داخل تجربة عربية ممتعة تحمل القيمة اللي اخترتوها.",
  },
  {
    title: "نجهز الهدية ونوصلها",
    body: "نضيف الإهداء المتفق عليه، ونشحن الكتاب لعنوانك أو مباشرةً لمستلم الهدية اللي حددته.",
  },
] as const;

export const personalizedStoryFaqs = [
  {
    question: "هل القصة مجرد اسم وصورة داخل حكاية جاهزة؟",
    answer:
      "لا. في خدمة سراج المخصصة نستخدم تفاصيل الطفل وأولوية ولي الأمر لبناء القصة المتفق عليها، ثم نصمم شخصية متكاملة للطفل ونرسل عينة لاعتمادها قبل استكمال التنفيذ.",
  },
  {
    question: "هل أرى شكل شخصية طفلي قبل استكمال القصة؟",
    answer:
      "نعم. فريق سراج يرسل لولي الأمر عينة من تصميم الشخصية للمراجعة قبل استكمال القصة، والتنفيذ يبدأ بعد اعتمادك.",
  },
  {
    question: "هل يمكنني اختيار الرسالة أو القيمة؟",
    answer:
      "نعم. ممكن تبدأ القصة من قيمة أو سلوك أو تحدٍ أو اهتمام يحدده ولي الأمر، ما دام مناسبًا لعمر الطفل وطبيعة المنتج. القصة محتوى تربوي وتسلية، ومش بديل عن استشارة متخصصة.",
  },
  {
    question: "هل تصلح القصة كهدية تُرسل مباشرةً؟",
    answer:
      "نعم. يمكن إضافة إهداء باسم المرسل وتحديد مستلم آخر يستلم الكتاب مباشرةً نيابةً عنك داخل مصر.",
  },
  {
    question: "هل تضمنون تطابق الرسمة مع الطفل؟",
    answer:
      "نصمم شخصية قريبة من ملامح الطفل بناءً على الصور المناسبة، ونرسل عينة للمراجعة قبل استكمال القصة. مش بنَعِد بتطابق فوتوغرافي أو نتيجة متماثلة مع كل صورة.",
  },
] as const;

export const personalizedStoryProofPoints = [
  "قصة تُبنى على أولوية ولي الأمر، وليست مجرد تبديل الاسم.",
  "تصميم شخصية متكامل (Character Sheet) وعينة تعتمدها قبل استكمال القصة.",
  "إهداء باسم المرسل وتوصيل مباشر لمستلم الهدية داخل مصر.",
  "عالم عربي أصلي يجمع الحكاية بالقيم والمعرفة.",
] as const;

export const CUSTOM_STORY_SLUG = "custom-story";

export const HOW_IT_WORKS_PATH = "/how-personalized-stories-work";

export const GIFT_PAGE_PATH = "/personalized-gifts-for-children";
