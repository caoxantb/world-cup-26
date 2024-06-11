import mongoose from "mongoose";
import { z } from "zod";

export const teamValidator = z.object({
  code: z.string().length(3),
  currentFIFAPoints: z.number(),
  isHost: z.boolean().default(false),
  xGoalData: z.object({
    numberOfDataPoints: z.number().int(),
    sumRankDiff: z.number().int(),
    sumGoalsScored: z.number().int(),
    sumGoalsConceded: z.number().int(),
    sumRankDiffSquare: z.number().int(),
    sumDotScored: z.number().int(),
    sumDotConceded: z.number().int(),
  }),
  xGoalForParams: z.array(z.number()).length(2),
  xGoalAgainstParams: z.array(z.number()).length(2),
  federation: z.string(),
  gameplay: z.instanceof(mongoose.Types.ObjectId),
});

type ITeam = z.infer<typeof teamValidator>;

export const teamSchema = new mongoose.Schema<ITeam>({
  code: String,
  currentFIFAPoints: Number,
  isHost: Boolean,
  xGoalData: {
    numberOfDataPoints: Number,
    sumRankDiff: Number,
    sumGoalsScored: Number,
    sumGoalsConceded: Number,
    sumRankDiffSquare: Number,
    sumDotScored: Number,
    sumDotConceded: Number,
  },
  xGoalForParams: [Number],
  xGoalAgainstParams: [Number],
  federation: String,
  gameplay: mongoose.Schema.Types.ObjectId,
});

teamSchema.index({ name: 1, currentFIFAPoints: -1 });

const Team = mongoose.model<ITeam>("Team", teamSchema);

export default Team;
