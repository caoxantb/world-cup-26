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
  pastFIFARankings: z.array(
    z.object({
      date: z.date().min(new Date("1992-12-31")),
      position: z.number().int().min(1).max(211),
    })
  ),
  pastWorldCupStats: z.array(
    z.object({
      year: z.number().int().min(1930).max(2022),
      place: z.string(),
    })
  ),
  initialUEFARanking: z.number().int().min(1).max(55).optional(),
  xGoalData: z.array(
    z.object({
      thenFIFARanking: z.number().int().min(1).max(211),
      thenOpponentFIFARanking: z.number().int().min(1).max(211),
      goalsScored: z.number().int().nonnegative(),
      goalsConceded: z.number().int().nonnegative(),
    })
  ),
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
  pastFIFARankings: [
    {
      date: Date,
      position: Number,
    },
  ],
  pastWorldCupStats: [{ year: Number, place: String }],
  initialUEFARanking: Number,
  xGoalData: [
    {
      thenFIFARanking: Number,
      thenOpponentFIFARanking: Number,
      goalsScored: Number,
      goalsConceded: Number,
    },
  ],
  homeStadium: String,
  federation: String,
});

const TeamStatic = mongoose.model<ITeamStatic>("TeamStatic", teamStaticSchema);

export default TeamStatic;
