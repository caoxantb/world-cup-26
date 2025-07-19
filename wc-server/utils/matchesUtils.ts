import mongoose from "mongoose";
import { TeamStatic } from "../models";
import { range } from ".";
import { getDatetimeWithTimezone, getWorldCupDates } from "../constants/dates";
import { getStadiums } from "../constants/stadiums";
import { getWorldCupStadiums } from "./stadiumUtils";

type TeamXG = {
  xGoalForParams: number[];
  xGoalAgainstParams: number[];
};

type TeamExtraTime = {
  code: string;
  goals: number;
  extraTimeGoals: number;
  goalMinutes: number[];
  aggs?: number;
};

const MATCHDAYS_ORDER: { [key: number]: number[] } = {
  4: [3, 2, 1, 5, 4, 6],
  6: [5, 4, 3, 2, 1, 6, 10, 8, 9, 7],
  8: [
    7, 6, 5, 4, 3, 2, 1, 12, 10, 9, 14, 11, 8, 13, 18, 16, 19, 15, 20, 17, 21,
  ],
  10: [9, 8, 7, 6, 5, 4, 3, 2, 1, 15, 12, 16, 10, 11, 14, 18, 13, 17],
};

export const calcXGDistribution = (
  team: TeamXG,
  opponent: TeamXG,
  rankDiff: number
) => {
  const factorial = (num: number): number =>
    num === 0 ? 1 : num * factorial(num - 1);

  const teamXGFor = team.xGoalForParams[0] * rankDiff + team.xGoalForParams[1];
  const opponentXGAgainst =
    opponent.xGoalAgainstParams[0] * -rankDiff + opponent.xGoalAgainstParams[1];
  const teamXG = (teamXGFor + opponentXGAgainst) / 2;

  const teamScoreDist = Array.from(Array(20).keys()).map(
    (k) => (teamXG ** k * Math.exp(-teamXG)) / factorial(k)
  );

  return teamScoreDist;
};

export const computeScore = (
  teamScoreDist: number[],
  argsGoals?: number,
  isExtraTime = false
) => {
  if (argsGoals !== undefined) return argsGoals;

  let sum = 0;

  const bracket = teamScoreDist.reduce((acc: number[], cur: number) => {
    sum += cur;
    acc.push(sum);
    return acc;
  }, []);

  const rand = Math.random();
  let score = bracket.findIndex((num) => rand < num);

  if (isExtraTime) {
    score = Math.round(score / 3);
  }

  return score;
};

export const generateGoalMinutes = (
  homeGoals: number,
  awayGoals: number,
  isExtraTime: boolean = false
) => {
  const numSort = (arr: number[]) => {
    return arr.sort((a, b) => a - b);
  };

  const minutes = [
    ...range(1, 45),
    ...range(45.01, 45.05, 0.01),
    ...range(46, 90),
    ...range(90.01, 90.1, 0.01),
  ];

  const extraTimeMinutes = [
    ...range(91, 105),
    ...range(105.01, 105.03, 0.01),
    ...range(106, 120),
    ...range(120.01, 120.05, 0.01),
  ];

  const goalMinutes: Set<number> = new Set();

  while (goalMinutes.size < homeGoals + awayGoals) {
    const minutesArr = isExtraTime ? extraTimeMinutes : minutes;
    let rand = Math.round(Math.random() * (minutesArr.length - 1));
    while (goalMinutes.has(minutesArr[rand])) {
      rand = Math.round(Math.random() * (minutesArr.length - 1));
    }
    goalMinutes.add(minutesArr[rand]);
  }

  const goalMinutesArr = Array.from(goalMinutes);

  return [
    numSort(goalMinutesArr.slice(0, homeGoals)),
    numSort(goalMinutesArr.slice(homeGoals)),
  ];
};

