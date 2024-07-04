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
  const range = (start: number, end: number, step: number = 1) => {
    return Array.from(
      Array(Math.ceil((end - start) / step) + 1).keys(),
      (_, i) => Math.round((i * step + start) * 100) / 100
    );
  };

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
