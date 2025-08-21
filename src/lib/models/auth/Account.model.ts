// id	string	PK	Unique identifier for each account
// userId	string	FK	The ID of the user
// accountId	string	-	The ID of the account as provided by the SSO or equal to userId for credential accounts
// providerId	string	-	The ID of the provider
// accessToken	string	?	The access token of the account. Returned by the provider
// refreshToken	string	?	The refresh token of the account. Returned by the provider
// accessTokenExpiresAt	Date	?	The time when the access token expires
// refreshTokenExpiresAt	Date	?	The time when the refresh token expires
// scope	string	?	The scope of the account. Returned by the provider
// idToken	string	?	The ID token returned from the provider
// password	string	?	The password of the account. Mainly used for email and password authentication
// createdAt	Date	-	Timestamp of when the account was created
// updatedAt	Date	-	Timestamp of when the account was updated

import type { OID, Timestamps } from "$lib/interfaces";
import mongoose from "mongoose";

export type Account = {
  /** Unique identifier for each account */
  id: string;
  /** The ID of the user associated with this account */
  userId: string;
  /** The ID of the account as provided by the SSO or equal to userId for credential accounts */
  accountId: string;
  /** The ID of the provider */
  providerId: string;
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
} & Timestamps;

const model_name = "account";

export const AccountModel: mongoose.Model<OID<Account>> =
  mongoose.models[model_name] ||
  mongoose.model(
    model_name,
    new mongoose.Schema<Account>(
      {
        id: { type: String, required: true },
        userId: { type: String, required: true },
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
