import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Verification = {
  /** Unique identifier for each verification */
  // id: string;
  /** The identifier for the verification request */
  identifier: string;
  /** The value to be verified */
  value: string;
  /** The time when the verification request expires */
  expiresAt: Date;
};

const model_name = "verification";

export const Verifications = mongoose.model(
  model_name,
  new mongoose.Schema<Verification & Timestamps>(
    {
      // id: { type: String },
      identifier: { type: String, required: true },
      value: { type: String, required: true },
      expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
  ),
  model_name,
);
