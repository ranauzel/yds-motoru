"use client";
import { useEffect, useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { tr } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { todayKey } from "@/features/session/day";
import { setExamDate } from "../actions";

const LATER_KEY = "yds-sinav-sonra";

const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const longDate = (key: string) => fromKey(key).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Sınav tarihini seçtiren pencere. autoOpen: tarih yoksa ve kullanıcı "Sonra" demediyse kendiliğinden açılır.
 * trigger: pencereyi açan öğe (ör. pano kartı); Base UI tıklama ve aria özelliklerini ona ekler.
 */
export function ExamDateDialog({ initial, autoOpen, trigger }: { initial: string | null; autoOpen: boolean; trigger?: ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(initial);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!autoOpen) return;
    let seen = false;
    try {
      seen = !!localStorage.getItem(LATER_KEY);
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 0); // localStorage yalnızca istemcide okunur; açılış efektten sonra
    return () => clearTimeout(t);
  }, [autoOpen]);

  const later = () => {
    try {
      localStorage.setItem(LATER_KEY, "1");
    } catch {}
    setOpen(false);
  };

  const save = () =>
    startTransition(async () => {
      const res = await setExamDate(selected);
      if (!res.ok) return setError(true);
      setError(false);
      setOpen(false);
      router.refresh();
    });

  const today = fromKey(todayKey(new Date()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sınavın ne zaman?</DialogTitle>
          <DialogDescription>
            {selected ? `Seçtiğin gün: ${longDate(selected)}` : "Tarihi bilirsen geri sayımı gösteririz. İstersen sonra da seçebilirsin."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            locale={tr}
            weekStartsOn={1}
            selected={selected ? fromKey(selected) : undefined}
            onSelect={(d) => setSelected(d ? toKey(d) : null)}
            disabled={{ before: today }}
            defaultMonth={selected ? fromKey(selected) : today}
            className="[--cell-size:--spacing(12)]"
          />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">Tarih kaydedilemedi. Başka bir gün seçip tekrar dene.</p>}
        <DialogFooter>
          <Button variant="outline" className="h-12 px-5 text-base" onClick={later} disabled={pending}>
            Sonra
          </Button>
          <Button className="h-12 px-5 text-base" onClick={save} disabled={pending || !selected}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
