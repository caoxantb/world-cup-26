import { Request, Response } from "express";
import _, { Dictionary } from "lodash";
import { z } from "zod";

import { Gameplay, Match, TeamStatic } from "../../models";
import Round, { roundValidator } from "../../models/round";
import { BadRequest } from "../../utils/httpError";
import {
  checkTeamMinMaxPosition,
  checkTeamMinMaxPositionTwoRoundsRemain,
  parseAdvancedStatus,
  applyMatchesResult,
  sortGroupData,
  parseAdvancedStatusEdgedPosition,
  initRounds,
  getStaticRounds,
} from "../../utils/roundsUtils";

type GroupStageObject = {
  groupName: string;
  groupData: any;
  groupDataObj?: { [key: string]: any };
};

export const roundQueries = {};

export const roundMutations = {
  createAllRounds: async (
    parents: undefined,
    args: Record<string, never>,
    context: { req: Request; res: Response }
  ) => {
    const {
      req: { gameplay },
    } = context;

    if (!gameplay) {
      throw new BadRequest(
        "No gameplay specified. Each team instance must be attached to a predefined gameplay."
      );
    }

    const { hosts, _id: gameplayId } = gameplay;

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
          initialFIFAPoints: -1,
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

    const initialRounds = await initRounds(gameplayId, hosts, teamsStatic);

    const roundsValidated = z.array(roundValidator).safeParse(initialRounds);
    if (!roundsValidated.success) {
      console.error(roundsValidated.error);
      throw new BadRequest("Invalidated request body.");
    }

    await Round.insertMany(roundsValidated.data);
  },
  updateGroupTables: async (
    parents: undefined,
    args: {
      code: string;
      gameplay: string;
      matches: string[];
      groups?: string[];
    }
  ) => {
    const { code, gameplay, groups } = args;

    const round = await Round.findOne({ code, gameplay });

    if (!round || !round.groupStage) {
      throw new BadRequest("Round is either undefined or not roundrobin.");
    }

    const groupStageObj: Dictionary<GroupStageObject> = _.keyBy(
      round.groupStage,
      "groupName"
    );

    const groupNames = groups || Object.keys(groupStageObj);

    groupNames.forEach((key) => {
      Object.assign(groupStageObj[key], {
        groupDataObj: _.keyBy(groupStageObj[key].groupData, "team"),
      });
    });

    const matches = await Match.find({ _id: { $in: args.matches } });

    applyMatchesResult(matches, groupStageObj);

    const newGroupStage = await Promise.all(
      Object.keys(groupStageObj).map(async (groupName) => {
        const groupDataObj = groupStageObj[groupName].groupDataObj;

        const groupData = groupDataObj
          ? await sortGroupData(groupDataObj, code, gameplay)
          : groupStageObj[groupName].groupData;

        return { groupName, groupData };
      })
    );

    round.groupStage = newGroupStage;

    await round.save();
  },
  updateKnockoutAdvancedStatus: async (
    parents: undefined,
    args: { code: string; gameplayId: string; matches: string[] }
  ) => {
    const { code, gameplayId } = args;

    const gameplay = await Gameplay.findById(gameplayId);

    if (!gameplay) {
      throw new BadRequest(
        "No gameplay specified. Each team instance must be attached to a predefined gameplay."
      );
    }

    const { hosts } = gameplay;

    const roundStatic = (await getStaticRounds(hosts, code))[0];

    const matches = await Match.find({ _id: { $in: args.matches } });

    const teamStatus: any = matches.reduce((acc, match) => {
      if (
        !match ||
        match.homeTeamGoals === undefined ||
        match.awayTeamGoals === undefined
      )
        return acc;

      let winner = "";

      if (
        match.homeTeamPenaltiesGoals !== undefined &&
        match.awayTeamPenaltiesGoals !== undefined
      ) {
        winner =
          match.homeTeamPenaltiesGoals > match.awayTeamPenaltiesGoals
            ? match.homeTeam
            : match.awayTeam;
      } else if (roundStatic.legs !== 2) {
        winner =
          match.homeTeamGoals > match.awayTeamGoals
            ? match.homeTeam
            : match.awayTeam;
      } else {
        if (
          match.homeTeamAggs !== undefined &&
          match.awayTeamAggs !== undefined
        ) {
          winner =
            match.homeTeamAggs > match.awayTeamAggs
              ? match.homeTeam
              : match.awayTeamAggs > match.homeTeamAggs
              ? match.awayTeam
              : match.homeTeamAggs - match.homeTeamGoals > match.awayTeamGoals
              ? match.homeTeam
              : match.awayTeam;
        }
      }

      const loser = winner === match.homeTeam ? match.awayTeam : match.homeTeam;

      return {
        ...acc,
        [winner]: {
          currentRound: {
            status: [
              "UEFA-NL-3P",
              "UEFA-NL-F",
              "FIFA-WC-3P",
              "FIFA-WC-F",
            ].includes(code)
              ? "finished"
              : "advanced",
            ...(!roundStatic.advancedTo
              ? {}
              : { advancedTo: roundStatic.advancedTo.W }),
          },
          nextRound: {
            team: winner,
            qualifiedAs: `${
              roundStatic.legs !== 2 ? match.code : match.code?.slice(0, -3)
            }-W`,
            qualifiedDate: match.date,
          },
        },
        [loser]: {
          team: loser,
          currentRound: {
            status:
              args.code.startsWith("UEFA-NL") ||
              ["FIFA-WC-3P", "FIFA-WC-F"].includes(code)
                ? "finished"
                : "eliminated",
            ...(["UEFA-NL-SF", "UEFA-WC-SF"].includes(code)
              ? { advancedTo: roundStatic.advancedTo?.L, status: "advanced" }
              : {}),
          },
          nextRound: {
            team: loser,
            qualifiedAs: `${
              roundStatic.legs !== 2 ? match.code : match.code?.slice(0, -3)
            }-L`,
            qualifiedDate: match.date,
          },
        },
      };
    }, {});

    const rounds = await Round.find({
      code: {
        $in: [code, ...Object.values(roundStatic.advancedTo || {})],
      },
      gameplay: gameplayId,
    });

    const groupedRounds = _.keyBy(rounds, "code");

    if (!groupedRounds[code]) {
      throw new BadRequest("Round not found");
    }

    const newTeamsStatus = groupedRounds[code].teams.map((team) => {
      if (Object.prototype.hasOwnProperty.call(teamStatus, team.team)) {
        const nextRound = teamStatus[team.team].currentRound.advancedTo;

        if (nextRound) {
          groupedRounds[nextRound].teams = [
            ...groupedRounds[nextRound].teams,
            teamStatus[team.team].nextRound,
          ];
        }

        return { ...team, ...teamStatus[team.team].currentRound };
      }
      return team;
    });

    groupedRounds[code].teams = newTeamsStatus;

    await Promise.all(rounds.map((round) => groupedRounds[round.code].save()));
  },
  updateGroupStageAdvancedStatus: async (
    parents: undefined,
    args: {
      code: string;
      gameplayId: string;
      matchDate: Date;
      groups?: string[];
    }
  ) => {
    const { code, gameplayId, groups, matchDate } = args;

    const gameplay = await Gameplay.findById(gameplayId);
    if (!gameplay) {
      throw new BadRequest(
        "No gameplay specified. Each team instance must be attached to a predefined gameplay."
      );
    }
    const { hosts } = gameplay;

    // get static information of rounds
    const roundStatic = (await getStaticRounds(hosts, code))[0];
    const { advancedTo, legs } = roundStatic;

    // get real gameplay-based round information
    const params: Set<string> = Object.values(advancedTo || {})
      .flatMap((round: unknown) =>
        typeof round === "string"
          ? [round]
          : Object.values(round as Record<string, string>)
      )
      .reduce((acc: Set<string>, cur: string) => {
        acc.add(cur);
        return acc;
      }, new Set<string>());

    const rounds = await Round.find({
      code: {
        $in: [code, Array.from(params)],
      },
      gameplay: gameplayId,
    });

    // get group stage information
    const groupedRounds = _.keyBy(rounds, "code");
    const groupStageObj: Dictionary<GroupStageObject> = _.keyBy(
      groupedRounds[args.code].groupStage,
      "groupName"
    );
    const groupNames = groups || Object.keys(groupStageObj);

    // const get information regarding matches played
    const matchesPlayed = groupStageObj[groupNames[0]].groupData.map(
      (team: any) => team.matchesPlayed
    );
    const totalMatchdays = (matchesPlayed.length - 1) * legs;
    const matchdaysLeft = totalMatchdays - Math.max(matchesPlayed);
    const remainingMatches =
      matchdaysLeft <= 2
        ? await Match.find({
            gameplay: gameplayId,
            group: { $in: groupNames },
            $and: [
              { homeTeamGoals: { $exists: false } },
              { awayTeamGoals: { $exists: false } },
            ],
          })
        : [];

    // parse advanced status based on both normal and end-of-stage cases
    let advancedStatus: { [key: string]: any } = {};

    groupNames.forEach((key) => {
      Object.assign(groupStageObj[key], {
        groupDataObj: _.keyBy(groupStageObj[key].groupData, "team"),
      });

      const groupDataObj = groupStageObj[key].groupDataObj || {};

      const teamMinMaxPosition = !remainingMatches.length
        ? checkTeamMinMaxPosition(groupDataObj, legs)
        : checkTeamMinMaxPositionTwoRoundsRemain(
            remainingMatches,
            groupDataObj
          );

      advancedStatus = {
        ...advancedStatus,
        ...parseAdvancedStatus(
          advancedTo,
          teamMinMaxPosition,
          code,
          key,
          matchDate
        ),
      };
    });

    // parse advanced status in case of edge position -- only on last matchday
    const edgePosition = Object.keys(advancedTo || {}).find(
      (pos) => typeof advancedTo?.[pos] !== "string"
    );

    if (edgePosition && matchdaysLeft === 0) {
      const edgeSlots = advancedTo?.[edgePosition];

      if (typeof edgeSlots === "string" || !edgeSlots)
        throw new BadRequest("advanced edge slots wrong");

      const edgeStatus = await parseAdvancedStatusEdgedPosition(
        code,
        +edgePosition,
        edgeSlots,
        groupedRounds[code].groupStage || [],
        matchDate,
        totalMatchdays
      );

      advancedStatus = { ...advancedStatus, ...edgeStatus };
    }

    // parse data to current and advanced rounds
    const newTeamsStatus = groupedRounds[code].teams.map((team) => {
      if (Object.prototype.hasOwnProperty.call(advancedStatus, team.team)) {
        // check if a team has already advanced to a next round
        const nextRound = advancedStatus[team.team].currentRound.advancedTo;

        if (nextRound) {
          const matchIdx = groupedRounds[nextRound].teams.findIndex(
            (t) => t.team === team.team
          );
          if (matchIdx === -1) {
            // add the qualified status of a team to the respective next round
            groupedRounds[nextRound].teams = [
              ...groupedRounds[nextRound].teams,
              advancedStatus[team.team].nextRound,
            ];
          } else {
            // just update the qualifiedAs if a team has already qualified, ignoring the date
            groupedRounds[nextRound].teams[matchIdx].qualifiedAs =
              advancedStatus[team.team].nextRound.qualifiedAs;
          }
        }

        return { ...team, ...advancedStatus[team.team].currentRound };
      }
      return team;
    });

    groupedRounds[code].teams = newTeamsStatus;

    await Promise.all(rounds.map((round) => groupedRounds[round.code].save()));
  },
};
