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
  leg: z.number().optional(),
  group: z.string().optional(),
  matchday: z.number().optional(),
  homeTeamGoals: z.number().int().optional(),
  awayTeamGoals: z.number().int().optional(),
  homeTeamExtraTimeGoals: z.number().int().optional(),
  awayTeamExtraTimeGoals: z.number().int().optional(),
  homeTeamGoalMinutes: z.array(z.number()).optional(),
  awayTeamGoalMinutes: z.array(z.number()).optional(),
  homeTeamAggs: z.number().int().optional(),
  awayTeamAggs: z.number().int().optional(),
  teamTakenFirstPenalty: z.string().optional(),
  homeTeamPenalties: z.array(z.number().int().min(0).max(1)).optional(),
  awayTeamPenalties: z.array(z.number().int().min(0).max(1)).optional(),
  homeTeamPenaltiesGoals: z.number().optional(),
  awayTeamPenaltiesGoals: z.number().optional(),
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
  leg: Number,
  group: String,
  matchday: Number,
  homeTeamGoals: Number,
  awayTeamGoals: Number,
  homeTeamExtraTimeGoals: Number,
  awayTeamExtraTimeGoals: Number,
  homeTeamGoalMinutes: [Number],
  awayTeamGoalMinutes: [Number],
  homeTeamAggs: Number,
  awayTeamAggs: Number,
  homeTeamPenalties: [Number],
  awayTeamPenalties: [Number],
  homeTeamPenaltiesGoals: Number,
  awayTeamPenaltiesGoals: Number,
  teamTakenFirstPenalty: String,
  gameplay: mongoose.Schema.Types.ObjectId,
});

const Match = mongoose.model<IMatch>("Match", matchSchema);

export default Match;
