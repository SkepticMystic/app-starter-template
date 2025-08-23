import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Member = {
  /** Unique identifier for each member */
  id: string;
  /** The ID of the user */
  userId: string;
  /** The ID of the organization */
  organizationId: string;
  /** The role of the user in the organization */
  role: string;
};

const model_name = "member";

export const Members = mongoose.model(
  model_name,
  new mongoose.Schema<Member & Timestamps>(
    {
      id: { type: String },
      userId: { type: String, required: true },
      organizationId: { type: String, required: true },
      role: { type: String, required: true },
    },
    { timestamps: true },
  ),
  model_name,
);
