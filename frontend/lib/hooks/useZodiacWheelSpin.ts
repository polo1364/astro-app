"use client";

import { useCallback, useEffect, useState } from "react";
import { getSignByIndex } from "@/lib/data/zodiacSigns";
import { rotationForSignIndex, WHEEL_SPIN_DURATION_MS } from "@/lib/utils/zodiacWheelMath";
import { useMounted } from "@/lib/hooks/useMounted";

export { WHEEL_SPIN_DURATION_MS };

const SECTOR_DURATION_MS = WHEEL_SPIN_DURATION_MS / 12;
const START_SIGN_INDEX = 10; // 水瓶座
const START_ROTATION_DEG = rotationForSignIndex(START_SIGN_INDEX);

export function useZodiacWheelSpin() {
  const mounted = useMounted();
  const [rotationDeg, setRotationDeg] = useState(START_ROTATION_DEG);
  const [pointerIndex, setPointerIndex] = useState(START_SIGN_INDEX);
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
      // 輪盤從水瓶座對準指針起轉，逆時針連續旋轉
      setRotationDeg(START_ROTATION_DEG - ((elapsed / WHEEL_SPIN_DURATION_MS) * 360) % 360);
      // 中央每 8 秒換一格：水瓶先，依逆時針指針順序（水瓶→雙魚→牡羊…）
      const step = Math.floor(elapsed / SECTOR_DURATION_MS);
      setPointerIndex((START_SIGN_INDEX + step) % 12);
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
    rotationDeg,
    pointerSign,
    reduceMotion,
    modalSignId,
    openModal,
    closeModal,
    setPointerIndex: setPointerIndexManual,
  };
}
