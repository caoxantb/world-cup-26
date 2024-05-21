import mongoose from "mongoose";
import { z } from "zod";

const roundValidator = z.object({
  code: z.string().optional(),
  name: z.string(),
  type: z.enum(["knockout", "round-robin"]),
  isTwoLegs: z.boolean(),
  matches: z.array(z.instanceof(mongoose.Schema.Types.ObjectId)),
  teams: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["advanced", "eliminated", "undetermined"]),
      advancedTo: z.string().optional(),
    })
  ),
  numberOfTeams: z.number().int().positive(),
  numberOfGroups: z.number().int().positive().optional(),
  groupStage: z
    .array(
      z.object({
        groupName: z.string(),
        groupData: z.array(
          z.object({
            team: z.string().default("TBD"),
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
  gameplay: z.instanceof(mongoose.Schema.Types.ObjectId),
});

type IRound = z.infer<typeof roundValidator>;

const roundSchema = new mongoose.Schema<IRound>({
  code: String,
  name: String,
  type: String,
  isTwoLegs: Boolean,
  matches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
    },
  ],
  teams: [
    {
      name: String,
      status: String,
      advancedTo: String,
    },
  ],
  numberOfTeams: Number,
  numberOfGroups: Number,
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
  gameplay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gameplay",
  },
});

const Round = mongoose.model<IRound>("Round", roundSchema);

export default Round;
