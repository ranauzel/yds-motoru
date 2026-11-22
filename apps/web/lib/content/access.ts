// Soru erişimi: kim görür, aktarımda hangi satırlar kime yazılabilir (saf fonksiyonlar, testli).
// Kural: gerçek sorular yalnızca sahibine görünür; herkese açık olanlar yalnızca örnek sorulardır.

/** Bir soru satırının erişim bilgisi. Varsayılan gizlidir (is_public = false). */
export type Access = { ownerId: string | null; isPublic: boolean };

/** Aktarılan sorulara yazılacak erişim. Örnekler herkese açık, gerçek sorular sahibine ait. */
export function importAccess({ isExample, ownerId }: { isExample: boolean; ownerId: string | null }): Access {
  if (isExample) {
    if (ownerId) throw new Error("Örnek sorular herkese açıktır, --sahip ile aktarılmaz (misafirler göremezdi).");
    return { ownerId: null, isPublic: true };
  }
  if (!ownerId)
    throw new Error("Gerçek sorular sahip belirtmeden aktarılmaz (herkese açılmasınlar diye). Şöyle çalıştır:\n  pnpm content:import --sahip <e-postan>");
  return { ownerId, isPublic: false };
}

/**
 * Aktarımın erişimini değiştireceği mevcut satırlar: başkasının sorusu devralınamaz, örnek bir hesaba
 * geçirilemez, bir hesabın sorusu herkese açılamaz. Sahipsiz gizli satırlar (bu kural gelmeden önce
 * aktarılmış) sahiplenilebilir.
 */
export function findTakeovers(existing: Map<string, Access>, ids: string[], target: Access): string[] {
  return ids.filter((id) => {
    const e = existing.get(id);
    if (!e || (e.ownerId === null && !e.isPublic)) return false;
    return e.ownerId !== target.ownerId || e.isPublic !== target.isPublic;
  });
}
