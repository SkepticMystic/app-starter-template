import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Session = {
  /** Unique identifier for each session */
  id: string;
  /** The ID of the user associated with this session */
  userId: string;
  /** The unique session token */
  token: string;
  /** The time when the session expires */
  expiresAt: Date;
  /** The IP address of the device */
  ipAddress?: string;
  /** The user agent information of the device */
  userAgent?: string;

  // Admin //

  /** The ID of the admin that is impersonating this session */
  impersonatedBy?: string;

  // Organization //

  // NOTE: Optional by default in BetterAuth, but we guarantee it's set in our hooks
  /** The ID of the active organization */
  activeOrganizationId: string;
};

const model_name = "session";

export const Sessions = mongoose.model(
  model_name,
  new mongoose.Schema<Session & Timestamps>(
    {
      id: { type: String },
      userId: { type: String, required: true },
      token: { type: String, required: true },
      expiresAt: { type: Date, required: true },
      ipAddress: { type: String },
      userAgent: { type: String },

      // Admin //
      impersonatedBy: { type: String },

      // Organization //
      activeOrganizationId: { type: String, required: true },
    },
    { timestamps: true },
  ),
  model_name,
);
