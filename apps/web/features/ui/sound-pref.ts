"use client";
// Ses tercihi tek yerde: localStorage["yds-ses"], varsayılan açık ("0" = kapalı). Pano anahtarı ve oturum sesleri bunu kullanır.
import { useSyncExternalStore } from "react";

const KEY = "yds-ses";
const EVENT = "yds-ses-change"; // aynı sekmedeki diğer dinleyiciler için ("storage" yalnızca diğer sekmelerde tetiklenir)

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/** Anlık tercih (olay işleyicilerinde okumak için). */
export function readSoundPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeSoundPref(v: boolean): void {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useSoundPref(): [boolean, (v: boolean) => void] {
  const on = useSyncExternalStore(subscribe, readSoundPref, () => true);
  return [on, writeSoundPref];
}
