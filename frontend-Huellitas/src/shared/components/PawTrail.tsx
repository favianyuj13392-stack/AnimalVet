"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Paw {
  id: number;
  x: number;       // posición en el documento (px desde izquierda)
  y: number;       // posición en el documento (px desde arriba)
  rotation: number;
  flip: boolean;
}

const PAW_SIZE = 32;

export function PawTrail() {
  const [paws, setPaws] = useState<Paw[]>([]);
  const idRef    = useRef(0);
  const lastYRef = useRef(0);
  const stepRef  = useRef(0);

  useEffect(() => {
    const STEP = 100; // cada cuántos px de scroll aparece una huella

    const onScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY - lastYRef.current < STEP) return;
      lastYRef.current = scrollY;
      stepRef.current  += 1;

      const isLeft = stepRef.current % 2 === 0;
      const id     = ++idRef.current;

      // Camino serpenteante por el centro de la página
      const centerX = window.innerWidth / 2;
      const spread  = 24;
      const snake   = Math.sin(scrollY * 0.012) * 18; // ondea suave

      const x = isLeft
        ? centerX + snake - spread - Math.random() * 8 - PAW_SIZE / 2
        : centerX + snake + spread - Math.random() * 8 - PAW_SIZE / 2;

      // Y fija en el documento: donde estás ahora + offset para que aparezca delante
      const y = scrollY + window.innerHeight * 0.5 + (Math.random() - 0.5) * 30;

      const rotation = isLeft
        ? -14 + Math.random() * 10
        :  14 - Math.random() * 10;

      setPaws((prev) => [...prev.slice(-50), { id, x, y, rotation, flip: !isLeft }]);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // absolute ocupa todo el documento — las huellas se quedan en su lugar al hacer scroll
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <AnimatePresence>
        {paws.map((paw) => (
          <motion.div
            key={paw.id}
            className="absolute"
            style={{
              left:    paw.x,
              top:     paw.y,
              rotate:  paw.rotation,
              scaleX:  paw.flip ? -1 : 1,
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1,  scale: 1   }}
            exit={{    opacity: 0              }}
            transition={{ duration: 0.3, ease: "backOut" }}
          >
            <PawSVG />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function PawSVG() {
  return (
    <svg
      width={PAW_SIZE}
      height={PAW_SIZE}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* almohadilla central */}
      <ellipse cx="50" cy="68" rx="26" ry="24" fill="white" fillOpacity="0.12" />
      {/* 4 deditos */}
      <ellipse cx="25" cy="38" rx="13" ry="15" fill="white" fillOpacity="0.12" />
      <ellipse cx="43" cy="26" rx="13" ry="15" fill="white" fillOpacity="0.12" />
      <ellipse cx="62" cy="26" rx="13" ry="15" fill="white" fillOpacity="0.12" />
      <ellipse cx="78" cy="38" rx="13" ry="15" fill="white" fillOpacity="0.12" />
    </svg>
  );
}
