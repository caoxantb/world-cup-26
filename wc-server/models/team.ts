import mongoose from "mongoose";
import { z } from "zod";

export const teamValidator = z.object({
  code: z.string().length(3),
  pastFIFARankings: z.array(
    z.object({
      date: z.date().min(new Date("1992-12-31")),
      position: z.number().int().min(1).max(211),
    })
  ),
  currentFIFAPoints: z.number(),
  currentFIFARanking: z.number().int().min(1).max(211),
  isHost: z.boolean().default(false),
  xGoalData: z.array(
    z.object({
      thenFIFARanking: z.number().int().min(1).max(211),
      thenOpponentFIFARanking: z.number().int().min(1).max(211),
      goalsScored: z.number().int().nonnegative(),
      goalsConceded: z.number().int().nonnegative(),
    })
  ),
  xGoalParams: z.array(z.number()).length(2),

  gameplay: z.instanceof(mongoose.Schema.Types.ObjectId),
});

type ITeam = z.infer<typeof teamValidator>;

export const teamSchema = new mongoose.Schema<ITeam>({
  code: String,
  pastFIFARankings: [
    {
      date: Date,
      position: String,
    },
  ],
  currentFIFAPoints: Number,
  currentFIFARanking: Number,
  isHost: Boolean,
  xGoalData: [
    {
      thenFIFARanking: Number,
      thenOpponentFIFARanking: Number,
      goalsScored: Number,
      goalsConceded: Number,
    },
  ],
  xGoalParams: [Number],
  gameplay: mongoose.Schema.Types.ObjectId,
});

const Team = mongoose.model<ITeam>("Team", teamSchema);

export default Team;
