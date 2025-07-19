import mongoose from "mongoose";
import { z } from "zod";

export const roundStaticValidator = z.object({
  federation: z.string(),
  hosts: z.number().optional(),
  code: z.string(),
  name: z.string(),
  type: z.enum(["knockout", "roundrobin"]),
  legs: z.number(),
  numberOfTeams: z.number(),
  numberOfGroups: z.number().optional(),
  entryTeams: z.array(z.number()).length(2).optional(),
  advancedTo: z.record(z.union([z.string(), z.record(z.string())])).optional(),
});

type IRoundStatic = z.infer<typeof roundStaticValidator>;

const roundStaticSchema = new mongoose.Schema<IRoundStatic>({
  federation: { type: String, required: true },
  hosts: { type: Number },
  code: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["knockout", "roundrobin"], required: true },
  legs: { type: Number, required: true },
  numberOfTeams: { type: Number, required: true },
  numberOfGroups: { type: Number },
  entryTeams: { type: [Number] },
  advancedTo: {
    type: Object,
    default: {},
  },
});

const RoundStatic = mongoose.model<IRoundStatic>(
  "RoundStatic",
  roundStaticSchema
);

export default RoundStatic;
