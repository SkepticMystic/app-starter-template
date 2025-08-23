import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Organization = {
  /** Unique identifier for each organization */
  id: string;
  /** The name of the organization */
  name: string;
  /** The slug of the organization */
  slug: string;
  /** The logo of the organization */
  logo?: string;
  /** Additional metadata for the organization */
  metadata?: string;
};

const model_name = "organization";

export const Organizations = mongoose.model(
  model_name,
  new mongoose.Schema<Organization & Timestamps>(
    {
      id: { type: String },
      name: { type: String, required: true },
      slug: { type: String, required: true },
      logo: { type: String },
      metadata: { type: String },
    },
    { timestamps: true },
  ),
  model_name,
);
