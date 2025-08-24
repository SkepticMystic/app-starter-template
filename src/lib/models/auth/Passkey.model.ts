import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Passkey = {
  /** Unique identifier for each passkey */
  // id: string;
  /** The name of the passkey */
  name?: string;
  /** The public key of the passkey */
  publicKey: string;
  /** The ID of the user */
  userId: mongoose.Types.ObjectId;
  /** The unique identifier of the registered credential */
  credentialID: string;
  /** The counter of the passkey */
  counter: number;
  /** The type of device used to register the passkey */
  deviceType: string;
  /** Whether the passkey is backed up */
  backedUp: boolean;
  /** The transports used to register the passkey */
  transports: string[];
  /** Authenticator's Attestation GUID indicating the type of the authenticator */
  aaguid?: string;
};

const model_name = "passkey";

export const Passkeys = mongoose.model(
  model_name,
  new mongoose.Schema<Passkey & Timestamps>(
    {
      // id: { type: String },
      name: { type: String, required: false },
      publicKey: { type: String, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      credentialID: { type: String, required: true },
      counter: { type: Number, required: true },
      deviceType: { type: String, required: true },
      backedUp: { type: Boolean, required: true },
      transports: { type: [String], required: true },
      aaguid: { type: String, required: false },
    },
    { timestamps: true },
  ),
  model_name,
);
