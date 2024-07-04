import mongoose from "mongoose";
import { z } from "zod";

export const teamStaticValidator = z.object({
  name: z.string(),
  code: z.string().length(3),
  flag: z.string().url(),
  logo: z.string().url(),
  kits: z.object({
    homeKit: z.string().url(),
    awayKit: z.string().url(),
  }),
  initialFIFAPoints: z.number(),
  initialUEFARanking: z.number().int().min(1).max(55).optional(),
  pastWorldCupStats: z.array(
    z.object({
      year: z.number().int().min(1930).max(2022),
      place: z.string(),
    })
  ),
  xGoalData: z.object({
    numberOfDataPoints: z.number().int(),
    sumRankDiff: z.number().int(),
    sumGoalsScored: z.number().int(),
    sumGoalsConceded: z.number().int(),
    sumRankDiffSquare: z.number().int(),
    sumDotScored: z.number().int(),
    sumDotConceded: z.number().int(),
  }),
  homeStadium: z.string(),
  federation: z.string(),
});

type ITeamStatic = z.infer<typeof teamStaticValidator>;

const teamStaticSchema = new mongoose.Schema<ITeamStatic>({
  name: String,
  code: String,
  flag: String,
  logo: String,
  kits: {
    homeKit: String,
    awayKit: String,
  },
  initialFIFAPoints: Number,
  initialUEFARanking: Number,
  pastWorldCupStats: [{ year: Number, place: String }],
  xGoalData: {
    numberOfDataPoints: Number,
    sumRankDiff: Number,
    sumGoalsScored: Number,
    sumGoalsConceded: Number,
    sumRankDiffSquare: Number,
    sumDotScored: Number,
    sumDotConceded: Number,
  },
  homeStadium: String,
  federation: String,
});

teamStaticSchema.index({
  federation: 1,
  initialUEFARanking: 1,
  currentFIFAPoints: -1,
});

const TeamStatic = mongoose.model<ITeamStatic>("TeamStatic", teamStaticSchema);

export default TeamStatic;
