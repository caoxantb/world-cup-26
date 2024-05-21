import axios from "axios";
import { JSDOM } from "jsdom";
import pLimit from "p-limit";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

import { readFIFARankingsData } from "./get-country-data";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const checkImageValidity = async (
  code: string,
  type: string,
  year: number,
  countryToFeds: {
    [key: string]: string;
  }
) => {
  const BASE_URL = "https://www.colours-of-football.com/national_teams_kits";
  const feds: { [key: string]: string } = {
    AFC: "afc_asia",
    CAF: "caf_africa",
    OFC: "oceania",
    UEFA: "uefa",
    CONCACAF: "concacaf",
    CONMEBOL: "conmebol",
  };
  const codeDiff: { [key: string]: string } = {
    SGP: "SIN",
    LBN: "LIB",
    SDN: "SUD",
    MSR: "MRS",
  };

  const srcFeds = feds[countryToFeds[code]];
  const srcCode = codeDiff.hasOwnProperty(code) ? codeDiff[code] : code;
  const srcCodeFix = ["LIB", "MRS"].includes(srcCode) ? code : srcCode;
  const srcLower =
    countryToFeds[code] !== "UEFA" ? srcCode.toLowerCase() : srcCode;
  const srcType =
    type === "home" && srcCode !== "MLI"
      ? 1
      : type === "away" && srcCode === "MLI"
      ? 3
      : 2;
  const srcYear = year - 2000;
  const oldTag = srcCode === "MDA" ? "moldova_national_team_" : "";

  const url = `${BASE_URL}/${srcFeds}/${srcLower}/${srcCodeFix}_${oldTag}${srcType}_${srcYear}.png`;

  try {
    const response = await axios.head(url);
    if (response.status === 200) {
      await uploadToCloudinary(url, "kits", `${code}_${type}`);
    } else {
      if (year <= 2012) return;
      await checkImageValidity(code, type, year - 1, countryToFeds);
    }
  } catch (err) {
    if (year <= 2012) return;
    await checkImageValidity(code, type, year - 1, countryToFeds);
  }
};

const uploadToCloudinary = async (url: string, type: string, code: string) => {
  await cloudinary.uploader.upload(
    url,
    {
      public_id: `${type}/${code}`,
      quality_analysis: true,
      colors: true,
    },
    function (error, result) {
      console.log(result?.url || { error, url });
    }
  );
};

const uploadFlagsAndLogos = async (countries: { [key: string]: string }) => {
  const PREFIX = "https://www.international-football.net";
  const URL = `${PREFIX}/country?team`;
  const countriesDiffName: { [key: string]: string } = {
    "Brunei Darussalam": "Brunei",
    "China PR": "China",
    "Congo DR": "Dem. Rep. of Congo",
    "IR Iran": "Iran",
    "Côte d'Ivoire": "Ivory Coast",
    "Korea DPR": "North Korea",
    "Korea Republic": "South Korea",
    "Turks and Caicos Islands": "Turks and Caicos",
    "Cabo Verde": "Cape Verde",
    Czechia: "Czech Republic",
    "Republic of Ireland": "Ireland",
    "Kyrgyz Republic": "Kyrgyzstan",
    "São Tomé and Príncipe": "São Tomé e Príncipe",
    Türkiye: "Turkey",
    "United States Virgin Islands": "US Virgin Islands",
  };

  const limit = pLimit(10);

  const promises = Object.keys(countries).map((key) => {
    return limit(async () => {
      const countryName = countriesDiffName.hasOwnProperty(key)
        ? countriesDiffName[key]
        : key;

      try {
        const res = await axios.get(`${URL}=${countryName}`);
        const { document } = new JSDOM(res.data).window;
        const flag = document
          .getElementById("corps-header")
          ?.querySelector("img")?.src;
        const logo =
          countryName === "Argentina"
            ? "https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/Argentina_national_football_team_logo.svg/1280px-Argentina_national_football_team_logo.png"
            : document.querySelector(".introbox")?.querySelector("img")?.src;

        flag &&
          (await uploadToCloudinary(
            `${PREFIX}/${flag}`,
            "flag",
            countries[key]
          ));
        logo && (await uploadToCloudinary(logo, "logo", countries[key]));
      } catch (err) {
        console.error(err);
      }
    });
  });

  await Promise.all(promises);
};

const uploadKits = async (
  type: string,
  countryToFeds: { [key: string]: string }
) => {
  const limit = pLimit(5);

  const promises = Object.keys(countryToFeds).map((key) => {
    return limit(async () => {
      await checkImageValidity(key, type, 2022, countryToFeds);
    });
  });

  await Promise.all(promises);
};

const uploadImages = async () => {
  const { countryCodes: countries, federations: countryToFeds } =
    await readFIFARankingsData();

  await uploadFlagsAndLogos(countries);
  await uploadKits("home", countryToFeds);
  await uploadKits("away", countryToFeds);
};
