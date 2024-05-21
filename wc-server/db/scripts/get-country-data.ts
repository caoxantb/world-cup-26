import fs from "fs";
import readline from "readline";

export const readFIFARankingsData: () => Promise<{
  fifaRankings: {
    [key: string]: {
      date: Date;
      position: number;
    }[];
  };
  countryCodes: { [key: string]: string };
  federations: { [key: string]: string };
}> = () => {
  return new Promise((resolve, reject) => {
    const fifaRankings: {
      [key: string]: {
        date: Date;
        position: number;
      }[];
    } = {};
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
      const [rank, name, code, ...rest] = line.split(",");
      if (header) {
        header = false;
        return;
      }

      const rankInfo = {
        date: new Date(rest[rest.length - 1]),
        position: parseInt(rank),
      };

      if (fifaRankings.hasOwnProperty(code)) {
        fifaRankings[code].push(rankInfo);
      } else {
        fifaRankings[code] = [rankInfo];
      }

      countryCodes[name] = code;
      federations[code] = rest[rest.length - 2];
    });

    rl.on("close", () => {
      resolve({ fifaRankings, countryCodes, federations });
    });

    rl.on("error", (error) => {
      reject(error);
    });
  });
};

readFIFARankingsData();
