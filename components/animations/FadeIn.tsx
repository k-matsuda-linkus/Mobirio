"use client";
import { motion } from "framer-motion";

type Direction = "up" | "down" | "left" | "right";
type Props = {
  children: React.ReactNode;
  delay?: number;
  direction?: Direction;
};

const offsets = {
  up: { x: 0, y: 30 },
  down: { x: 0, y: -30 },
  left: { x: 30, y: 0 },
  right: { x: -30, y: 0 },
};
export default function FadeIn({ children, delay = 0, direction = "up" }: Props) {
  const offset = offsets[direction];
  return (
    <motion.div initial={{ opacity: 0, x: offset.x, y: offset.y }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}>
      {children}
    </motion.div>
  );
}