export const extraTime = (
  match: any,
  homeTeam: TeamExtraTime,
  awayTeam: TeamExtraTime,
  penaltiesWinner?: string
) => {
  if (
    (match.leg === 2 &&
      homeTeam.extraTimeGoals === 0 &&
      awayTeam.extraTimeGoals === 0) ||
    (!match.group &&
      !match.leg &&
      homeTeam.extraTimeGoals === awayTeam.extraTimeGoals)
  ) {
    const penaltiesRes = penalties(
      homeTeam.code,
      awayTeam.code,
      penaltiesWinner
    );
    Object.assign(match, {
      homeTeamPenalties: penaltiesRes[homeTeam.code].res,
      awayTeamPenalties: penaltiesRes[awayTeam.code].res,
      homeTeamPenaltiesGoals: penaltiesRes[homeTeam.code].score,
      awayTeamPenaltiesGoals: penaltiesRes[awayTeam.code].score,
      teamTakenFirstPenalty: penaltiesRes.teamTakenFirst.res,
    });
  }

  homeTeam.goals += homeTeam.extraTimeGoals;
  awayTeam.goals += awayTeam.extraTimeGoals;
  if (homeTeam.aggs !== undefined) homeTeam.aggs += homeTeam.extraTimeGoals;
  if (awayTeam.aggs !== undefined) awayTeam.aggs += awayTeam.extraTimeGoals;

  const [homeTeamExtraTimeMinutes, awayTeamExtraTimeMinutes] =
    generateGoalMinutes(homeTeam.extraTimeGoals, awayTeam.extraTimeGoals, true);

  Object.assign(match, {
    homeTeamGoals: homeTeam.goals,
    awayTeamGoals: awayTeam.goals,
    homeTeamExtraTimeGoals: homeTeam.extraTimeGoals,
    awayTeamExtraTimeGoals: awayTeam.extraTimeGoals,
    ...(homeTeam.aggs && { homeTeamAggs: homeTeam.aggs }),
    ...(awayTeam.aggs && { awayTeamAggs: awayTeam.aggs }),
    homeTeamGoalMinutes: homeTeam.goalMinutes.concat(homeTeamExtraTimeMinutes),
    awayTeamGoalMinutes: awayTeam.goalMinutes.concat(awayTeamExtraTimeMinutes),
  });
};

export const penalties = (
  team1: string,
  team2: string,
  chosenWinner?: string
) => {
  if (Math.random() < 0.5) [team1, team2] = [team2, team1];

  const take = (
    teamRes: number[],
    opponentRes: number[],
    teamScore: {
      value: number;
    },
    opponentScore: {
      value: number;
    },
    isFinished: {
      value: boolean;
    }
  ) => {
    let scored = Math.random() > 0.25 ? 1 : 0;
    teamRes.push(scored);
    scored && teamScore.value++;
    isFinished.value =
      opponentRes.length < 5 &&
      (5 - teamRes.length + teamScore.value < opponentScore.value ||
        5 - opponentRes.length + opponentScore.value < teamScore.value);
  };

  const team1Res: number[] = [];
  const team2Res: number[] = [];
  const team1Score = { value: 0 };
  let team2Score = { value: 0 };
  let isFinished = { value: false };

  while (
    !isFinished.value &&
    !(team2Res.length >= 5 && team1Score.value !== team2Score.value)
  ) {
    take(team1Res, team2Res, team1Score, team2Score, isFinished);
    if (!isFinished.value)
      take(team2Res, team1Res, team2Score, team1Score, isFinished);
  }

  const winner = team1Score.value > team2Score.value ? team1 : team2;

  return winner !== chosenWinner
    ? {
        teamTakenFirst: { res: team2 },
        [team2]: { res: team1Res, score: team1Score.value },
        [team1]: { res: team2Res, score: team2Score.value },
      }
    : {
        teamTakenFirst: { res: team1 },
        [team1]: { res: team1Res, score: team1Score.value },
        [team2]: { res: team2Res, score: team2Score.value },
      };
};

