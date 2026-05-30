"use client";

import React, { useContext, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
  type HTMLMotionProps
} from "framer-motion";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

// ── 1️⃣ العناصر الهيكلية لـ Motion (Semantic HTML Elements) ──
// تصدير مكونات جاهزة لتقليل تكرار الكود وزيادة نظافة ملفات العرض
export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionMain = motion.main;
export const MotionArticle = motion.article;
export const MotionNav = motion.nav;
export const MotionHeader = motion.header;
export const MotionFooter = motion.footer;

// ── 2️⃣ منحنيات الحركة والفيزياء المرنة (Modern Physics & Easing) ──
// منحنى ناعم جداً وانسيابي للظهور الفخم (Apple-Style)
const EASE_SMOOTH = [0.25, 1, 0.5, 1] as const;

// فيزياء مرنة سريعة وتفاعلية ممتازة للأزرار والكروت والعناصر القابلة للضغط
const SPRING_SNAPPY = { type: "spring", stiffness: 280, damping: 26 } as const;

// فيزياء مرنة ناعمة وممتدة للقوائم والنوافذ المنبثقة
const SPRING_FLUID = { type: "spring", stiffness: 210, damping: 22 } as const;


// ── 3️⃣ المتغيرات الحركية الاحترافية (Reusable Production Variants) ──

// ✨ أولاً: حركة الظهور الفخم لأعلى مع بلور ناعم (Blur Reveal Effect)
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_SMOOTH }
  }
};

// ✨ ثانياً: حركة التلاشي النظيف للملفات والخلفيات
export const fadeIn: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: EASE_SMOOTH }
  }
};

// ✨ ثالثاً: حركة الانبثاق التفاعلي (Tactile Pop-In) مع Spring طبيعي
export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_SNAPPY
  }
};

// ✨ رابعاً: حركة تتابع ظهور الأبناء (Stagger Orchestration)
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.03
    }
  }
};

export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.01
    }
  }
};

// ✨ خامساً: حركة التنقل الفخم والديناميكي بين الصفحات
export const pageSlide: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE_SMOOTH }
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(8px)",
    transition: { duration: 0.3, ease: EASE_SMOOTH }
  }
};


// ── 4️⃣ المكونات الذكية والتفاعلية (High-Fidelity Components) ──

/**
 * مكون فرعي ذكي لتجميد حالة الراوتر أثناء خروج الصفحة
 * يضمن ظهور أنيميشن الـ Exit كاملاً قبل حذف المحتوى من الـ DOM
 */
function FrozenRoute({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context);

  return (
    <LayoutRouterContext.Provider value={frozen.current}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/**
 * مكون الانتقال الانسيابي بين الصفحات (PageTransition)
 * يدعم معايير الإتاحة العالية وحفظ ثبات الحركات
 */
export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // لو المستخدم مفعّل ميزة تقليل الحركة في جهازه، نعرض المحتوى فوراً بدون تشتيت بصري
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <MotionDiv
        key={pathname}
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageSlide}
      >
        <FrozenRoute>{children}</FrozenRoute>
      </MotionDiv>
    </AnimatePresence>
  );
}

/**
 * 🚀 مكون خارق وجديد: ScrollReveal
 * غلف بيه أي عنصر أو كارت في الصفحة الرئيسية، وهيظهر لوحده بنعومة وبشكل فخم أول ما المستخدم يسكرول عنده!
 */
interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: Variants;
  delay?: number;
  once?: boolean;
  viewportMargin?: string;
}

export function ScrollReveal({
  children,
  variant = fadeUp,
  delay = 0,
  once = true,
  viewportMargin = "-40px",
  ...props
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={props.className}>{children}</div>;
  }

  // دمج الـ delay بشكل ديناميكي وآمن جوه الـ Variant الممرر
  const dynamicVariant = {
    ...variant,
    show: {
      ...variant.show,
      transition: {
        // @ts-ignore
        ...variant.show?.transition,
        delay
      }
    }
  };

  return (
    <MotionDiv
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: viewportMargin }}
      variants={dynamicVariant}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}
