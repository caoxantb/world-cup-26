import fs from "fs";
import readline from "readline";

export const readFIFARankingsData: () => Promise<{
  fifaRankings: {
    team: string;
    date: Date;
    position: number;
    points: number;
  }[];
  currentPoints: { [key: string]: number };
  countryCodes: { [key: string]: string };
  federations: { [key: string]: string };
}> = () => {
  return new Promise((resolve, reject) => {
    const fifaRankings: {
      team: string;
      date: Date;
      position: number;
      points: number;
    }[] = [];
    const currentPoints:  { [key: string]: number } = {};
    const countryCodes: { [key: string]: string } = {};
    const federations: { [key: string]: string } = {};

    const rl = readline.createInterface({
      input: fs.createReadStream("./db/cleaned/fifa-rankings.csv", {
        encoding: "utf-8",
      }),
      output: process.stdout,
      terminal: false,
    });

    let header = true;

    rl.on("line", (line) => {
      const [rank, name, code, points, ...rest] = line.split(",");
      if (header) {
        header = false;
        return;
      }

      fifaRankings.push({
        team: code,
        date: new Date(rest[rest.length - 1]),
        position: parseInt(rank),
        points: parseFloat(points),
      });
      currentPoints[code] = parseFloat(points);
      countryCodes[name] = code;
      federations[code] = rest[rest.length - 2];
    });

    rl.on("close", () => {
      resolve({ fifaRankings, currentPoints, countryCodes, federations });
    });

    rl.on("error", (error) => {
      reject(error);
    });
  });
};
