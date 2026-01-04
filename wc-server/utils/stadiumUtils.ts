import _, { filter } from "lodash";
import munkres from "munkres";
import seedrandom from "seedrandom";

import { Stadium } from "../models";
import { IStadium } from "../models/stadium";

const rng = seedrandom("42");

const haversineDistance = (
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
) => {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in km
};

const initCentroids = (points: [number, number][], k: number = 4) => {
  const centroids: [number, number][] = [];
  const n = points.length;

  // Step 1: Choose first centroid randomly
  centroids.push(points[Math.floor(rng() * n)]);

  while (centroids.length < k) {
    const distances = points.map((p) => {
      let minDist = Infinity;
      for (const c of centroids) {
        const d = haversineDistance(p, c);
        if (d < minDist) minDist = d;
      }
      return minDist ** 2; // Probability is proportional to squared distance
    });

    // Step 2: Choose next centroid with weighted probability
    const total = distances.reduce((sum, d) => sum + d, 0);

    const r = rng() * total;
    let acc = 0;
    for (let i = 0; i < n; i++) {
      acc += distances[i];
      if (acc >= r) {
        centroids.push(points[i]);
        break;
      }
    }
  }
  return centroids;
};

const mean = (points: [number, number][]): [number, number] => {
  const n = points.length;
  const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / n, sum[1] / n];
};

const kmeans = (points: [number, number][], k = 4, maxIter = 100) => {
  const n = points.length;
  const clusterSize = Math.floor(n / k);

  const centroids = initCentroids(points, k);

  const assignments: number[] = new Array(n).fill(-1);
  let changed = true;
  let iter = 0;

  while (changed && iter < maxIter) {
    changed = false;
    const clusters = Array.from({ length: k }, () => []);

    // Create distance matrix
    const distances = points.map((p) =>
      centroids.map((c) => haversineDistance(p, c))
    );

    // Assign points greedily with size constraint
    const assigned = new Array(n).fill(false);
    const clusterCounts = new Array(k).fill(0);

    for (let pass = 0; pass < n; pass++) {
      let minDist = Infinity;
      let chosenPoint = -1;
      let chosenCluster = -1;

      for (let i = 0; i < n; i++) {
        if (assigned[i]) continue;
        for (let j = 0; j < k; j++) {
          if (clusterCounts[j] >= clusterSize) continue;
          if (distances[i][j] < minDist) {
            minDist = distances[i][j];
            chosenPoint = i;
            chosenCluster = j;
          }
        }
      }

      if (chosenPoint !== -1) {
        assignments[chosenPoint] = chosenCluster;
        assigned[chosenPoint] = true;
        clusterCounts[chosenCluster]++;
      }
    }

    // Recalculate centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === j);
      if (clusterPoints.length > 0) {
        const newCentroid = mean(clusterPoints);
        if (haversineDistance(centroids[j], newCentroid) > 1e-6) {
          centroids[j] = newCentroid;
          changed = true;
        }
      }
    }

    iter++;
  }

  const clusters: [number, number][][] = Array.from({ length: k }, () => []);
  points.forEach((p, idx) => clusters[assignments[idx]].push(p));

  return { centroids, clusters, assignments };
};

const clusteringStadium = (stadiums: IStadium[], k: number = 4) => {
  const stadiumsCoord = stadiums.map((stadium) => stadium.coordinations);
  const clusters = kmeans(stadiumsCoord, k);

  const clusteredStadiums: IStadium[][] = Array.from({ length: k }, () => []);

  clusters.assignments.forEach((c, idx) =>
    clusteredStadiums[c].push(stadiums[idx])
  );

  return { clusteredStadiums, centroids: clusters.centroids };
};

