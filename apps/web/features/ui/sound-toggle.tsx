"use client";
import { Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSoundPref } from "./sound-pref";

/** Üst bardaki ses açma/kapama anahtarı. Sesler oturum ekranında çalar (features/session/fx.ts). */
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
