import _, { Dictionary } from "lodash";
import { BadRequest } from "./httpError";
import { Match, Ranking, RoundStatic } from "../models";
import { getHosts } from "./teamsUtils";

type GroupStageObject = {
  groupName: string;
  groupData: any;
  groupDataObj?: { [key: string]: any };
};

export const parseAdvancedStatus = (
  slots: { [key: string]: string | { [key: string]: string } } | undefined,
  teams: {
    [key: string]: {
      min: number;
      max: number;
    };
  },
  code: string,
  groupName: string,
  matchDate: Date
) => {
  if (!slots) {
    throw new BadRequest("");
  }

  const advancedStatus = Object.keys(teams).reduce(
    (acc: { [key: string]: {} }, cur) => {
      const { min, max } = teams[cur];

      // slots doesn't contain min value -> min value > all slots -> eliminated
      if (!slots[min] && !code.startsWith("UEFA-NL")) {
        acc[cur] = {
          currentRound: {
            status: "eliminated",
          },
        };
      }

      // min = max indicates the position is fixed, for non-edge positions
      else if (min === max && typeof slots[min] === "string") {
        acc[cur] = {
          currentRound: {
            status: "advanced",
            advancedTo: slots[min],
          },
          nextRound: {
            team: cur,
            qualifiedAs: `${code}-${groupName}-${min}`,
            qualifiedDate: matchDate,
          },
        };
      }

      // slots min = slots max indicates advanced round is fixed
      else if (slots[min] === slots[max]) {
        acc[cur] = {
          currentRound: {
            status: "advanced",
            advancedTo: slots[min],
          },
          nextRound: {
            team: cur,
            qualifiedAs: `${code}-${groupName}-${min}/${max}`,
            qualifiedDate: matchDate,
          },
        };
      } else {
        acc[cur] = {
          currentRound: {
            status: "undetermined",
          },
        };
      }

      return acc;
    },
    {}
  );

  return advancedStatus;
};

export const parseAdvancedStatusEdgedPosition = async (
  code: string,
  edgePosition: number,
  edgeSlots: { [key: string]: string },
  groupStage: {
    groupName: string;
    groupData: {
      points: number;
      goalsDifference: number;
      goalsFor: number;
      team: string;
      matchesPlayed: number;
    }[];
  }[],
  matchDate: Date,
  totalMatchdays: number
) => {
  let edgeTeams: { [key: string]: any } = {};
  let advancedStatus: { [key: string]: any } = {};

  // check how many teams have played the last match and fixated their group stage position
  groupStage.forEach((group) => {
    const team = {
      ...group.groupData[edgePosition - 1],
      groupName: group.groupName,
    };

    if (team.matchesPlayed === totalMatchdays) edgeTeams[team.team] = team;
  });

  // if the number of teams played last match is < possible advanced edge slots -> {}
  const teamsNotPlayed = groupStage.length - Object.keys(edgeTeams).length;
  const edgeDiff = Object.keys(edgeSlots).length - teamsNotPlayed;
  if (edgeDiff <= 0 || !groupStage.length) return {};

  // sorted edge positions
  const sortedEdgeTeams = await sortGroupData(edgeTeams);

  // check if the next round can be decided: only if all teams have played, or all same advanced round
  const sameAdvancedRound = new Set(Object.values(edgeSlots)).size;
  const decidableNextRound =
    sameAdvancedRound === 1 || groupStage.length === sortedEdgeTeams.length;

  sortedEdgeTeams.forEach((team, i) => {
    const teamPosition = i + 1 + teamsNotPlayed;

    if (edgeSlots[teamPosition]) {
      advancedStatus[team.team] = {
        currentRound: {
          status: "advanced",
          advancedTo: decidableNextRound ? edgeSlots[teamPosition] : undefined,
        },
        ...(decidableNextRound && {
          nextRound: {
            team: team.team,
            qualifiedAs: `${code}-${team.groupName}-${edgePosition}`,
            qualifiedDate: matchDate,
          },
        }),
      };
    } else {
      advancedStatus[team.team] = {
        currentRound: {
          status:
            groupStage.length === sortedEdgeTeams.length
              ? "eliminated"
              : "undertermined",
        },
      };
    }
  });

  return advancedStatus;
};

