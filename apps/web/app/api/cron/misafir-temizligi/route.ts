// Vercel Cron her gece çağırır (vercel.json): eski misafir hesaplarını ve tüm verilerini siler.
import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { guestCutoff, isCronAuthorized } from "@/lib/guest";

export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization")))
    return Response.json({ error: "yetkisiz" }, { status: 401 });
  const { user } = schema;
  // Oturumlar, cevaplar ve tekrar kayıtları user'a cascade ile bağlı; onlar da silinir.
  const deleted = await db.delete(user)
    .where(and(eq(user.isAnonymous, true), lt(user.createdAt, guestCutoff(new Date()))))
    .returning({ id: user.id });
  return Response.json({ deleted: deleted.length });
}
