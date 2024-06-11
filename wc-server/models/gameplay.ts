import mongoose from "mongoose";
import { z } from "zod";

const gameplayValidator = z.object({
  name: z.string(),
  ingameCurrentDate: z.date().default(new Date("2023-07-21")),
  user: z.instanceof(mongoose.Types.ObjectId),
});

type IGameplay = z.infer<typeof gameplayValidator>;

const gameplaySchema = new mongoose.Schema<IGameplay>({
  name: String,
  ingameCurrentDate: Date,
  user: mongoose.Schema.Types.ObjectId,
});

const Gameplay = mongoose.model<IGameplay>("Gameplay", gameplaySchema);

export default Gameplay;
