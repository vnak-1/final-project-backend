"use client";

import { Field, FieldInput } from "@/components/forms/Field";

interface AuctionFieldsProps {
  errors: Record<string, string>;
}

/**
 * Extra inputs shown on the new-listing form when the type is "Auction": when bidding closes,
 * and the smallest amount each new bid must add. The form checks and converts them on submit.
 */
export function AuctionFields({ errors }: AuctionFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Auction ends (within 30 days)" error={errors.auctionEndsAt}>
        <FieldInput name="auctionEndsAt" type="datetime-local" className="bg-brand-50/40" />
      </Field>
      <Field label="Minimum raise (USD)" error={errors.minIncrement}>
        <FieldInput
          name="minIncrement"
          type="number"
          min={0.01}
          step="any"
          defaultValue={1}
          inputMode="decimal"
          className="bg-brand-50/40"
        />
      </Field>
    </div>
  );
}
