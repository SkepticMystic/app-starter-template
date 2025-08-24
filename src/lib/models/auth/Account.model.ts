import type { IAuth } from "$lib/const/auth.const";
import mongoose from "mongoose";

export type Account = {
  /** Unique identifier for each account */
  // id: string;
  /** The ID of the user associated with this account */
  userId: mongoose.Types.ObjectId;
  // NOTE: NOT an ObjectId, this is external from the SSO provider
  /** The ID of the account as provided by the SSO or equal to userId for credential accounts */
  accountId: string;
  /** The ID of the provider */
  providerId: IAuth.ProviderId;
  /** The access token of the account. Returned by the provider */
  accessToken?: string;
  /** The refresh token of the account. Returned by the provider */
  refreshToken?: string;
  /** The time when the access token expires */
  accessTokenExpiresAt?: Date;
  /** The time when the refresh token expires */
  refreshTokenExpiresAt?: Date;
  /** The scope of the account. Returned by the provider */
  scope?: string;
  /** The ID token returned from the provider */
  idToken?: string;
  /** The password of the account. Mainly used for email and password authentication */
  password?: string;
};

const model_name = "account";

export const Accounts = mongoose.model(
  model_name,
  new mongoose.Schema<Account>(
    {
      // id: { type: String },
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      accountId: { type: String, required: true },
      providerId: { type: String, required: true },
      accessToken: { type: String },
      refreshToken: { type: String },
      accessTokenExpiresAt: { type: Date },
      refreshTokenExpiresAt: { type: Date },
      scope: { type: String },
      idToken: { type: String },
      password: { type: String },
    },
    { timestamps: true },
  ),
  model_name,
);