const mixClusterStadium = (
  stadiums: IStadium[],
  preferedHostOrder: string[]
) => {
  const THREE_MATCH = new Set([1, 2, 4, 5, 6]);
  const FOUR_MATCH = new Set([3, 7, 8]);

  const threeMatchStadiums = stadiums.filter((s) => THREE_MATCH.has(s.group));
  const fourMatchStadiums = stadiums.filter((s) => FOUR_MATCH.has(s.group));

  const { clusteredStadiums: clustered3, centroids: centroids3 } =
    clusteringStadium(threeMatchStadiums);
  const { clusteredStadiums: clustered4, centroids: centroids4 } =
    clusteringStadium(fourMatchStadiums);

  const costMatrix = centroids3.map((c1) =>
    centroids4.map((c2) => haversineDistance(c1, c2))
  );

  const indices = munkres(costMatrix);

  const stadiumGroups = indices.map(([i, j]) => [
    ...clustered3[i],
    ...clustered4[j],
  ]);

  // check only in cases there are 4 stadiums in the same group -> swap one
  const sourceGroupIndex = stadiumGroups.findIndex(
    (group) => group.filter((s) => s.hostOpeningMatch).length > 3
  );

  if (sourceGroupIndex !== -1) {
    const sourceGroup = stadiumGroups[sourceGroupIndex];

    const stadiumToSwap = sourceGroup.find(
      (s) => s.hostOpeningMatch === preferedHostOrder[1]
    );

    if (stadiumToSwap) {
      const sameMatchesCount = THREE_MATCH.has(stadiumToSwap.group)
        ? threeMatchStadiums
        : fourMatchStadiums;

      const sourceGroupNames = new Set(sourceGroup.map((s) => s.name));

      const closestSwappableStadium = sameMatchesCount.reduce<{
        stadium: IStadium | null;
        distance: number;
      }>(
        (acc, stadium) => {
          if (sourceGroupNames.has(stadium.name)) return acc;

          const distance = haversineDistance(
            stadiumToSwap.coordinations,
            stadium.coordinations
          );

          return distance < acc.distance ? { stadium, distance } : acc;
        },
        { stadium: null, distance: Number.MAX_SAFE_INTEGER }
      ).stadium;

      if (closestSwappableStadium) {
        const targetGroupIndex = stadiumGroups.findIndex((group) =>
          group.some((s) => s.name === closestSwappableStadium.name)
        );

        if (targetGroupIndex !== -1) {
          const targetGroup = stadiumGroups[targetGroupIndex];

          const sourceIndex = sourceGroup.findIndex(
            (s) => s.name === stadiumToSwap.name
          );
          const targetIndex = targetGroup.findIndex(
            (s) => s.name === closestSwappableStadium.name
          );

          if (sourceIndex !== -1 && targetIndex !== -1) {
            sourceGroup[sourceIndex] = closestSwappableStadium;
            targetGroup[targetIndex] = stadiumToSwap;
          }
        }
      }
    }
  }

  stadiumGroups.sort((a, b) => {
    const bestPreferredIndex = (group: IStadium[]) => {
      const hosts = group.map((s) => s.hostOpeningMatch).filter(Boolean);

      let bestIndex = Infinity;

      for (const host of hosts) {
        const index = host ? preferedHostOrder.indexOf(host) : -1;
        if (index !== -1 && index < bestIndex) {
          bestIndex = index;
        }
      }

      return bestIndex;
    };
    return bestPreferredIndex(a) - bestPreferredIndex(b);
  });

  return stadiumGroups;
};

const allocateHostsToGroup = (stadiumGroups: IStadium[][]) => {
  const groups = stadiumGroups.map((group) =>
    group.map(({ hostOpeningMatch }) => hostOpeningMatch).filter(Boolean)
  );

  const hosts = new Map<string, number>();
  let grIdx = 0;

  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      hosts.set(group[i] as string, grIdx + i * 2);
    }
    grIdx++;
  }

  return hosts;
};

