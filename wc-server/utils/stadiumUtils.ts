import seedrandom from "seedrandom";
import { IStadium } from "../models/stadium";
import munkres from "munkres";
import _ from "lodash";
import { Stadium } from "../models";

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

  let assignments: number[] = new Array(n).fill(-1);
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

export const mixClusterStadium = (
  stadiums: IStadium[],
  preferedHostOrder: string[]
) => {
  const threeMatchStadiums = stadiums.filter((stadium) =>
    [1, 2, 4, 5, 6].includes(stadium.group)
  );
  const fourMatchStadium = stadiums.filter((stadium) =>
    [3, 7, 8].includes(stadium.group)
  );

  const { clusteredStadiums: clusteredStadiums3, centroids: centroids3 } =
    clusteringStadium(threeMatchStadiums);
  const { clusteredStadiums: clusteredStadiums4, centroids: centroids4 } =
    clusteringStadium(fourMatchStadium);

  const costMatrix = centroids3.map((c1) =>
    centroids4.map((c2) => haversineDistance(c1, c2))
  );

  const indices = munkres(costMatrix);

  const stadiumGroups = indices.map(([i, j]) => [
    ...clusteredStadiums3[i],
    ...clusteredStadiums4[j],
  ]);

  stadiumGroups.sort((group1, group2) => {
    const group1Host = group1.filter((stadium) => stadium.hostOpeningMatch);
    const group2Host = group2.filter((stadium) => stadium.hostOpeningMatch);

    const hostDiff = group2Host.length - group1Host.length;
    if (hostDiff !== 0) return hostDiff;

    const getTopHostIndex = (group: IStadium[]) => {
      const hostCountries = group
        .map((s) => s.hostOpeningMatch)
        .filter(Boolean);
      const index = preferedHostOrder.findIndex((host) =>
        hostCountries.includes(host)
      );
      return index === -1 ? Infinity : index;
    };

    return getTopHostIndex(group1) - getTopHostIndex(group2);
  });

  return stadiumGroups;
};

const orderStadiumGroups = (group: IStadium[], preferedHostOrder: string[]) => {
  let s1: IStadium | undefined,
    s2: IStadium | undefined,
    s3: IStadium | undefined,
    s4: IStadium | undefined,
    s5: IStadium | undefined;

  const threeMatchStadiums = group
    .filter((stadium) => [1, 2, 4, 5, 6].includes(stadium.group))
    .sort((s1, s2) => s2.capacity - s1.capacity);
  const fourMatchStadiums = group
    .filter((stadium) => [3, 7, 8].includes(stadium.group))
    .sort((s1, s2) => s2.capacity - s1.capacity);

  const hostStadiums = group
    .filter((stadium) => stadium.hostOpeningMatch)
    .sort((host1, host2) => {
      const host1Order = preferedHostOrder.findIndex(
        (host) => host === host1.hostOpeningMatch
      );
      const host2Order = preferedHostOrder.findIndex(
        (host) => host === host2.hostOpeningMatch
      );

      return host1Order - host2Order;
    });

  [s1, s3, s5] = hostStadiums;

  if (!s1) {
    [s1, s5] = threeMatchStadiums;
    [s3, s2, s4] = fourMatchStadiums;
  } else if (!s3) {
    if (threeMatchStadiums.includes(s1)) {
      [s3, s2, s4] = fourMatchStadiums;
      s5 = threeMatchStadiums.find((stadium) => stadium.name != s1?.name);
    } else {
      [s3, s4] = fourMatchStadiums.filter(
        (stadium) => stadium.name !== s1?.name
      );
      [s5, s2] = threeMatchStadiums;
    }
  } else if (!s5) {
    if (threeMatchStadiums.includes(s1) && threeMatchStadiums.includes(s3)) {
      [s5, s2, s4] = fourMatchStadiums;
    } else if (threeMatchStadiums.includes(s1)) {
      s5 = threeMatchStadiums.find((stadium) => stadium.name != s1?.name);
      [s2, s4] = fourMatchStadiums.filter(
        (stadium) => stadium.name !== s3?.name
      );
    } else if (threeMatchStadiums.includes(s3)) {
      s2 = threeMatchStadiums.find((stadium) => stadium.name != s3?.name);
      [s5, s4] = fourMatchStadiums.filter(
        (stadium) => stadium.name !== s1?.name
      );
    } else {
      s4 = fourMatchStadiums.find(
        (stadium) => stadium.name !== s1?.name && stadium.name !== s3?.name
      );
      [s5, s2] = threeMatchStadiums;
    }
  } else {
    if (threeMatchStadiums.includes(s1)) {
      [s2, s4] = fourMatchStadiums.filter(
        (stadium) => stadium.name !== s1?.name
      );
    } else {
      s2 = threeMatchStadiums.find((stadium) => stadium.name !== s1?.name);
      s4 = fourMatchStadiums.find(
        (stadium) => stadium.name !== s3?.name && stadium.name !== s5?.name
      );
    }
  }

  return [s1, s2, s3, s4, s5];
};

const arrangeStadiumsWithinGroup = (stadiums: IStadium[]) => {
  const [x, y] = [1, 2, 4, 5, 6].includes(stadiums[2].group) ? [5, 3] : [3, 5];

  return [
    [
      [1, 2],
      [x, 4],
      [y, x],
    ],
    [
      [x, [1, 2, 4, 5, 6].includes(stadiums[0].group) ? 2 : 1],
      [4, y],
      [2, 1],
    ],
    [
      [y, 4],
      [1, 2],
      [x, 4],
    ],
  ];
};

export const allocateStadiumGroups = (
  stadiumGroups: IStadium[][],
  preferedHostOrder: string[]
) => {
  const firstGroupHostNumber = stadiumGroups[0].filter(
    (stadium) => stadium.hostOpeningMatch
  ).length;

  const allocations =
    firstGroupHostNumber === 1
      ? [
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [8, 9, 10, 11],
        ]
      : firstGroupHostNumber === 2
      ? [
          [0, 2, 3, 4],
          [1, 5, 6, 7],
          [8, 9, 10, 11],
        ]
      : [
          [0, 1, 3, 5],
          [2, 6, 7, 8],
          [4, 9, 10, 11],
        ];

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

  swapMatches(3, 7);
  swapMatches(25, 45);

  return stadiums;
};

export const getWorldCupStadiums = async (
  gameplayId: string,
  code: string,
  gameplayType: "custom" | "north_america" | "centenario",
  preferedHostOrder: string[]
) => {
  const stadiums = await Stadium.find(
    gameplayType === "custom" ? { gameplayId } : { type: gameplayType }
  );

  if (code === "FIFA-INTERPO-SF") {
    const stadiumSemiFinal = stadiums
      .filter((stadium) => [3, 4].includes(stadium.group))
      .sort((s1, s2) => s1.group - s2.group);

    return stadiumSemiFinal;
  }
  if (code === "FIFA-INTERPO-F") {
    const stadiumFinal = stadiums.filter((stadium) =>
      [1, 2].includes(stadium.group)
    );

    return stadiumFinal;
  }

  const stadiumsGroup = mixClusterStadium(stadiums, preferedHostOrder);
  const stadiumsByMatch = allocateStadiumGroups(
    stadiumsGroup,
    preferedHostOrder
  );

  return stadiumsByMatch;
};
