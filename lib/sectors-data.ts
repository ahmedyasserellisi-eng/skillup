export type Sector = {
  slug: string;
  short: string;
  name_ar: string;
  name_en: string;
  note_ar: string;
  note_en: string;
  role_ar: string;
  role_en: string;
  responsibilities_ar: string[];
  responsibilities_en: string[];
  boundaries_ar: string;
  boundaries_en: string;
  benefits_ar: string;
  benefits_en: string;
};

export const SECTORS: Sector[] = [
  {
    slug: "hrm",
    short: "HRM",
    name_ar: "إدارة الموارد البشرية",
    name_en: "Human Resources",
    note_ar: "إدارة دورة حياة المتطوعين وبناء ثقافة مؤسسية قوية.",
    note_en: "Manage volunteer lifecycle and build a strong culture.",
    role_ar: "إدارة وتوجيه رأس المال البشري للمبادرة لضمان أعلى إنتاجية ورضا للأعضاء.",
    role_en: "Manage and guide the human capital to maximize productivity and satisfaction.",
    responsibilities_ar: [
      "الاستقطاب والاختيار (Recruitment)",
      "التهيئة والدمج (Onboarding)",
      "تقييم الأداء والمتابعة",
      "حل النزاعات وإدارة مسار المتطوع"
    ],
    responsibilities_en: [
      "Recruitment & selection",
      "Onboarding & integration",
      "Performance follow-up",
      "Conflict resolution & volunteer journey management"
    ],
    boundaries_ar:
      "لا يتدخل في تقييم الجودة الفنية لمهام القطاعات الأخرى، بل يقيم الالتزام والأداء العام.",
    boundaries_en:
      "Does not judge technical quality of other sectors' work—focuses on commitment and general performance.",
    benefits_ar: "ممارسة فعلية لعمليات المقابلات الشخصية، التقييم، واستخدام أنظمة الـ HR.",
    benefits_en: "Hands-on practice in interviews, evaluation, and HR operations."
  },
  {
    slug: "meal",
    short: "MEAL",
    name_ar: "التخطيط الاستراتيجي",
    name_en: "Strategic Planning",
    note_ar: "الرقابة الاستراتيجية، قياس الأداء، واستخلاص الدروس المستفادة.",
    note_en: "Strategic oversight, performance measurement, and learning.",
    role_ar: "ضمان تحقيق المبادرة لأهدافها الاستراتيجية عبر بناء مؤشرات قياس (KPIs) دقيقة.",
    role_en: "Ensure strategic goals via clear KPIs and measurement.",
    responsibilities_ar: [
      "بناء الخطط الاستراتيجية والتشغيلية",
      "تصميم أدوات القياس والاستبيانات",
      "إصدار تقارير الأداء الدورية",
      "توثيق الدروس المستفادة (Learning)"
    ],
    responsibilities_en: [
      "Strategic & operational planning",
      "Design surveys & measurement tools",
      "Periodic performance reports",
      "Document lessons learned"
    ],
    boundaries_ar:
      "جهة رقابية وتخطيطية؛ لا تقوم بتنفيذ الأنشطة أو الفعاليات بل تراقب جودة تنفيذها.",
    boundaries_en:
      "Planning/oversight only; does not execute activities—monitors quality and outcomes.",
    benefits_ar: "احتراف التخطيط الاستراتيجي، تحليل البيانات، وكتابة تقارير الأثر (Impact Reports).",
    benefits_en: "Master strategic planning, data analysis, and impact reporting."
  },
  {
    slug: "digital-marketing",
    short: "DM",
    name_ar: "التسويق والإعلام الرقمي",
    name_en: "Digital Marketing & Media",
    note_ar: "إدارة الهوية البصرية والمحتوى وبناء مجتمع المبادرة الرقمي.",
    note_en: "Brand, content, and community growth.",
    role_ar: "الواجهة الإعلامية للمبادرة والمسؤول عن بناء الوعي بالعلامة التجارية.",
    role_en: "Public voice of the initiative and brand awareness owner.",
    responsibilities_ar: [
      "إدارة حسابات التواصل الاجتماعي",
      "صناعة المحتوى (كتابة، تصميم، فيديو)",
      "إطلاق الحملات الإعلانية والتسويقية",
      "إدارة وتفاعل المجتمع (Community Moderation)"
    ],
    responsibilities_en: [
      "Manage social media accounts",
      "Content creation (writing/design/video)",
      "Launch marketing campaigns",
      "Community moderation & engagement"
    ],
    boundaries_ar:
      "ينفذ الخطة التسويقية، ويستقبل المواد العلمية من قطاع التدريب ليصيغها تسويقياً.",
    boundaries_en:
      "Executes marketing plan; receives training materials then adapts them into marketing content.",
    benefits_ar: "بناء سابقة أعمال (Portfolio) قوية في صناعة المحتوى وإدارة الحملات الرقمية.",
    benefits_en: "Build a strong portfolio in content creation and campaigns."
  },
  {
    slug: "logistics",
    short: "OPS",
    name_ar: "التنظيم واللوجستيات",
    name_en: "Logistics & Operations",
    note_ar: "الجندي المجهول خلف الكواليس لإدارة الفعاليات والموارد.",
    note_en: "Behind-the-scenes execution and operations.",
    role_ar: "التخطيط والتنفيذ الميداني أو التقني لجميع فعاليات المبادرة.",
    role_en: "Plan and execute all initiative activities (offline/online).",
    responsibilities_ar: [
      "تجهيز أماكن الفعاليات (أوفلاين/أونلاين)",
      "إدارة الحشود وتسجيل الحضور",
      "إدارة المشتريات والموارد",
      "التنبؤ بالمخاطر ووضع خطط بديلة"
    ],
    responsibilities_en: [
      "Prepare venues (offline/online)",
      "Attendance & crowd management",
      "Purchasing and resource management",
      "Risk anticipation & contingency plans"
    ],
    boundaries_ar: "ينفذ الفعالية ولا يتدخل في تصميم المحتوى العلمي المقدم فيها.",
    boundaries_en: "Executes the event; does not design the scientific/training content.",
    benefits_ar: "مهارات حل المشكلات تحت الضغط، التنظيم الميداني، وإدارة العمليات.",
    benefits_en: "Problem-solving under pressure, field organization, and ops skills."
  },
  {
    slug: "sustainable-development",
    short: "SD",
    name_ar: "التنمية المستدامة",
    name_en: "Sustainable Development",
    note_ar: "بناء الشراكات، الرعايات، والتوافق مع رؤية مصر 2030.",
    note_en: "Partnerships, sponsorships, and sustainability alignment.",
    role_ar: "تأمين الموارد الاستراتيجية والمالية للمبادرة وتوسيع شبكة علاقاتها.",
    role_en: "Secure resources and expand partnerships network.",
    responsibilities_ar: [
      "البحث عن شركاء ورعاة محتملين",
      "كتابة المقترحات (Proposals)",
      "إدارة علاقات الشركاء (PR)",
      "ربط أنشطة المبادرة بـ SDGs"
    ],
    responsibilities_en: [
      "Find partners & sponsors",
      "Write proposals",
      "Partner relations / PR",
      "Align activities with SDGs"
    ],
    boundaries_ar:
      "مسؤول عن الاتفاقيات الخارجية؛ يتم التنسيق مع قطاع الـ HR في حال طلب الشريك توظيف أعضاء.",
    boundaries_en:
      "Owns external agreements; coordinates with HR if partner needs staffing.",
    benefits_ar: "شبكة علاقات قوية، واحتراف التفاوض وكتابة المقترحات.",
    benefits_en: "Strong networking, negotiation, and proposal writing."
  },
  {
    slug: "training-development",
    short: "T&D",
    name_ar: "التدريب والتطوير المهني",
    name_en: "Training & Professional Development",
    note_ar: "القلب النابض للمبادرة؛ تصميم المحتوى وتأهيل المدربين.",
    note_en: "Core value: training design and delivery.",
    role_ar: "تقديم القيمة الأساسية عبر برامج تدريبية عالية الجودة.",
    role_en: "Deliver the core value via high-quality training programs.",
    responsibilities_ar: [
      "تصميم الحقائب التدريبية (Instructional Design)",
      "استقطاب وتأهيل المدربين",
      "تقديم الورش العلمية",
      "قياس العائد من التدريب (ROI)"
    ],
    responsibilities_en: [
      "Instructional design",
      "Trainer sourcing & onboarding",
      "Deliver workshops",
      "Training ROI measurement"
    ],
    boundaries_ar: "يصمم المادة العلمية، بينما يتولى قطاع التخطيط قياس الأثر، واللوجستيات إدارة القاعة.",
    boundaries_en: "Designs content; Strategic Planning measures impact; Logistics runs the venue.",
    benefits_ar: "مهارات العرض والتقديم وتصميم المواد التعليمية باحترافية.",
    benefits_en: "Presentation skills and professional learning material design."
  },
  {
    slug: "culture-entertainment",
    short: "C&E",
    name_ar: "الترفيه والثقافة",
    name_en: "Culture & Entertainment",
    note_ar: "تعزيز الولاء، الصحة النفسية، والروابط بين أعضاء المبادرة.",
    note_en: "Belonging, wellbeing, and internal community.",
    role_ar: "الحفاظ على بيئة إيجابية وصحية ومحفزة لجميع المتطوعين.",
    role_en: "Maintain a healthy, motivating environment for volunteers.",
    responsibilities_ar: [
      "تنظيم رحلات وأيام ترفيهية (Outings)",
      "إدارة المسابقات الداخلية والتكريمات",
      "مبادرات الصحة النفسية والدعم",
      "كسر الجليد (Icebreaking) في الفعاليات"
    ],
    responsibilities_en: [
      "Outings and social days",
      "Internal contests & recognition",
      "Wellbeing initiatives",
      "Icebreaking facilitation"
    ],
    boundaries_ar:
      "يعمل داخلياً مع الأعضاء (تنسيق مع HR)، وخارجياً في الفعاليات للترفيه (تنسيق مع Logistics).",
    boundaries_en:
      "Works internally with members (with HR) and supports events (with Logistics).",
    benefits_ar: "مهارات الذكاء العاطفي، التنشيط (Facilitation)، وإدارة الفعاليات الترفيهية.",
    benefits_en: "Emotional intelligence, facilitation, and entertainment event management."
  }
];

export function getSectorBySlug(slug: string) {
  return SECTORS.find((s) => s.slug === slug);
}
