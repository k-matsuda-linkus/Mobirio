"use client";
import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  staggerDelay?: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (stagger: number) => ({
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren: 0.1 },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] } },
};
export default function StaggerContainer({ children, staggerDelay = 0.1 }: Props) {
  return (
    <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={staggerDelay}>
      {children}
    </motion.div>
  );
}

export { itemVariants as staggerItemVariants };
