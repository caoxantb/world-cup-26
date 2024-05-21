import mongoose from "mongoose";
import { z } from "zod";
import _ from "lodash";

import { matchSchema, matchValidator } from "./match";

const FIELDS = [
  "homeTeam",
  "awayTeam",
  "date",
  "isNeutralVenue",
  "round",
  "homeTeamGoals",
  "awayTeamGoals",
];

export const matchStaticValidator = matchValidator.pick(
  FIELDS.reduce(
    (acc: { [key: string]: boolean }, cur: string) => ((acc[cur] = true), acc),
    {}
  )
);

type IMatchStatic = z.infer<typeof matchStaticValidator>;

const matchStaticSchema = new mongoose.Schema<IMatchStatic>(
  _.pick(matchSchema.obj, FIELDS)
);

const MatchStatic = mongoose.model<IMatchStatic>(
  "MatchStatic",
  matchStaticSchema
);

export default MatchStatic;