export const checkTeamMinMaxPosition = (
  pointsTable: { [key: string]: { points: number; matchesPlayed: number } },
  legs: number
) => {
  const teams = Object.keys(pointsTable);
  const totalMatches = (teams.length - 1) * legs;

  const teamMinMaxTable = Object.fromEntries(
    teams.map((team) => [
      team,
      teams.reduce(
        (acc, cur) => {
          if (
            pointsTable[cur].points +
              (totalMatches - pointsTable[cur].matchesPlayed) * 3 >=
            pointsTable[team].points
          ) {
            acc.max++;
          }
          if (
            team !== cur &&
            pointsTable[team].points +
              (totalMatches - pointsTable[team].matchesPlayed) * 3 >=
              pointsTable[cur].points
          ) {
            acc.min--;
          }
          return acc;
        },
        { min: teams.length, max: 0 }
      ),
    ])
  );

  return teamMinMaxTable;
};

export const checkTeamMinMaxPositionTwoRoundsRemain = (
  matches: any,
  pointsTable: { [key: string]: { points: number } }
) => {
  const teamMinMaxTable = Object.fromEntries(
    Object.keys(pointsTable).map((team) => [team, { min: 1000, max: 0 }])
  );
  const results = ["HOME", "DRAW", "AWAY"];

  for (let i = 0; i < 3 ** matches.length; i++) {
    let resIdx = i;
    const clonePointsTable = { ...pointsTable };

    for (let match of matches) {
      const result = results[resIdx % 3];
      switch (result) {
        case "HOME":
          clonePointsTable[match?.homeTeam].points += 3;
          break;
        case "DRAW":
          clonePointsTable[match?.homeTeam].points += 1;
          clonePointsTable[match?.awayTeam].points += 1;
          break;
        case "AWAY":
          clonePointsTable[match?.awayTeam].points += 3;
          break;
      }
      resIdx = Math.floor(resIdx / 3);
    }

    const pointsMinMax: any = Object.values(clonePointsTable)
      .sort((a: any, b: any) => b - a)
      .reduce((acc: any, num: any, idx) => {
        if (!acc[num]) acc[num] = { min: idx + 1 };
        acc[num].max = idx + 1;
        return acc;
      }, {});

    for (let team in teamMinMaxTable) {
      const teamPoints = clonePointsTable[team].points;

      teamMinMaxTable[team].min = Math.min(
        teamMinMaxTable[team].min,
        pointsMinMax[teamPoints]?.min
      );
      teamMinMaxTable[team].max = Math.max(
        teamMinMaxTable[team].max,
        pointsMinMax[teamPoints]?.max
      );
    }
  }

  return teamMinMaxTable;
};

export const applyMatchesResult = (
  matches: any,
  groupStageObj?: Dictionary<GroupStageObject>,
  groupDataObj?: { [key: string]: any }
) => {
  matches.forEach((match: any) => {
    const { homeTeam, awayTeam, group, homeTeamGoals, awayTeamGoals } = match;

    if (!(group && homeTeam && awayTeam)) {
      throw new BadRequest("Matches invalid");
    }

    const groupData = groupStageObj
      ? groupStageObj[group].groupDataObj
      : groupDataObj;

    if (!groupData) {
      throw new BadRequest("Group data not found");
    }

    if (homeTeamGoals !== undefined && awayTeamGoals !== undefined) {
      updateGroupData(groupData, homeTeam, homeTeamGoals, awayTeamGoals);
      updateGroupData(groupData, awayTeam, awayTeamGoals, homeTeamGoals);
    }
  });
};

export const updateGroupData = (
  groupData: { [key: string]: any },
  team: string,
  goalsFor: number,
  goalsAgainst: number
) => {
  groupData[team].matchesPlayed++;
  groupData[team].goalsFor += goalsFor;
  groupData[team].goalsAgainst += goalsAgainst;
  groupData[team].goalsDifference += goalsFor - goalsAgainst;
  if (goalsFor > goalsAgainst) {
    groupData[team].wins++;
    groupData[team].points += 3;
  } else if (goalsFor < goalsAgainst) {
    groupData[team].losses++;
  } else {
    groupData[team].draws++;
    groupData[team].points += 1;
  }
};

export const sortGroupData = async (
  groupDataObj: { [key: string]: any },
  round?: string,
  gameplay?: string
) => {
  const groupData = Object.values(groupDataObj);

  const groupedData = _.groupBy(
    groupData,
    (item) => `${item.points}-${item.goalsDifference}-${item.goalsFor}`
  );

  const processedData = await Promise.all(
    _.flatMap(groupedData, async (group) => {
      if (group.length > 1) {
        const teams = group.map((item) => item.team);
        const tieBreakers = await deepTieBreaker(teams, round, gameplay);

        return group.map((item) => ({
          ...item._doc,
          ...tieBreakers[item.team],
        }));
      }
      return group;
    })
  );

  const sortedData = _.orderBy(
    _.flatten(processedData),
    [
      "points",
      "goalsDifference",
      "goalsFor",
      "pointsExtra",
      "goalsDifferenceExtra",
      "goalsForExtra",
      "fifaRankingExtra",
    ],
    ["desc", "desc", "desc", "desc", "desc", "desc", "asc"]
  );

  return sortedData;
};

