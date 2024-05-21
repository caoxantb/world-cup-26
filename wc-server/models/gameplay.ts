import mongoose from "mongoose";
import { z } from "zod";

const gameplayValidator = z.object({
  currentDate: z.date().default(new Date("2023-07-21")),
});

type IGameplay = z.infer<typeof gameplayValidator>;

const gameplaySchema = new mongoose.Schema<IGameplay>({
  currentDate: Date,
});

const Gameplay = mongoose.model<IGameplay>("Gameplay", gameplaySchema);

export default Gameplay;