const orderStadiumGroups = (group: IStadium[], preferedHostOrder: string[]) => {
  let s1: IStadium, s2: IStadium, s3: IStadium, s4: IStadium, s5: IStadium;
  const THREE_MATCH_GROUPS = [1, 2, 4, 5, 6];
  const FOUR_MATCH_GROUPS = [3, 7, 8];

  const isThreeMatch = (s: IStadium) => THREE_MATCH_GROUPS.includes(s.group);
  const isFourMatch = (s: IStadium) => FOUR_MATCH_GROUPS.includes(s.group);

  const orderByCapacityDesc = (a: IStadium, b: IStadium) =>
    b.capacity - a.capacity;

  const filterStadiumGroup = (stadiumGroup: IStadium[]) => {
    const stadiums = stadiumGroup.filter((s) => !hostStadiums.includes(s));
    return stadiums.length === 1 ? stadiums[0] : stadiums;
  };

  const threeMatchStadiums = group
    .filter(isThreeMatch)
    .sort(orderByCapacityDesc);
  const fourMatchStadiums = group.filter(isFourMatch).sort(orderByCapacityDesc);
  const hostStadiums = group
    .filter((s) => s.hostOpeningMatch)
    .sort(
      (a, b) =>
        preferedHostOrder.indexOf(a.hostOpeningMatch!) -
        preferedHostOrder.indexOf(b.hostOpeningMatch!)
    );

  [s1, s3, s5] = hostStadiums;

  const threeMatchHostStadiums = hostStadiums.filter(isThreeMatch).length;

  if (!s1) {
    [s1, s5] = threeMatchStadiums;
    [s3, s2, s4] = fourMatchStadiums;
  } else if (!s3) {
    if (isThreeMatch(s1)) {
      [s3, s2, s4] = fourMatchStadiums;
      s5 = filterStadiumGroup(threeMatchStadiums) as IStadium;
    } else {
      [s3, s4] = filterStadiumGroup(fourMatchStadiums) as IStadium[];
      [s5, s2] = threeMatchStadiums;
    }
  } else if (!s5) {
    if (threeMatchHostStadiums === 2) [s5, s2, s4] = fourMatchStadiums;
    else if (isThreeMatch(s1)) {
      s5 = filterStadiumGroup(threeMatchStadiums) as IStadium;
      [s2, s4] = filterStadiumGroup(fourMatchStadiums) as IStadium[];
    } else if (threeMatchStadiums.includes(s3)) {
      s2 = filterStadiumGroup(threeMatchStadiums) as IStadium;
      [s5, s4] = filterStadiumGroup(fourMatchStadiums) as IStadium[];
    } else {
      s4 = filterStadiumGroup(fourMatchStadiums) as IStadium;
      [s5, s2] = threeMatchStadiums;
    }
  } else {
    if (threeMatchHostStadiums === 2)
      [s2, s4] = filterStadiumGroup(fourMatchStadiums) as IStadium[];
    else if (threeMatchHostStadiums === 1)
      if (isThreeMatch(s1)) {
        s2 = filterStadiumGroup(fourMatchStadiums) as IStadium;
        s4 = filterStadiumGroup(threeMatchStadiums) as IStadium;
      } else {
        s4 = filterStadiumGroup(fourMatchStadiums) as IStadium;
        s2 = filterStadiumGroup(threeMatchStadiums) as IStadium;
      }
    else [s2, s4] = threeMatchStadiums;
  }

  return [s1, s2, s3, s4, s5];
};

const arrangeStadiumsWithinGroup = (stadiums: IStadium[]) => {
  const isFourMatches = (type: number) =>
    [3, 7, 8].includes(stadiums[type - 1].group);

  return [
    [
      [1, 2],
      [3, 4],
      [5, !isFourMatches(3) && !isFourMatches(5) ? 2 : 3],
    ],
    [
      [3, isFourMatches(1) ? 1 : 2],
      [4, 5],
      [2, 1],
    ],
    [
      [5, 4],
      [1, 2],
      [isFourMatches(5) ? 5 : 3, isFourMatches(4) ? 4 : 3],
    ],
  ];
};

