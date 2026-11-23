"use client";
import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

/** Ses tercihi: localStorage["yds-ses"], varsayılan açık ("0" = kapalı). */
export function useSoundPref(): [boolean, (v: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => true);
  const set = (v: boolean) => {
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  };
  return [on, set];
}

/** Üst bardaki ses açma/kapama anahtarı. Bu görevde yalnızca tercihi saklar; ses çalma oturum ekranında. */
export function SoundToggle() {
  const [on, setOn] = useSoundPref();
  const Icon = on ? Volume2 : VolumeX;
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-full px-2 text-muted">
      <Icon className="size-5" aria-hidden="true" />
      <Switch checked={on} onCheckedChange={setOn} aria-label="Ses" />
    </label>
  );
}
