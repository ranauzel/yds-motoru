import { describe, expect, it, vi } from "vitest";
import { celebrate } from "./celebrate";

const spyFx = () => ({ play: vi.fn(), burst: vi.fn(), toast: vi.fn() });

describe("celebrate", () => {
  it("ses ve hareket açık, 1. doğru: tını + küçük patlama, bildirim yok", () => {
    const fx = spyFx(); celebrate("correct", { streak: 1, sound: true, reducedMotion: false, fx });
    expect(fx.play).toHaveBeenCalledWith("correct"); expect(fx.burst).toHaveBeenCalledWith(false); expect(fx.toast).not.toHaveBeenCalled();
  });
  it("3. doğru: büyük patlama + bildirim", () => {
    const fx = spyFx(); celebrate("correct", { streak: 3, sound: true, reducedMotion: false, fx });
    expect(fx.play).toHaveBeenCalledWith("streak"); expect(fx.burst).toHaveBeenCalledWith(true); expect(fx.toast).toHaveBeenCalledWith("3 doğru üst üste — ritmi yakaladın");
  });
  it("ses kapalı: hiç ses yok; hareket azaltılmış: patlama yok", () => {
    const fx = spyFx(); celebrate("correct", { streak: 1, sound: false, reducedMotion: true, fx });
    expect(fx.play).not.toHaveBeenCalled(); expect(fx.burst).not.toHaveBeenCalled();
  });
  it("yanlış: yalnızca yumuşak ses, emoji yok", () => {
    const fx = spyFx(); celebrate("wrong", { streak: 0, sound: true, reducedMotion: false, fx });
    expect(fx.play).toHaveBeenCalledWith("wrong"); expect(fx.burst).not.toHaveBeenCalled();
  });
});