export const deepTieBreaker = async (
  teams: string[],
  round?: string,
  gameplay?: string
) => {
  const matches =
    round && gameplay
      ? await Match.find({
          round,
          gameplay,
          $and: [{ homeTeam: { $in: teams } }, { awayTeam: { $in: teams } }],
        })
      : [];

  const headsToHeads: { [key: string]: any } = {};
  const tieBreakingData: { [key: string]: any } = {};

  teams.forEach(
    (team: string) =>
      (headsToHeads[team] = {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDifference: 0,
        points: 0,
      })
  );

  applyMatchesResult(matches, undefined, headsToHeads);

  const fifaRankings = await Ranking.aggregate([
    {
      $match: {
        team: { $in: teams },
        $or: [{ gameplay }, { gameplay: { $exists: false } }],
      },
    },
    { $sort: { team: 1, date: -1 } },
    {
      $group: {
        _id: "$team",
        team: { $first: "$team" },
        position: { $first: "$position" },
      },
    },
    { $sort: { team: 1 } },
  ]);

  fifaRankings.forEach((fifaRanking) => {
    const team = fifaRanking.team;
    tieBreakingData[team] = {
      pointsExtra: headsToHeads[team].points,
      goalsForExtra: headsToHeads[team].goalsFor,
      goalsDifferenceExtra: headsToHeads[team].goalsDifference,
      fifaRankingExtra: fifaRanking.position,
    };
  });

  return tieBreakingData;
};

export const getStaticRounds = async (
  hosts: { name: string; order: number; federation: string }[],
  code?: string
) => {
  const hostsByFed = hosts.reduce((acc: { [key: string]: string[] }, cur) => {
    const fed = cur.federation;
    if (!acc[fed]) {
      acc[fed] = [];
    }
    acc[fed].push(cur.name);
    return acc;
  }, {});

  const feds = Object.keys(hostsByFed);

  const conditionalQuery = {
    $or: [
      ...feds.map((fed) => {
        return {
          hosts: hosts.length,
          federation: fed,
        };
      }),
      { hosts: { $exists: false } },
      {
        hosts: 0,
        federation: { $nin: feds },
      },
      {
        hosts: feds.length,
        federation: "FIFA",
      },
    ],
  };

  const roundsStatic = await RoundStatic.find(
    code ? { $and: [conditionalQuery, { code }] } : conditionalQuery
  );

  return roundsStatic;
};

export const initRounds = async (
  gameplayId: string,
  hosts: { name: string; order: number; federation: string }[],
  teamsStatic: any[]
) => {
  const staticRounds = await getStaticRounds(hosts);
  const hostArr = getHosts(hosts);

  const teamsStaticObj = teamsStatic.reduce((acc, cur) => {
    return {
      ...acc,
      [cur.federation]: cur.teams.filter(
        (team: any) => !hostArr.includes(team.code)
      ),
    };
  }, {});

  const initialRounds = staticRounds.map((round: any) => {
    const { code, numberOfTeams, numberOfGroups, entryTeams, ...rest } = round;

    const [startIndex, endIndex] = entryTeams
      ? entryTeams
      : [undefined, undefined];

    const teams =
      code === "FIFA-WC-GS"
        ? hostArr.map((country) => {
            return {
              team: country,
              qualifiedAs: "Host",
            };
          })
        : endIndex && !code.startsWith("FIFA")
        ? teamsStaticObj[code.split("-")[0]]
            .slice(startIndex, endIndex)
            .map((team: any) => {
              return {
                team: team.code,
              };
            })
        : [];

    const groupStage = !numberOfGroups
      ? undefined
      : !code.startsWith("UEFA-NL")
      ? [...Array(numberOfGroups).keys()].map((num) => {
          return {
            groupName: code.startsWith("CONMEBOL")
              ? "GS"
              : String.fromCharCode(num + 65),
            groupData: [],
          };
        })
      : code.startsWith("UEFA-NL")
      ? [...Array(numberOfGroups).keys()].map((num) => {
          return {
            groupName: "" + code.split("-").slice(-1)[0] + (num + 1),
            groupData: [],
          };
        })
      : undefined;

    return {
      code,
      teams,
      numberOfTeams,
      ...(numberOfGroups && { numberOfGroups }),
      ...rest,
      ...(groupStage && { groupStage }),
      gameplay: gameplayId,
    };
  });

  return initialRounds;
};
