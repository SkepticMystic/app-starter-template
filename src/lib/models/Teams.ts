import type { OID, Timestamps } from "$lib/interfaces";
import mongoose, { Model } from "mongoose";

export type Team = {} & Timestamps;

const model_name = "Teams";

export const Teams: Model<OID<Team>> =
  mongoose.models[model_name] ||
  mongoose.model(
    model_name,
    new mongoose.Schema({}, { timestamps: true }),
    model_name,
  );
