"use client";
// Sayarak yükselen sayı (özet ekranındaki doğru sayısı). Hareket kapalıysa doğrudan son değer görünür.
// Yalnızca tarayıcıda kurulan oturum akışında kullanılır (practice-session.tsx), bu yüzden matchMedia güvenli.
import { useEffect, useState } from "react";

const reducedMotion = () => typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(() => (reducedMotion() ? to : 0));
  useEffect(() => {
    if (reducedMotion() || to <= 0) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(Math.min(i, to));
      if (i >= to) clearInterval(t);
    }, Math.max(40, Math.round(560 / to)));
    return () => clearInterval(t);
  }, [to]);
  return <>{n}</>;
}
