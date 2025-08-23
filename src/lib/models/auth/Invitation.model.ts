import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Invitation = {
  /** Unique identifier for each invitation */
  id: string;
  /** The email address of the user */
  email: string;
  /** The ID of the inviter */
  inviterId: string;
  /** The ID of the organization */
  organizationId: string;
  /** The role of the user in the organization */
  role: string;
  /** The status of the invitation */
  status: string;
  /** Timestamp of when the invitation expires */
  expiresAt: Date;
};

const model_name = "invitation";

export const Invitations = mongoose.model(
  model_name,
  new mongoose.Schema<Invitation & Timestamps>(
    {
      id: { type: String },
      email: { type: String, required: true },
      inviterId: { type: String, required: true },
      organizationId: { type: String, required: true },
      role: { type: String, required: true },
      status: { type: String, required: true },
      expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
  ),
  model_name,
);
