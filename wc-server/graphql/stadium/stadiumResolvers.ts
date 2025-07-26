import { z } from "zod";
import { IStadium, stadiumValidator } from "../../models/stadium";
import { Stadium } from "../../models";

export const stadiumQueries = {
  getAllCurrentGameplayStadiums: async (
    parents: undefined,
    args: {
      type: "north_america" | "centenario" | "custom";
      gameplayId?: string;
    }
  ) => {
    const { type, gameplayId } = args;

    const stadiums = await Stadium.find(
      type === "custom" ? { gameplayId } : { type }
    );

    return stadiums;
  },
};

export const stadiumMutations = {
  createCustomStadiums: async (
    parents: undefined,
    args: {
      stadiums: IStadium[];
    }
  ) => {
    const { stadiums } = args;

    const stadiumsValidated = z.array(stadiumValidator).safeParse(stadiums);
    if (!stadiumsValidated.success) {
      console.error(stadiumsValidated.error);
      return;
    }

    await Stadium.insertMany(stadiumsValidated.data);
  },
};
