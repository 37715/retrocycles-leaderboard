"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface HyperTextProps {
  text: string;
  duration?: number;
  framerProps?: Variants;
  className?: string;
  animateOnLoad?: boolean;
}

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getRandomInt = (max: number) => Math.floor(Math.random() * max);

export function HyperText({
  text,
  duration = 800,
  framerProps = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 3 }
  },
  className,
  animateOnLoad = true
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState(text.split(""));
  const [trigger, setTrigger] = useState(false);
  const iterations = useRef(0);
  const isFirstRender = useRef(true);

  const triggerAnimation = () => {
    iterations.current = 0;
    setTrigger(true);
  };

  useEffect(() => {
    const interval = setInterval(
      () => {
        if (!animateOnLoad && isFirstRender.current) {
          clearInterval(interval);
          isFirstRender.current = false;
          return;
        }
        if (iterations.current < text.length) {
          setDisplayText((currentText) =>
            currentText.map((letter, i) =>
              letter === " "
                ? letter
                : i <= iterations.current
                  ? text[i]
                  : alphabets[getRandomInt(26)]
            )
          );
          iterations.current = iterations.current + 0.1;
        } else {
          setTrigger(false);
          clearInterval(interval);
        }
      },
      duration / (text.length * 10)
    );
    return () => clearInterval(interval);
  }, [text, duration, trigger, animateOnLoad]);

  return (
    <div
      className="cursor-default overflow-hidden"
      style={{ display: "inline-block", width: "fit-content" }}
      onMouseEnter={triggerAnimation}
    >
      <AnimatePresence mode="sync">
        {displayText.map((letter, i) => (
          <motion.span
            key={i}
            className={cn(className)}
            style={letter === " " ? { display: "inline-block", width: "0.45em" } : undefined}
            {...framerProps}
          >
            {letter.toUpperCase()}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
