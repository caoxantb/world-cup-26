import mongoose from "mongoose";
import { z } from "zod";

export const stadiumValidator = z.object({
  name: z.string(),
  city: z.string(),
  hostCountry: z.string(),
  hostOpeningMatch: z.string().optional(),
  capacity: z.number().min(20000),
  type: z.enum(["north_america", "centenario", "custom"]),
  group: z.number(),
  coordinations: z.tuple([z.number(), z.number()]),
  gameplay: z.instanceof(mongoose.Types.ObjectId).optional(),
});

export type IStadium = z.infer<typeof stadiumValidator>;

const stadiumSchema = new mongoose.Schema<IStadium>({
  name: String,
  city: String,
  hostCountry: String,
  hostOpeningMatch: String,
  capacity: Number,
  type: String,
  coordinations: [Number],
  group: Number,
  gameplay: mongoose.Types.ObjectId,
});

const Stadium = mongoose.model<IStadium>("Stadium", stadiumSchema);

export default Stadium;
