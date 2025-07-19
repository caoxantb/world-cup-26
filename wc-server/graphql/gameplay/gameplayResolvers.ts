import { Request, Response } from "express";

import { Gameplay } from "../../models";
import { BadRequest, Unauthorized } from "../../utils/httpError";

export const gameplayQueries = {
  accessGameplay: async (
    parents: undefined,
    args: { id: string },
    context: { req: Request; res: Response }
  ) => {
    const { id } = args;
    const { req, res } = context;

    const gameplay = await Gameplay.findById(id);

    if (!gameplay) throw new BadRequest("No gameplay existed");

    return gameplay;
  },
};

export const gameplayMutations = {
  createNewGameplay: async (
    parents: undefined,
    args: {
      name: string;
      type: string;
      hosts: { name: string; federation: string; order: number }[];
    },
    context: { req: Request; res: Response }
  ) => {
    if (!context.req.user) {
      throw new Unauthorized("You must be logged in to create a new gameplay.");
    }
    const { name, hosts, type } = args;
    const gameplay = new Gameplay({
      user: context.req.user,
      name,
      hosts,
      type,
    });
    const newGameplay = await gameplay.save();
    context.req.gameplay = newGameplay;
  },
};
