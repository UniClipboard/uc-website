"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const defaultTransition = {
  duration: 0.7,
  ease: [0.25, 0.1, 0.25, 1] as const, // Apple-style cubic-bezier
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

const variantMap = {
  "fade-up": fadeUp,
  "fade-in": fadeIn,
  "scale-up": scaleUp,
} as const;

type AnimateInProps = {
  children: ReactNode;
  variant?: keyof typeof variantMap;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "aside" | "footer";
};

export function AnimateIn({
  children,
  variant = "fade-up",
  delay = 0,
  duration,
  className,
  as = "div",
}: AnimateInProps) {
  const Component = motion.create(as);

  return (
    <Component
      variants={variantMap[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        ...defaultTransition,
        delay,
        ...(duration ? { duration } : {}),
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

type StaggerProps = {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "ul";
};

const staggerContainer: Variants = {
  hidden: {},
  visible: (stagger: number) => ({
    transition: { staggerChildren: stagger },
  }),
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

export function StaggerIn({
  children,
  stagger = 0.1,
  delay = 0,
  className,
  as = "div",
}: StaggerProps) {
  const Component = motion.create(as);

  return (
    <Component
      variants={staggerContainer}
      custom={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </Component>
  );
}

export function StaggerChild({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}