export const scheduleMatches = async (
  groups: string[][],
  gameplayId: string,
  round: any,
  dates: Date[],
  gameplayType: "custom" | "north_america" | "centenario",
  hostsOrdered: string[]
) => {
  const groupFlatten = groups.flat();
  const { code, legs, numberOfGroups, numberOfTeams, type } = round;

  const worldCupStadiums = code.startsWith("FIFA")
    ? await getWorldCupStadiums(gameplayId, code, gameplayType, hostsOrdered)
    : undefined;

  const finalVenueCoord = worldCupStadiums
    ? worldCupStadiums.find((s) => s?.group === 1)?.coordinations || []
    : [];

  const stadiums =
    legs !== 1
      ? await TeamStatic.find({ code: { $in: groupFlatten } }).select(
          "code homeStadium"
        )
      : [];

  const matchdaySpan = numberOfGroups
    ? Math.ceil(numberOfTeams / numberOfGroups)
    : 1;

  let nonResetMatchIdx = 0;

  const schedules = groups.flatMap((teams, idx) => {
    // create roundrobin schedule for n teams (n >= 2)
    const initialTeamSize = teams.length;
    if (teams.length % 2) teams.push("BYE");

    const matchdaysCount = (teams.length - 1) * legs;
    const matchesPerMatchday = teams.length / 2;

    return Array.from({ length: matchdaysCount }, (_, matchday) => {
      // set dates for the matches
      let date: Date,
        matchdaySwap: number = 0;

      if (!code.startsWith("FIFA")) {
        const dateOffset = Math.round(idx / (groups.length / matchdaySpan));
        matchdaySwap =
          MATCHDAYS_ORDER[teams.length]?.[matchday] ?? matchday + 1;
        date = dates[matchdaySwap - 1];
        date.setDate(date.getDate() + dateOffset);
      }

      const leg = teams.length === 2 && legs === 2 ? matchday + 1 : undefined;

      const matchdayDisplay = !matchdaySwap
        ? undefined
        : initialTeamSize === 4 && code === "UEFA-GS"
        ? matchdaySwap + (matchdaySwap > 2 ? 4 : 2)
        : teams.length > 2
        ? matchdaySwap
        : undefined;

      const group =
        numberOfGroups === 1
          ? "GS"
          : numberOfGroups > 1 && code.startsWith("UEFA-NL")
          ? code.split("-").slice(-1)[0] + (idx + 1)
          : numberOfGroups > 1
          ? String.fromCharCode("A".charCodeAt(0) + idx)
          : undefined;

      let tempMatchIdx = 0;

      const matches = Array.from({ length: matchesPerMatchday }, (_, match) => {
        let [homeTeam, awayTeam] = [
          teams[match],
          teams[teams.length - 1 - match],
        ];

        if (
          matchday >= matchdaysCount / legs &&
          !(!(matchday % 2) && homeTeam === teams[0])
        ) {
          [homeTeam, awayTeam] = [awayTeam, homeTeam];
        }

        if (
          matchday < matchdaysCount / legs &&
          matchday % 2 &&
          homeTeam === teams[0]
        ) {
          [homeTeam, awayTeam] = [awayTeam, homeTeam];
        }

        if (homeTeam === "BYE" || awayTeam === "BYE") return null;

        const matchIdx =
          teams.length === 2
            ? idx + 1
            : matchesPerMatchday * (matchdaySwap - 1) +
              tempMatchIdx +
              1 -
              (initialTeamSize % 2 ? matchdaySwap - 1 : 0);

        tempMatchIdx += 1;
        nonResetMatchIdx += 1;

        const worldCupGSMatchIndex =
          swapWorldCupGroupStageMatchNo(nonResetMatchIdx);

        const worldCupStadium = worldCupStadiums
          ? worldCupStadiums[worldCupGSMatchIndex - 1]
          : undefined;

        const stadium = worldCupStadium
          ? `${worldCupStadium.name}, ${worldCupStadium.city}`
          : stadiums.length
          ? stadiums.find((s) => s.code === homeTeam)?.homeStadium
          : getStadiums(code, nonResetMatchIdx);

        if (code.startsWith("FIFA")) {
          const wcDate = getWorldCupDates(code);
          const wcDateWithTimezone = getDatetimeWithTimezone(
            wcDate[worldCupGSMatchIndex - 1],
            finalVenueCoord
          );
          date = new Date(wcDateWithTimezone);
        }

        const matchCode =
          code === "FIFA-WC-GS"
            ? `${code}-M${worldCupGSMatchIndex}`
            : type === "knockout"
            ? `${code}-M${matchIdx}${leg ? `-L${leg}` : ""}`
            : `${code}-${group}-MD${matchdayDisplay}-M${matchIdx}`;

        return {
          code: matchCode,
          homeTeam,
          awayTeam,
          round: code,
          date,
          stadium,
          ...(matchdayDisplay && { matchday: matchdayDisplay }),
          ...(leg && { leg }),
          ...(group && { group }),
          gameplay: mongoose.Types.ObjectId.createFromHexString(gameplayId),
        };
      }).filter(Boolean);

      teams.splice(1, 0, teams.pop()!);
      return matches;
    }).flat();
  });

  return schedules;
};

const swapWorldCupGroupStageMatchNo = (matchNo: number) => {
  const swapIdxs = [
    49, 50, 27, 25, 1, 2, 51, 52, 28, 26, 3, 5, 53, 54, 31, 29, 4, 6, 55, 56,
    32, 30, 7, 9, 57, 58, 35, 33, 8, 10, 59, 60, 36, 34, 11, 12, 61, 62, 39, 37,
    13, 14, 63, 64, 40, 38, 15, 16, 65, 66, 43, 41, 17, 18, 67, 68, 44, 42, 19,
    20, 69, 70, 47, 45, 21, 22, 71, 72, 48, 46, 23, 24,
  ];

  return swapIdxs[matchNo - 1];
};
