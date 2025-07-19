import fs from "fs";

import {
  Gameplay,
  Match,
  MatchStatic,
  Ranking,
  Team,
  TeamStatic,
} from "../../models";
import { BadRequest } from "../../utils/httpError";
import { z } from "zod";
import { matchValidator } from "../../models/match";
import {
  calcXGDistribution,
  computeScore,
  generateGoalMinutes,
  extraTime,
  scheduleMatches,
} from "../../utils/matchesUtils";
import {
  populateTeamData,
  updateTeamData,
  updateFIFAPoints,
  getHosts,
} from "../../utils/teamsUtils";
import { getStaticRounds } from "../../utils/roundsUtils";
import { getDates } from "../../constants/dates";

export const matchQueries = {
  matchesByRound: async (
    parents: undefined,
    args: {
      roundCode: string;
      gameplay: string;
      matchday?: number;
      groups?: string[];
    }
  ) => {
    const { roundCode, gameplay, matchday, groups } = args;

    const matches = await Match.find({
      round: roundCode,
      gameplay,
      $or: [
        { leg: matchday },
        { matchday },
        {
          $and: [{ leg: { $exists: false } }, { matchday: { $exists: false } }],
        },
      ],
      ...(groups?.length && { group: { $in: groups } }),
    }).lean();

    return matches;
  },
  pastMatches: async (
    parents: undefined,
    args: { team1: string; team2: string; gameplay: string; limit?: number }
  ) => {
    const { team1, team2, gameplay, limit } = args;

    const pipeline = (limit: number | undefined): any => [
      {
        $match: {
          $and: [
            {
              $or: [
                { homeTeam: team1, awayTeam: team2 },
                { awayTeam: team1, homeTeam: team2 },
              ],
            },
            {
              $or: [{ gameplay }, { gameplay: { $exists: false } }],
            },
          ],
        },
      },
      {
        $addFields: {
          winner: {
            $cond: {
              if: { $gt: ["$homeTeamGoals", "$awayTeamGoals"] },
              then: "$homeTeam",
              else: {
                $cond: {
                  if: { $gt: ["$awayTeamGoals", "$homeTeamGoals"] },
                  then: "$awayTeam",
                  else: "Draw",
                },
              },
            },
          },
        },
      },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: `${team1}vs${team2}`,
                totalMatches: { $sum: 1 },
                team1Wins: {
                  $sum: { $cond: [{ $eq: ["$winner", team1] }, 1, 0] },
                },
                team2Wins: {
                  $sum: { $cond: [{ $eq: ["$winner", team2] }, 1, 0] },
                },
                draws: {
                  $sum: { $cond: [{ $eq: ["$winner", "Draw"] }, 1, 0] },
                },
                team1Goals: {
                  $sum: {
                    $cond: [
                      { $eq: ["$homeTeam", team1] },
                      "$homeTeamGoals",
                      "$awayTeamGoals",
                    ],
                  },
                },
                team2Goals: {
                  $sum: {
                    $cond: [
                      { $eq: ["$homeTeam", team2] },
                      "$homeTeamGoals",
                      "$awayTeamGoals",
                    ],
                  },
                },
              },
            },
          ],
          recentMatches: [
            { $sort: { date: -1 } },
            ...(limit ? [{ $limit: limit }] : []),
          ],
        },
      },
    ];

    const matchesStats = await Match.aggregate(pipeline(limit));
    const { overview: matchesOverview, recentMatches } = matchesStats[0];

    const matchesStaticStats = await MatchStatic.aggregate(
      !limit
        ? pipeline(limit)
        : limit > recentMatches.length
        ? pipeline(limit - recentMatches.length)
        : 0
    );

    const {
      overview: staticMatchesOverview,
      recentMatches: recentStaticMatches,
    } = matchesStaticStats[0];

    const overview = Object.keys(staticMatchesOverview[0]).reduce(
      (acc: any, cur) => {
        const key = cur;
        acc[key] = matchesOverview[0]
          ? matchesOverview[0][key] + staticMatchesOverview[0][key]
          : staticMatchesOverview[0][key];
        return acc;
      },
      {}
    );

    return {
      overview,
      matches: [...recentMatches, ...recentStaticMatches],
    };
  },
};

