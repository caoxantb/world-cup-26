import mongoose from "mongoose";
import { z } from "zod";

export const roundValidator = z.object({
  code: z.string(),
  teams: z.array(
    z.object({
      team: z.string(),
      qualifiedAs: z.string().default("Entrance"),
      qualifiedDate: z.date().default(new Date("2023-07-31")),
      status: z
        .enum(["advanced", "eliminated", "undetermined", "finished"])
        .default("undetermined"),
      advancedTo: z.string().optional(),
    })
  ),
  groupStage: z
    .array(
      z.object({
        groupName: z.string(),
        groupData: z.array(
          z.object({
            team: z.string(),
            matchesPlayed: z.number().int().nonnegative().default(0),
            wins: z.number().int().nonnegative().default(0),
            draws: z.number().int().nonnegative().default(0),
            losses: z.number().int().nonnegative().default(0),
            goalsFor: z.number().int().nonnegative().default(0),
            goalsAgainst: z.number().int().nonnegative().default(0),
            goalsDifference: z.number().int().default(0),
            points: z.number().int().nonnegative().default(0),
          })
        ),
      })
    )
    .optional(),
  gameplay: z.instanceof(mongoose.Types.ObjectId),
});

type IRound = z.infer<typeof roundValidator>;

const roundSchema = new mongoose.Schema<IRound>({
  code: String,
  teams: [
    {
      team: String,
      qualifiedDate: Date,
      qualifiedAs: String,
      status: String,
      advancedTo: String,
    },
  ],
  groupStage: [
    {
      groupName: String,
      groupData: [
        {
          team: String,
          matchesPlayed: Number,
          wins: Number,
          draws: Number,
          losses: Number,
          goalsFor: Number,
          goalsAgainst: Number,
          goalsDifference: Number,
          points: Number,
        },
      ],
    },
  ],
  gameplay: mongoose.Types.ObjectId,
});

const Round = mongoose.model<IRound>("Round", roundSchema);

export default Round;
