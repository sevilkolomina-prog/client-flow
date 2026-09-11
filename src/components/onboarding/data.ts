export const BUSINESS_TYPES = [
  "Freelancer",
  "Agency",
  "Consultant",
  "Small Business",
  "Other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export type OnboardingFormValues = {
  fullName: string;
  companyName: string;
  phone: string;
  businessType: string;
};

export function isBusinessType(value: string): value is BusinessType {
  return (BUSINESS_TYPES as readonly string[]).includes(value);
}
