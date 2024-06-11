import fs from "fs";
import readline from "readline";

import { readFIFARankingsData } from "./get-country-data.js";
import { readXGoalData } from "./get-x-goals.js";
import {
  scrapeInitialNationsLeagueRanking,
  scrapeWorldCupStats,
} from "./scrape-stats.js";

export const getTeamStaticData = async () => {
  const IMG_BASE =
    "https://res.cloudinary.com/caoxantb/image/upload/f_auto,q_auto/v1";

  const worldCupStats = await scrapeWorldCupStats();
  const nationsLeagueRanking = await scrapeInitialNationsLeagueRanking();
  const stadiums = JSON.parse(
    fs.readFileSync("./db/json/stadiums.json", {
      encoding: "utf8",
    })
  );
  const { fifaRankings, currentPoints, countryCodes, federations } =
    await readFIFARankingsData();
  const xGoalStats = await readXGoalData();

  const finalData = Object.keys(countryCodes).map((name) => {
    const code = countryCodes[name];
    return {
      name,
      code,
      flag: `${IMG_BASE}/flag/${code}`,
      logo: `${IMG_BASE}/logo/${code}`,
      kits: {
        homeKit: `${IMG_BASE}/kits/${code}_home`,
        awayKit: `${IMG_BASE}/kits/${code}_away`,
      },
      currentFIFAPoints: currentPoints[code],
      pastWorldCupStats: Object.prototype.hasOwnProperty.call(
        worldCupStats,
        code
      )
        ? worldCupStats[code]
        : [],
      initialUEFARanking: nationsLeagueRanking[code],
      xGoalData: xGoalStats[name],
      homeStadium: stadiums[code],
      federation: federations[code],
    };
  });

  fs.writeFileSync("./db/json/teams.json", JSON.stringify(finalData), "utf8");
  fs.writeFileSync(
    "./db/json/rankings.json",
    JSON.stringify(fifaRankings),
    "utf8"
  );

  return { finalData, fifaRankings };
};

export const getMatchStaticData: () => Promise<
  {
    date: Date;
    homeTeam: string;
    awayTeam: string;
    homeTeamGoals: number;
    awayTeamGoals: number;
    round: string;
    isNeutralVenue: boolean;
  }[]
> = () => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream("./db/cleaned/full-matches.csv", {
        encoding: "utf-8",
      }),
      output: process.stdout,
      terminal: false,
    });

    const matchData: {
      date: Date;
      homeTeam: string;
      awayTeam: string;
      homeTeamGoals: number;
      awayTeamGoals: number;
      round: string;
      isNeutralVenue: boolean;
    }[] = [];
    let header = true;

    rl.on("line", (line) => {
      const [
        date,
        homeTeam,
        awayTeam,
        homeTeamGoals,
        awayTeamGoals,
        round,
        _city,
        _country,
        isNeutralVenue,
        ...rest
      ] = line.split(",");

      if (header) {
        header = false;
        return;
      }

      matchData.push({
        date: new Date(date),
        homeTeam,
        awayTeam,
        homeTeamGoals: parseInt(homeTeamGoals),
        awayTeamGoals: parseInt(awayTeamGoals),
        round,
        isNeutralVenue: isNeutralVenue.toLowerCase() === "true",
      });
    });

    rl.on("close", () => {
      resolve(matchData);
    });

    rl.on("error", (error) => {
      reject(error);
    });
  });
};

getTeamStaticData();
