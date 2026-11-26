// Verified from the Selar checkout pages: each is a recurring monthly USD subscription.
// Selar does not publish plan names or benefit lists on these pages, so none are invented here.
// Set `name` and `features` below once you have decided them.
export type Plan = {
  key: string;
  name: string;
  priceUsd: number;
  interval: "month";
  checkoutUrl: string;
  description: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    key: "plan_47",
    name: "Plan 1",
    priceUsd: 47,
    interval: "month",
    checkoutUrl: "https://selar.com/47plan?currency=USD",
    description: "Billed monthly. Cancel any time.",
    features: [],
  },
  {
    key: "plan_57",
    name: "Plan 2",
    priceUsd: 57,
    interval: "month",
    checkoutUrl: "https://selar.com/57plan?currency=USD",
    description: "Billed monthly. Cancel any time.",
    features: [],
  },
  {
    key: "plan_97",
    name: "Plan 3",
    priceUsd: 97,
    interval: "month",
    checkoutUrl: "https://selar.com/97plan?currency=USD",
    description: "Billed monthly. Cancel any time.",
    features: [],
  },
];

export const planByPrice = (amount: number) => PLANS.find((p) => p.priceUsd === Math.round(amount));
export const planByKey = (key: string) => PLANS.find((p) => p.key === key);
