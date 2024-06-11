import { Request, Response } from "express";

import { Gameplay } from "../../models";
import { Unauthorized } from "../../utils/httpError";

export const gameplayQueries = {};

export const gameplayMutations = {
  createNewGameplay: async (
    parents: undefined,
    args: {name: string},
    context: { req: Request; res: Response }
  ) => {
    if (!context.req.user) {
      throw new Unauthorized("You must be logged in to create a new gameplay.");
    }
    const gameplay = new Gameplay({
      user: context.req.user,
      name: args.name,
    });
    const newGameplay = await gameplay.save();
    context.req.gameplay = newGameplay._id;
  },
};