export const matchesMutation = {
  createMatches: async (
    parents: undefined,
    args: { groups: string[][]; gameplayId: string; roundCode: string }
  ) => {
    const { groups, roundCode, gameplayId } = args;

    const gameplay = await Gameplay.findById(gameplayId);

    if (!gameplay) {
      throw new BadRequest(
        "No gameplay specified. Each team instance must be attached to a predefined gameplay."
      );
    }

    const { hosts, type: gameplayType } = gameplay;

    const rounds = await getStaticRounds(hosts, roundCode);
    const fedsLength = hosts.filter(
      (host) => host.federation === rounds[0].federation
    ).length;

    const dates = !roundCode.startsWith("FIFA")
      ? getDates(roundCode, fedsLength)
      : [];

    const hostsOrdered = hosts
      .sort((h1, h2) => h1.order - h2.order)
      .map((host) => host.name);

    const schedules = await scheduleMatches(
      groups,
      gameplayId,
      rounds[0],
      dates,
      gameplayType,
      hostsOrdered
    );

    const matchesValidated = z.array(matchValidator).safeParse(schedules);
    if (!matchesValidated.success) {
      console.error(matchesValidated.error);
      throw new BadRequest("Match(es) invalidated");
    }

    matchesValidated.data
      .sort((m1, m2) => m1.date.getTime() - m2.date.getTime())
      .forEach((m) =>
        console.log(
          `${m.code?.split("-").slice(-1)[0]} - ${m.homeTeam} vs. ${
            m.awayTeam
          } - ${m.stadium}`
        )
      );

    await Match.insertMany(matchesValidated.data);
  },
  playMatches: async (parents: undefined, args: any) => {
    const match = await Match.findById(args.matchId);

    if (!match) {
      throw new BadRequest("Match not found");
    }

    if (
      match.homeTeamGoals !== undefined ||
      match.awayTeamGoals !== undefined
    ) {
      throw new BadRequest("Match already played");
    }

    const [homeTeamData, awayTeamData] = await Promise.all([
      populateTeamData(match.homeTeam, args.gameplay),
      populateTeamData(match.awayTeam, args.gameplay),
    ]);

    const { team: homeTeam, ranking: homeTeamRanking } = homeTeamData;
    const { team: awayTeam, ranking: awayTeamRanking } = awayTeamData;

    const rankDiff = homeTeamRanking - awayTeamRanking;

    const [homeTeamDist, awayTeamDist] = [
      calcXGDistribution(homeTeam, awayTeam, rankDiff),
      calcXGDistribution(awayTeam, homeTeam, -rankDiff),
    ];

    let homeTeamGoals = computeScore(homeTeamDist, args.homeTeamGoals);
    let awayTeamGoals = computeScore(homeTeamDist, args.awayTeamGoals);
    const [homeTeamGoalMinutes, awayTeamGoalMinutes] = generateGoalMinutes(
      homeTeamGoals,
      awayTeamGoals
    );

    Object.assign(match, {
      homeTeamGoals,
      awayTeamGoals,
      homeTeamGoalMinutes,
      awayTeamGoalMinutes,
    });

    if (match.leg === 1) {
      const legTwoMatch = await Match.findOne({
        code: match.code?.slice(0, -1) + "2",
        gameplay: args.gameplay,
      });

      if (legTwoMatch) {
        Object.assign(legTwoMatch, {
          homeTeamAggs: awayTeamGoals,
          awayTeamAggs: homeTeamGoals,
        });
        await legTwoMatch.save();
      }
    } else if (match.leg === 2) {
      if (match.homeTeamAggs === undefined || match.awayTeamAggs === undefined)
        throw new BadRequest("Invalid aggregates");
      let homeTeamAggs = match.homeTeamAggs + homeTeamGoals;
      let awayTeamAggs = match.awayTeamAggs + awayTeamGoals;

      if (
        homeTeamAggs === awayTeamAggs &&
        homeTeamAggs - homeTeamGoals === awayTeamGoals
      ) {
        const [homeTeamExtraTimeGoals, awayTeamExtraTimeGoals] = [
          computeScore(homeTeamDist, args.homeTeamExtraTimeGoals, true),
          computeScore(awayTeamDist, args.awayTeamExtraTimeGoals, true),
        ];

        extraTime(
          match,
          {
            code: homeTeam.code,
            goals: homeTeamGoals,
            extraTimeGoals: homeTeamExtraTimeGoals,
            goalMinutes: homeTeamGoalMinutes,
            aggs: homeTeamAggs,
          },
          {
            code: awayTeam.code,
            goals: awayTeamGoals,
            extraTimeGoals: awayTeamExtraTimeGoals,
            goalMinutes: awayTeamGoalMinutes,
            aggs: awayTeamAggs,
          }
        );
      } else {
        Object.assign(match, {
          homeTeamAggs,
          awayTeamAggs,
        });
      }
    } else if (!match.group && !match.leg && homeTeamGoals === awayTeamGoals) {
      const [homeTeamExtraTimeGoals, awayTeamExtraTimeGoals] = [
        computeScore(homeTeamDist, args.homeTeamExtraTimeGoals, true),
        computeScore(awayTeamDist, args.awayTeamExtraTimeGoals, true),
      ];

      extraTime(
        match,
        {
          code: homeTeam.code,
          goals: homeTeamGoals,
          extraTimeGoals: homeTeamExtraTimeGoals,
          goalMinutes: homeTeamGoalMinutes,
        },
        {
          code: awayTeam.code,
          goals: awayTeamGoals,
          extraTimeGoals: awayTeamExtraTimeGoals,
          goalMinutes: awayTeamGoalMinutes,
        }
      );
    }

    const homeRes =
      homeTeamGoals > awayTeamGoals
        ? 1
        : homeTeamGoals < awayTeamGoals
        ? 0
        : match.homeTeamPenaltiesGoals !== undefined &&
          match.awayTeamPenaltiesGoals !== undefined &&
          match.homeTeamPenaltiesGoals > match.awayTeamPenaltiesGoals
        ? 0.75
        : 0.5;

    const awayRes =
      homeRes === 0.75
        ? 0.5
        : match.awayTeamPenaltiesGoals !== undefined
        ? 0.75
        : 1 - homeRes;

    updateTeamData(homeTeam, homeTeamGoals, awayTeamGoals, rankDiff);
    updateTeamData(awayTeam, awayTeamGoals, homeTeamGoals, -rankDiff);
    updateFIFAPoints(homeTeam, awayTeam, match.round, homeRes);
    updateFIFAPoints(awayTeam, homeTeam, match.round, awayRes);

    await match.save();
    await homeTeam.save();
    await awayTeam.save();

    return match;
  },
};
