import fs from "fs";
import readline from "readline";

type XGoalData = {
  numberOfDataPoints: number;
  sumRankDiff: number;
  sumGoalsScored: number;
  sumGoalsConceded: number;
  sumRankDiffSquare: number;
  sumDotScored: number;
  sumDotConceded: number;
};

const sumObjectFields = (obj1: XGoalData, obj2: XGoalData) => {
  return Object.keys(obj2).reduce((acc: XGoalData, cur: string) => {
    const key = cur as keyof XGoalData;
    acc[key] = obj1 ? obj1[key] + obj2[key] : obj2[key];
    return acc;
  }, {} as XGoalData);
};

export const readXGoalData: () => Promise<{
  [key: string]: XGoalData;
}> = () => {
  return new Promise((resolve, reject) => {
    const xGoalData: {
      [key: string]: XGoalData;
    } = {};

    const rl = readline.createInterface({
      input: fs.createReadStream("./db/cleaned/filtered-matches.csv", {
        encoding: "utf-8",
      }),
      output: process.stdout,
      terminal: false,
    });

    let header = true;

    rl.on("line", (line) => {
      const [
        _date,
        homeTeam,
        awayTeam,
        homeGoals,
        awayGoals,
        _tournament,
        _city,
        _country,
        _neutral,
        homeTeamRank,
        awayTeamRank,
      ] = line.split(",");
      if (header) {
        header = false;
        return;
      }

      const rankDiffHomeTeam = parseInt(homeTeamRank) - parseInt(awayTeamRank);
      const rankDiffAwayTeam = parseInt(awayTeamRank) - parseInt(homeTeamRank);

      const homeTeamData = {
        numberOfDataPoints: 1,
        sumRankDiff: rankDiffHomeTeam,
        sumGoalsScored: parseInt(homeGoals),
        sumGoalsConceded: parseInt(awayGoals),
        sumRankDiffSquare: rankDiffHomeTeam ** 2,
        sumDotScored: rankDiffHomeTeam * parseInt(homeGoals),
        sumDotConceded: rankDiffHomeTeam * parseInt(awayGoals),
      };

      const awayTeamData = {
        numberOfDataPoints: 1,
        sumRankDiff: rankDiffAwayTeam,
        sumGoalsScored: parseInt(awayGoals),
        sumGoalsConceded: parseInt(homeGoals),
        sumRankDiffSquare: rankDiffAwayTeam ** 2,
        sumDotScored: rankDiffAwayTeam * parseInt(awayGoals),
        sumDotConceded: rankDiffAwayTeam * parseInt(homeGoals),
      };

      xGoalData[homeTeam] = sumObjectFields(xGoalData[homeTeam], homeTeamData);
      xGoalData[awayTeam] = sumObjectFields(xGoalData[awayTeam], awayTeamData);
    });

    rl.on("close", () => {
      resolve(xGoalData);
    });

    rl.on("error", (error) => {
      reject(error);
    });
  });
};