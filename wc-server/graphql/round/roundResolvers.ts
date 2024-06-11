import { Request, Response } from "express";
import fs from "fs";
import { z } from "zod";

import { TeamStatic } from "../../models";
import Round, { roundValidator } from "../../models/round";
import { BadRequest } from "../../utils/httpError";

export const roundQueries = {};

export const roundMutations = {
  createAllRounds: async (
    parents: undefined,
    args: Record<string, never>,
    context: { req: Request; res: Response }
  ) => {
    if (!context.req.gameplay) {
      throw new BadRequest(
        "No gameplay specified. Each team instance must be attached to a predefined gameplay."
      );
    }

    const rounds = JSON.parse(
      fs.readFileSync("./db/json/rounds.json", {
        encoding: "utf8",
      })
    );

    const teamsStatic = await TeamStatic.aggregate([
      {
        $addFields: {
          hasInitialUEFARanking: {
            $cond: {
              if: { $eq: ["$initialUEFARanking", null] },
              then: 0,
              else: 1,
            },
          },
        },
      },
      {
        $sort: {
          hasInitialUEFARanking: 1,
          initialUEFARanking: 1,
          currentFIFAPoints: -1,
        },
      },
      {
        $group: {
          _id: "$federation",
          teams: {
            $push: {
              code: "$code",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          federation: "$_id",
          teams: 1,
        },
      },
    ]);

    const teamsStaticObj = teamsStatic.reduce((acc, cur) => {
      return {
        ...acc,
        [cur.federation]: cur.teams.filter(
          (team: any) => !["USA", "MEX", "CAN"].includes(team.code)
        ),
      };
    }, {});

    const initialRounds = rounds.map((round: any) => {
      const { code, numberOfTeams, numberOfGroups, initTeamsRange, ...rest } =
        round;

      const [startIndex, endIndex] = initTeamsRange
        ? initTeamsRange
        : [undefined, undefined];

      const { teams, groupStage } = initRounds(
        teamsStaticObj,
        code,
        numberOfTeams,
        startIndex,
        endIndex,
        numberOfGroups
      );

      return {
        code,
        teams,
        numberOfTeams,
        ...(numberOfGroups && { numberOfGroups }),
        matches: [],
        ...rest,
        ...(groupStage && { groupStage }),
        gameplay: context.req.gameplay,
      };
    });

    const roundsValidated = z.array(roundValidator).safeParse(initialRounds);
    if (!roundsValidated.success) {
      console.error(roundsValidated.error);
      throw new BadRequest("Invalidated request body.");
    }
    await Round.insertMany(roundsValidated.data);
  },
};

const initRounds = (
  teamsStaticObj: { [key: string]: [any] },
  code: string,
  numberOfTeams: number,
  startIndex?: number,
  endIndex?: number,
  numberOfGroups?: number
) => {
  const teams =
    code === "FIFA-WC-GS"
      ? [{ team: "USA" }, { team: "MEX" }, { team: "CND" }]
      : endIndex && !code.startsWith("FIFA")
      ? teamsStaticObj[code.split("-")[0]]
          .slice(startIndex, endIndex)
          .map((team) => {
            return {
              team: team.code,
            };
          })
      : [];

  const groupData = (num: number) => {
    if (numberOfGroups) {
      const groupSizeEst = numberOfTeams / numberOfGroups;
      const groupSize = Number.isInteger(groupSizeEst)
        ? groupSizeEst
        : numberOfTeams - Math.floor(groupSizeEst) * numberOfGroups < num + 1
        ? Math.floor(groupSizeEst)
        : Math.ceil(groupSizeEst);
      return [...Array(groupSize).keys()].map((_) => {
        return {};
      });
    }
  };

  const groupStage =
    numberOfGroups && !code.startsWith("UEFA-NL")
      ? [...Array(numberOfGroups).keys()].map((num) => {
          return {
            groupName: code.startsWith("CONMEBOL")
              ? "Stage"
              : String.fromCharCode(num + 65),
            groupData: groupData(num),
          };
        })
      : numberOfGroups && code.startsWith("UEFA-NL")
      ? [...Array(numberOfGroups).keys()].map((num) => {
          return {
            groupName: "" + code.split("-").slice(-1)[0] + (num + 1),
            groupData: groupData(num),
          };
        })
      : undefined;

  return { teams, groupStage };
};
