import type { IAccessControl } from "$lib/const/access_control.const";
import type { Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type User = {
  /** Unique identifier for each user */
  // id: string;
  /** User's chosen display name */
  name: string;
  /** User's email address for communication and login */
  email: string;
  /** Whether the user's email is verified */
  emailVerified: boolean;
  /** User's image url */
  image?: string;

  // Admin

  /** The user's role. Defaults to `user`. Admins will have the `admin` role. */
  role?: IAccessControl.RoleId;
  /** Indicates whether the user is banned. */
  banned?: boolean;
  /** The reason for the user's ban. */
  banReason?: string;
  /** The date when the user's ban will expire. */
  banExpires?: Date;
};

const model_name = "user";

export const Users = mongoose.model(
  model_name,
  new mongoose.Schema<User & Timestamps>(
    {
      // id: { type: String },
      name: { type: String, required: true },
      email: { type: String, required: true },
      emailVerified: { type: Boolean, default: false },
      image: { type: String, default: null },

      role: { type: String, default: "user" },
      banned: { type: Boolean, default: false },
      banReason: { type: String, default: null },
      banExpires: { type: Date, default: null },
    },
    { timestamps: true },
  ),
  model_name,
);
