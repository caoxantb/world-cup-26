import mongoose from "mongoose";
import { z } from "zod";

export const matchValidator = z.object({
  code: z.string().optional(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  date: z.date(),
  stadium: z.string().optional(),
  isNeutralVenue: z.boolean().optional(),
  round: z.string(),
  leg: z.enum(["1st", "2nd"]).optional(),
  group: z.string().optional(),
  homeTeamGoals: z.number().int(),
  awayTeamGoals: z.number().int(),
  homeTeamExtraTimeGoals: z.number().int().optional(),
  awayTeamExtraTimeGoals: z.number().int().optional(),
  goalMinutes: z.array(z.number()),
  homeTeamAggs: z.number().int().optional(),
  awayTeamAggs: z.number().int().optional(),
  homeTeamPenalties: z.number().int().optional(),
  awayTeamPenalties: z.number().int().optional(),
  gameplay: z.instanceof(mongoose.Types.ObjectId),
});

type IMatch = z.infer<typeof matchValidator>;

export const matchSchema = new mongoose.Schema<IMatch>({
  code: String,
  homeTeam: String,
  awayTeam: String,
  date: Date,
  stadium: String,
  isNeutralVenue: Boolean,
  round: String,
  leg: String,
  group: String,
  homeTeamGoals: Number,
  awayTeamGoals: Number,
  homeTeamExtraTimeGoals: Number,
  awayTeamExtraTimeGoals: Number,
  goalMinutes: [Number],
  homeTeamAggs: Number,
  awayTeamAggs: Number,
  homeTeamPenalties: Number,
  awayTeamPenalties: Number,
  gameplay: mongoose.Schema.Types.ObjectId,
});

const Match = mongoose.model<IMatch>("Match", matchSchema);

export default Match;
