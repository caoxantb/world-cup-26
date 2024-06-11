import mongoose from "mongoose";
import { z } from "zod";

export const rankingValidator = z.object({
  team: z.string(),
  date: z.date().min(new Date("1992-12-31")),
  position: z.number().int().min(1).max(211),
  points: z.number(),
  gameplay: z.instanceof(mongoose.Schema.Types.ObjectId).optional(),
});

type IRanking = z.infer<typeof rankingValidator>;

const rankingSchema = new mongoose.Schema<IRanking>({
  team: String,
  date: Date,
  position: Number,
  points: Number,
  gameplay: mongoose.Schema.Types.ObjectId,
})

const Ranking = mongoose.model<IRanking>("Ranking", rankingSchema);

export default Ranking;
