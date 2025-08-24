import type { IOrganization } from "$lib/const/organization.const";
import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Member = {
  /** Unique identifier for each member */
  // id: string;
  /** The ID of the user */
  userId: mongoose.Types.ObjectId;
  /** The ID of the organization */
  organizationId: mongoose.Types.ObjectId;
  /** The role of the user in the organization */
  role: IOrganization.RoleId;
};

const model_name = "member";

export const Members = mongoose.model(
  model_name,
  new mongoose.Schema<Member & Timestamps>(
    {
      // id: { type: String },
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      organizationId: { type: mongoose.Schema.Types.ObjectId, required: true },
      role: { type: String, required: true },
    },
    { timestamps: true },
  ),
  model_name,
);
