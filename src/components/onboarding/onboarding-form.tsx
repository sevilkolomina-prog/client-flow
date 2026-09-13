"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { logout } from "@/lib/auth/actions";
import {
  completeOnboarding,
  type OnboardingActionState,
} from "@/components/onboarding/actions";
import {
  BUSINESS_TYPES,
  type OnboardingFormValues,
} from "@/components/onboarding/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: OnboardingActionState = {};

export function OnboardingForm({
  fullName,
  companyName,
  phone,
  businessType,
}: OnboardingFormValues) {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState
  );
  const [selectedType, setSelectedType] = useState(businessType);
  const [logoutPending, startLogout] = useTransition();

  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="onboarding-full-name">Full Name</Label>
        <Input
          id="onboarding-full-name"
          name="fullName"
          autoComplete="name"
          defaultValue={fullName}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="onboarding-company">Company Name</Label>
        <Input
          id="onboarding-company"
          name="companyName"
          autoComplete="organization"
          defaultValue={companyName}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="onboarding-phone">Phone</Label>
        <Input
          id="onboarding-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={phone}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="onboarding-business-type">Business Type</Label>
        <input type="hidden" name="businessType" value={selectedType} />
        <Select
          value={selectedType || null}
          onValueChange={(value) => {
            if (value) {
              setSelectedType(value);
            }
          }}
        >
          <SelectTrigger id="onboarding-business-type" className="w-full">
            <SelectValue placeholder="Select a business type" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || !selectedType}
      >
        {pending ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : null}
        {pending ? "Saving..." : "Continue to dashboard"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={pending || logoutPending}
        onClick={() => {
          startLogout(() => {
            void logout();
          });
        }}
      >
        {logoutPending ? "Logging out..." : "Log out"}
      </Button>
    </form>
  );
}
