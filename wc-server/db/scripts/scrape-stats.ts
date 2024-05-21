import axios from "axios";
import { JSDOM } from "jsdom";

import { readFIFARankingsData } from "./get-country-data.js";

const range = (start: number, end: number, step: number) => {
  return Array.from(
    Array(Math.ceil((end - start) / step) + 1).keys(),
    (_, i) => i * step + start
  );
};

export const scrapeWorldCupStats = async () => {
  const URL =
    "https://en.wikipedia.org/wiki/National_team_appearances_in_the_FIFA_World_Cup#Ranking_of_teams_by_number_of_appearances";
  const TEXTS: { [key: string]: string | { [key: number]: string } } = {
    "1st": "Winner",
    "2nd": "Runner-up",
    "3rd": "Third Place",
    "4th": "Fourth Place",
    QF: "Quarter Finals",
    R2: { 1978: "Quarter Finals", 1982: "Round of 12", 2022: "Round of 16" },
    R1: { 1930: "Group Stage", 1938: "Round of 16", 2022: "Group Stage" },
  };
  const years: number[] = [...range(1930, 1938, 4), ...range(1950, 2022, 4)];

  const res = await axios.get(URL);
  const { document } = new JSDOM(res.data).window;

  let currElem = document.getElementById(
    "Comprehensive_team_results_by_tournament"
  )?.parentElement as HTMLElement;

  while (
    currElem?.nextElementSibling &&
    currElem.tagName.toLowerCase() !== "table"
  ) {
    currElem = currElem.nextElementSibling as HTMLElement;
  }

  const rows = currElem?.querySelectorAll("tr") || [];
  const stats: { [key: string]: { place: string; year: number }[] } = {};

  [...rows].forEach((row) => {
    const data = row.querySelectorAll("td");
    let code;

    if (!!data.length) {
      let index: number = 0;
      let pastWorldCupStats: { place: string; year: number }[] = [];
      code = data[0].id;

      [...data].slice(1).forEach((td) => {
        const text = td?.innerHTML?.split("<")[0];
        let place: string | undefined;

        if (Object.keys(TEXTS).includes(text)) {
          if (["R2", "R1"].includes(text)) {
            const yearKey = Object.keys(
              TEXTS[text] as { [key: number]: string }
            ).find((year) => years[index] <= parseInt(year));
            place = yearKey ? TEXTS[text][parseInt(yearKey)] : undefined;
          } else {
            place = TEXTS[text] as string;
          }

          place &&
            pastWorldCupStats.push({
              place,
              year: years[index],
            });
        }

        index += td?.colSpan;
      });

      stats[code] = pastWorldCupStats;
    }
  });

  return stats;
};

export const scrapeInitialNationsLeagueRanking = async () => {
  const URL =
    "https://en.wikipedia.org/wiki/2024%E2%80%9325_UEFA_Nations_League";
  const { countryCodes: codes } = await readFIFARankingsData();

  const res = await axios.get(URL);
  const { document } = new JSDOM(res.data).window;

  const countries = [...document.querySelectorAll(".flagicon")]
    .map((element) => element.parentElement?.textContent?.trim())
    .slice(0, 55);

  const countriesFinal = [
    ...countries.slice(0, 35),
    countries.pop(),
    ...countries.slice(35, 45),
    ...countries.slice(46, 48),
    countries[45],
    ...countries.slice(48),
  ];

  const rankings: {[key: string]: number} = countriesFinal.reduce(
    (acc, cur, idx) => ({
      ...acc,
      [cur === "Turkey"
        ? codes["Türkiye"]
        : cur === "Czech Republic"
        ? codes["Czechia"]
        : codes[cur as string]]: idx + 1,
    }),
    {}
  );

  return rankings;
};
