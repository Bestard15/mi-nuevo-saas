/**
 * Alertas de «MRR en riesgo»: detecta posts con dinero esperando y sin
 * señales de movimiento. Lógica documentada en docs/conversion-roi.md.
 */

export const CHURN_WATCH_DAYS = 30;
export const CHURN_RISK_DAYS = 60;

/** Categorías consideradas "sin movimiento": aún no hay respuesta real. */
const STALE_CATEGORIES = new Set(["open", "planned"]);

export interface ChurnRisk {
  level: "watch" | "risk";
  /** Días desde la última señal (transición de estado / edición). */
  days: number;
  /** MRR acumulado de los votantes del post. */
  mrr: number;
}

export function assessChurnRisk(post: {
  revenueImpact: string | number;
  updatedAt: Date;
  statusCategory: string | null | undefined;
}): ChurnRisk | null {
  const mrr = Number(post.revenueImpact);
  if (!(mrr > 0)) return null;
  if (!post.statusCategory || !STALE_CATEGORIES.has(post.statusCategory)) return null;

  const days = Math.floor((Date.now() - post.updatedAt.getTime()) / 86_400_000);
  if (days >= CHURN_RISK_DAYS) return { level: "risk", days, mrr };
  if (days >= CHURN_WATCH_DAYS) return { level: "watch", days, mrr };
  return null;
}
