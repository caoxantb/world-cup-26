import { z } from "zod";
import { IStadium, stadiumValidator } from "../../models/stadium";
import { Stadium } from "../../models";
import {
  allocateStadiumGroups,
  mixClusterStadium,
} from "../../utils/stadiumUtils";

export const stadiumQueries = {
  getAllCurrentGameplayStadiums: async (
    parents: undefined,
    args: {
      type: "north_america" | "centenario" | "custom";
      gameplayId?: String;
    }
  ) => {
    const { type, gameplayId } = args;

    const stadiums = await Stadium.find(
      type === "custom" ? { gameplayId } : { type }
    );

    const clusteredStadiums = mixClusterStadium(stadiums, [
      "URU",
      "ESP",
      "PAR",
      "MAR",
      "ARG",
      "POR",
    ]);

    const allocatedStadiums = allocateStadiumGroups(clusteredStadiums, [
      "URU",
      "ESP",
      "PAR",
      "MAR",
      "ARG",
      "POR",
    ]);

    console.log(allocatedStadiums.map((s) => s?.name).slice(24, 48));

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
