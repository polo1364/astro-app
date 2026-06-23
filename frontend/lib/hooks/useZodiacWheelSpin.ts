"use client";

import { useCallback, useEffect, useState } from "react";
import { getSignByIndex } from "@/lib/data/zodiacSigns";
import { WHEEL_SPIN_DURATION_MS } from "@/lib/utils/zodiacWheelMath";
import { useMounted } from "@/lib/hooks/useMounted";

export { WHEEL_SPIN_DURATION_MS };

const SECTOR_DURATION_MS = WHEEL_SPIN_DURATION_MS / 12;

export function useZodiacWheelSpin() {
  const mounted = useMounted();
  const [rotationDeg, setRotationDeg] = useState(0);
  const [pointerIndex, setPointerIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [modalSignId, setModalSignId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mounted || reduceMotion) return;

    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      // 輪盤從 0° 起轉（牡羊在頂端），順時針連續旋轉
      setRotationDeg(((elapsed / WHEEL_SPIN_DURATION_MS) * 360) % 360);
      // 中央每 8 秒換一格：牡羊先，依順時針指針順序（牡羊→雙魚→水瓶…）
      const step = Math.floor(elapsed / SECTOR_DURATION_MS);
      setPointerIndex(((0 - step) % 12 + 12) % 12);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted, reduceMotion]);

  const pointerSign = getSignByIndex(pointerIndex);

  const openModal = useCallback((signId: string) => setModalSignId(signId), []);
  const closeModal = useCallback(() => setModalSignId(null), []);

  const setPointerIndexManual = useCallback((index: number) => {
    setPointerIndex(((index % 12) + 12) % 12);
  }, []);

  return {
    mounted,
    rotationDeg: mounted ? rotationDeg : 0,
    pointerSign,
    reduceMotion,
    modalSignId,
    openModal,
    closeModal,
    setPointerIndex: setPointerIndexManual,
  };
}
