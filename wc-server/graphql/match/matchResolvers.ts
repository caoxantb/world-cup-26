import fs from "fs";

import { Match, MatchStatic, Ranking, Team, TeamStatic } from "../../models";
import { BadRequest } from "../../utils/httpError";
import { z } from "zod";
import { matchValidator } from "../../models/match";
import mongoose from "mongoose";
import {
  calcXGDistribution,
  computeScore,
  generateGoalMinutes,
  extraTime,
} from "../../utils/matchesUtils";
import { populateTeamData, updateTeamData, updateFIFAPoints } from "../../utils/teamUtils";

export const matchQueries = {
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
    args: { groups: string[][]; gameplay: string; roundCode: string }
  ) => {
    const { groups, roundCode, gameplay } = args;

    const rounds = JSON.parse(
      fs.readFileSync("./db/json/rounds.json", {
        encoding: "utf8",
      })
    );
    const round = rounds.find((r: any) => r.code === roundCode);

    const groupFlatten = groups.flat();
    const stadiums = !round.stadiums
      ? await TeamStatic.find({ code: { $in: groupFlatten } }).select(
          "code homeStadium"
        )
      : [];

    const matchdaysOrder: { [key: number]: number[] } = {
      3: [2, 1, 4, 3],
      4: [3, 2, 1, 5, 4, 6],
      5: [5, 4, 3, 2, 1, 9, 8, 6, 7, 10],
      6: [6, 5, 4, 3, 2, 1, 11, 10, 8, 7, 9, 12],
    };

    const schedules = groups.flatMap((teams, idx) => {
      const initialTeamSize = teams.length;
      if (teams.length % 2) teams.push("BYE");

      const matchdaysCount = round.isTwoLegs
        ? (teams.length - 1) * 2
        : teams.length - 1;
      const matchesPerMatchday = teams.length / 2;

      return Array.from({ length: matchdaysCount }, (_, matchday) => {
        const matches = Array.from(
          { length: matchesPerMatchday },
          (_, match) => {
            let [homeTeam, awayTeam] = [
              teams[match],
              teams[teams.length - 1 - match],
            ];

            if (
              matchday >= matchdaysCount / 2 &&
              !(!(matchday % 2) && homeTeam === teams[0])
            ) {
              [homeTeam, awayTeam] = [awayTeam, homeTeam];
            }

            if (
              matchday < matchdaysCount / 2 &&
              matchday % 2 &&
              homeTeam === teams[0]
            ) {
              [homeTeam, awayTeam] = [awayTeam, homeTeam];
            }

            if (homeTeam === "BYE" || awayTeam === "BYE") return null;

            const dateOffset = round.matchdaySpan
              ? Math.round(idx / (groups.length / round.matchdaySpan))
              : 0;
            const matchdaySwap =
              matchdaysOrder[initialTeamSize]?.[matchday] ?? matchday + 1;
            const date = new Date(
              Array.isArray(round.dates[0])
                ? round.dates[matchdaySwap - 1][match]
                : round.dates[matchdaySwap - 1]
            );
            date.setDate(date.getDate() + dateOffset);

            const leg =
              teams.length === 2 && round.isTwoLegs ? matchday + 1 : undefined;
            const matchdayDisplay =
              initialTeamSize === 4 && round.code === "UEFA-GS"
                ? matchdaySwap + 4
                : teams.length > 2
                ? matchdaySwap
                : undefined;
            const matchIdx =
              teams.length === 2
                ? idx + 1
                : matchesPerMatchday * (matchdaySwap - 1) + match + 1;
            const group =
              round.numberOfGroups === 1
                ? "GS"
                : round.numberOfGroups > 1
                ? String.fromCharCode("A".charCodeAt(0) + idx)
                : undefined;
            const matchCode =
              round.type === "knockout"
                ? `${round.code}-M${matchIdx}-${leg ? `L${leg}` : ""}`
                : `${round.code}-${group}${matchIdx}-MD${matchdayDisplay}`;

            return {
              code: matchCode,
              homeTeam,
              awayTeam,
              round: round.code,
              date,
              stadium: round.stadiums
                ? round.stadiums[idx][matchIdx - 1]
                : stadiums.find((s: { code: string }) => s.code === homeTeam)
                    ?.homeStadium,
              isNeutralVenue: !!round.stadiums,
              ...(matchdayDisplay && { matchday: matchdayDisplay }),
              ...(leg && { leg }),
              ...(group && { group }),
              gameplay: new mongoose.Types.ObjectId(gameplay),
            };
          }
        ).filter(Boolean);

        teams.splice(1, 0, teams.pop()!);
        return matches;
      }).flat();
    });

    const matchesValidated = z.array(matchValidator).safeParse(schedules);
    if (!matchesValidated.success) {
      console.error(matchesValidated.error);
      throw new BadRequest("Match(es) invalidated");
    }

    await Match.insertMany(matchesValidated.data);
  },
  playMatches: async (parents: undefined, args: any) => {
    const match = await Match.findById(args.matchId);

    if (!match) {
      throw new BadRequest("Match not found");
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
      if (!match.homeTeamAggs || !match.awayTeamAggs)
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
  },
};