const allocateStadiumGroups = (
  stadiumGroups: IStadium[][],
  preferedHostOrder: string[]
) => {
  const groupHostNumber = stadiumGroups.map(
    (group) => group.filter((stadium) => stadium.hostOpeningMatch).length
  );

  const allocations: number[][] = Array.from({ length: 3 }, () =>
    Array(4).fill(-1)
  );
  const usedAlloc = new Set();
  let base = 0;

  for (let i = 0; i < groupHostNumber.length; i++) {
    if (groupHostNumber[i] === 0) break;

    for (let j = 0; j < groupHostNumber[i]; j++) {
      const alloc = base + j * 2;
      allocations[j][i] = alloc;
      usedAlloc.add(alloc);
    }
    do {
      base++;
    } while (usedAlloc.has(base));
  }

  for (let i = 0; i < groupHostNumber.length; i++) {
    for (let j = 0; j < allocations.length; j++) {
      if (allocations[i][j] !== -1) continue;

      while (usedAlloc.has(base)) {
        base++;
      }

      allocations[i][j] = base;
      usedAlloc.add(base);
    }
  }

  const transAllocation = _.zip(...allocations);

  const orderedStadiumGroups = stadiumGroups.map((group) =>
    orderStadiumGroups(group, preferedHostOrder)
  );

  const arrangements = orderedStadiumGroups
    .filter((group): group is IStadium[] => group !== undefined)
    .map(arrangeStadiumsWithinGroup);

  const stadiums: (IStadium | undefined)[] = [];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 12; j++) {
      const groupAllocation = allocations.findIndex((al) => al.includes(j));
      const stadiumAllocation = transAllocation.findIndex((al) =>
        al.includes(j)
      );

      const stadiumIndexes =
        arrangements[stadiumAllocation]?.[i]?.[groupAllocation];

      stadiumIndexes?.forEach((stad) =>
        stadiums.push(orderedStadiumGroups[stadiumAllocation][stad - 1])
      );
    }
  }

  const swapMatches = (start: number, end: number) => {
    for (let i = start; i <= end; i += 4) {
      [stadiums[i], stadiums[i + 1]] = [stadiums[i + 1], stadiums[i]];
    }
  };

  swapMatches(3, 19);
  swapMatches(25, 45);
  // switch F2 and G2
  [stadiums[12], stadiums[13]] = [stadiums[13], stadiums[12]];

  return stadiums;
};

export const getWorldCupStadiums = async (
  code: string,
  gameplayType: "custom" | "north_america" | "centenario",
  hosts: string[],
  gameplayId?: string
) => {
  const stadiums = await Stadium.find(
    gameplayType === "custom" ? { gameplayId } : { type: gameplayType }
  );

  const stadiumGroups = mixClusterStadium(stadiums, hosts);
  const groupStageStadiums = allocateStadiumGroups(stadiumGroups, hosts);
  const hostsGroupIdx = allocateHostsToGroup(stadiumGroups);

  switch (code) {
    case "FIFA-INTERPO-SF":
      return stadiums
        .filter((stadium) => [3, 4].includes(stadium.group))
        .sort((s1, s2) => s1.group - s2.group);
    case "FIFA-INTERPO-F":
      return stadiums.filter((stadium) => [1, 2].includes(stadium.group));
    case "FIFA-WC-GS":
      return groupStageStadiums;
    case "FIFA-WC-R32": {
      const r32StadiumsFinal = Array(16).fill("");
      const r32Stadiums = stadiums.filter(
        (stadium) => ![2, 8].includes(stadium.group)
      );

      const usedStadiums = new Set();

      hosts.forEach((host) => {
        const stadium =
          r32Stadiums.find((s) => s.hostOpeningMatch === host) ||
          r32Stadiums
            .filter((s) => s.hostCountry === host)
            .sort((s1, s2) => s2.capacity - s1.capacity)[0];

        if (stadium) {
          const hostGrIdx = hostsGroupIdx.get(host)!;
          const hostR32Idx = hostGrIdx + Math.floor(hostGrIdx / 2);
          r32StadiumsFinal[hostR32Idx] = stadium;
          usedStadiums.add(stadium);
        }
      });

      const remainingStadiums = r32Stadiums.filter((s) => !usedStadiums.has(s));
      for (let i = remainingStadiums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingStadiums[i], remainingStadiums[j]] = [
          remainingStadiums[j],
          remainingStadiums[i],
        ];
      }

      let r = 0;
      for (let i = 0; i < r32StadiumsFinal.length; i++) {
        if (r32StadiumsFinal[i] === "" && r < remainingStadiums.length) {
          r32StadiumsFinal[i] = remainingStadiums[r++];
        }
      }

      return r32StadiumsFinal;
    }

    case "FIFA-WC-R16":
      return _.shuffle(
        stadiums.filter((stadium) => [1, 2, 3, 4, 5].includes(stadium.group))
      );

    case "FIFA-WC-QF":
      return _.shuffle(
        stadiums.filter((stadium) => [1, 2, 4].includes(stadium.group))
      );

    case "FIFA-WC-SF":
      return _.shuffle(
        stadiums.filter((stadium) => [3].includes(stadium.group))
      );

    case "FIFA-WC-3P":
      return stadiums.filter((stadium) => [2].includes(stadium.group));

    case "FIFA-WC-F":
      return stadiums.filter((stadium) => [1].includes(stadium.group));
  }
};
