import fs from "fs";
import readline from "readline";

export const readXGoalData: () => Promise<{
  [key: string]: {
    thenFIFARanking: number;
    thenOpponentFIFARanking: number;
    goalsScored: number;
    goalsConceded: number;
  }[];
}> = () => {
  return new Promise((resolve, reject) => {
    const xGoalStats: {
      [key: string]: {
        thenFIFARanking: number;
        thenOpponentFIFARanking: number;
        goalsScored: number;
        goalsConceded: number;
      }[];
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
      const [date, homeTeam, awayTeam, homeGoals, awayGoals, ...rest] =
        line.split(",");
      if (header) {
        header = false;
        return;
      }

      const homeTeamData = {
        thenFIFARanking: parseInt(rest[rest.length - 2]),
        thenOpponentFIFARanking: parseInt(rest[rest.length - 1]),
        goalsScored: parseInt(homeGoals),
        goalsConceded: parseInt(awayGoals),
      };

      const awayTeamData = {
        thenFIFARanking: parseInt(rest[rest.length - 1]),
        thenOpponentFIFARanking: parseInt(rest[rest.length - 2]),
        goalsScored: parseInt(awayGoals),
        goalsConceded: parseInt(homeGoals),
      };

      xGoalStats.hasOwnProperty(homeTeam)
        ? xGoalStats[homeTeam].push(homeTeamData)
        : (xGoalStats[homeTeam] = [homeTeamData]);

      xGoalStats.hasOwnProperty(awayTeam)
        ? xGoalStats[awayTeam].push(awayTeamData)
        : (xGoalStats[awayTeam] = [awayTeamData]);
    });

    rl.on("close", () => {
      resolve(xGoalStats);
    });

    rl.on("error", (error) => {
      reject(error);
    });
  });
};
