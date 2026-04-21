"use client";

import React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants
} from "framer-motion";
import { usePathname } from "next/navigation";

export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionMain = motion.main;
export const MotionArticle = motion.article;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Reusable typed variants
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(6px)"
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease: EASE_OUT
    }
  }
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(6px)"
  },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: EASE_OUT
    }
  }
};

export const pop: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    filter: "blur(6px)"
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease: EASE_OUT
    }
  }
};

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.02
    }
  }
};

export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.01
    }
  }
};

export const pageSlide: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: "blur(8px)"
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: EASE_OUT
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(10px)",
    transition: {
      duration: 0.25,
      ease: EASE_OUT
    }
  }
};

export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

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
        {children}
      </MotionDiv>
    </AnimatePresence>
  );
}