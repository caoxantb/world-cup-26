export const linearFit = (xGoalData: {
  numberOfDataPoints: number;
  sumRankDiff: number;
  sumGoalsScored: number;
  sumGoalsConceded: number;
  sumRankDiffSquare: number;
  sumDotScored: number;
  sumDotConceded: number;
}) => {
  const {
    numberOfDataPoints,
    sumRankDiff,
    sumGoalsScored,
    sumGoalsConceded,
    sumRankDiffSquare,
    sumDotScored,
    sumDotConceded,
  } = xGoalData;

  const meanRankDiff = sumRankDiff / numberOfDataPoints;
  const meanGoalsScored = sumGoalsScored / numberOfDataPoints;
  const meanGoalsConceded = sumGoalsConceded / numberOfDataPoints;

  const w1 =
    (sumDotScored - meanGoalsScored * sumRankDiff) /
    (sumRankDiffSquare - meanRankDiff * sumRankDiff);
  const b1 = meanGoalsScored - w1 * meanRankDiff;

  const w2 =
    (sumDotConceded - meanGoalsConceded * sumRankDiff) /
    (sumRankDiffSquare - meanRankDiff * sumRankDiff);
  const b2 = meanGoalsConceded - w2 * meanRankDiff;

  return [
    [w1, b1],
    [w2, b2],
  ];
};
