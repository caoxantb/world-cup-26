import mongoose from "mongoose";
import { number, z } from "zod";

const gameplayValidator = z.object({
  name: z.string(),
  ingameCurrentDate: z.date().default(() => new Date("2023-07-21")),
  type: z.enum(["north_america", "centenario", "custom"]),
  hosts: z.array(
    z.object({
      name: z.string(),
      order: z.number(),
      federation: z.string(),
    })
  ),
  user: z.instanceof(mongoose.Types.ObjectId),
});

type IGameplay = z.infer<typeof gameplayValidator>;

const gameplaySchema = new mongoose.Schema<IGameplay>({
  name: String,
  ingameCurrentDate: Date,
  type: String,
  hosts: [
    {
      name: String,
      order: Number,
      federation: String,
    },
  ],
  user: mongoose.Schema.Types.ObjectId,
});

const Gameplay = mongoose.model<IGameplay>("Gameplay", gameplaySchema);

export default Gameplay;
