import type { IOrganization } from "$lib/const/organization.const";
import type { Timestamps } from "$lib/interfaces";
import type { InvitationStatus } from "better-auth/plugins";
import mongoose from "mongoose";

export type Invitation = {
  /** Unique identifier for each invitation */
  // id: string;
  /** The email address of the user */
  email: string;
  /** The ID of the inviter */
  inviterId: mongoose.Types.ObjectId;
  /** The ID of the organization */
  organizationId: mongoose.Types.ObjectId;
  /** The role of the user in the organization */
  role: IOrganization.RoleId;
  /** The status of the invitation */
  status: InvitationStatus;
  /** Timestamp of when the invitation expires */
  expiresAt: Date;
};

const model_name = "invitation";

export const Invitations = mongoose.model(
  model_name,
  new mongoose.Schema<Invitation & Timestamps>(
    {
      // id: { type: String },
      email: { type: String, required: true },
      inviterId: { type: mongoose.Schema.Types.ObjectId, required: true },
      organizationId: { type: mongoose.Schema.Types.ObjectId, required: true },
      role: { type: String, required: true },
      status: { type: String, required: true },
      expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
  ),
  model_name,
);
