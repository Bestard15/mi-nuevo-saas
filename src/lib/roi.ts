/**
 * Motor de ROI del simulador de la landing. Fórmulas y supuestos
 * documentados en docs/conversion-roi.md — ese documento manda.
 *
 * Módulo puro y aislado (sin db/stripe) porque lo importa un client
 * component; los precios se duplican aquí a propósito.
 */

export const ROI_ASSUMPTIONS = {
  triageMinutesPerSuggestion: 10,
  buildRate: 0.1,
  hoursPerFeature: 8,
  misprioritizedRate: 0.35,
  votesPerSuggestion: 1.8,
  payingVoterRate: 0.25,
  buriedRevenueRate: 0.4,
  recoverableRate: 0.25,
  devHourlyCost: 60,
} as const;

export const ROI_PLANS = [
  { key: "free", name: "Free", price: 0, maxSuggestions: 30 },
  { key: "starter", name: "Starter", price: 19, maxSuggestions: 150 },
  { key: "growth", name: "Growth", price: 49, maxSuggestions: Infinity },
] as const;

export interface RoiResult {
  /** Horas de desarrollo desperdiciadas al mes priorizando por volumen. */
  wastedHours: number;
  /** Margen Silencioso: $/mes de clientes de pago ignorados. */
  silentMargin: number;
  /** Valor mensual recuperable con priorización por revenue. */
  monthlyValue: number;
  plan: (typeof ROI_PLANS)[number];
  /** Días hasta que el plan se paga solo (0 = inmediato, plan Free). */
  paybackDays: number;
}

export function computeRoi(suggestions: number, arpu: number): RoiResult {
  const a = ROI_ASSUMPTIONS;

  const wastedHours =
    suggestions * (a.triageMinutesPerSuggestion / 60) +
    suggestions * a.buildRate * a.hoursPerFeature * a.misprioritizedRate;

  const silentMargin =
    suggestions * a.votesPerSuggestion * a.payingVoterRate * arpu * a.buriedRevenueRate;

  const monthlyValue = silentMargin * a.recoverableRate + wastedHours * a.devHourlyCost;

  const plan = ROI_PLANS.find((p) => suggestions <= p.maxSuggestions) ?? ROI_PLANS[2];

  const paybackDays =
    plan.price === 0 || monthlyValue <= 0
      ? 0
      : Math.max(1, Math.ceil(plan.price / (monthlyValue / 30)));

  return { wastedHours, silentMargin, monthlyValue, plan, paybackDays };
}
