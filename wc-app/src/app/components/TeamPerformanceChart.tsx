"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type RankingPoint = {
  year: number;
  ranking: number;
};

type WorldCupPoint = {
  year: number;
  placement: number;
  label: string;
};

const rankingHistory: RankingPoint[] = [
  { year: 2010, ranking: 1 },
  { year: 2012, ranking: 1 },
  { year: 2014, ranking: 2 },
  { year: 2016, ranking: 1 },
  { year: 2018, ranking: 1 },
  { year: 2020, ranking: 1 },
  { year: 2022, ranking: 1 },
  { year: 2023, ranking: 2 },
  { year: 2024, ranking: 6 },
  { year: 2010, ranking: 12 },
  { year: 2012, ranking: 15 },
  { year: 2014, ranking: 38 },
  { year: 2016, ranking: 1 },
  { year: 2018, ranking: 22 },
  { year: 2020, ranking: 1 },
  { year: 2022, ranking: 9 },
  { year: 2023, ranking: 3 },
  { year: 2024, ranking: 1 },
];

const worldCupPlacements: WorldCupPoint[] = [
  { year: 1990, placement: 8, label: "Group stage" },
  { year: 1994, placement: 7, label: "Round of 16" },
  { year: 1998, placement: 7, label: "Round of 16" },
  { year: 2002, placement: 7, label: "Round of 16" },
  { year: 2006, placement: 6, label: "Quarter-finals" },
  { year: 2010, placement: 5, label: "Semi-finals" },
  { year: 2014, placement: 4, label: "Fourth place" },
  { year: 2018, placement: 3, label: "Third place" },
  { year: 2022, placement: 2, label: "Runner-up" },
  { year: 1990, placement: 8, label: "Group stage" },
  { year: 1994, placement: 7, label: "Round of 16" },
  { year: 1998, placement: 7, label: "Round of 16" },
  { year: 2002, placement: 7, label: "Round of 16" },
  { year: 2006, placement: 6, label: "Quarter-finals" },
  { year: 2010, placement: 5, label: "Semi-finals" },
  { year: 2014, placement: 4, label: "Fourth place" },
  { year: 2018, placement: 3, label: "Third place" },
  { year: 2022, placement: 2, label: "Runner-up" },
];

type PeriodFilter = "1y" | "3y" | "5y" | "all";

const periodConfig: {
  value: PeriodFilter;
  label: string;
  years?: number;
}[] = [
  { value: "1y", label: "1 year", years: 1 },
  { value: "3y", label: "3 years", years: 3 },
  { value: "5y", label: "5 years", years: 5 },
  { value: "all", label: "All time" },
];

type ChartView = "ranking" | "worldcup";

const chartConfig: ChartConfig = {
  ranking: {
    label: "Ranking",
    color: "#111111",
  },
  placement: {
    label: "Placement",
    color: "#1d4ed8",
  },
};

export default function TeamPerformanceChart() {
  const [view, setView] = useState<ChartView>("ranking");
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const dataset = useMemo(
    () => (view === "ranking" ? rankingHistory : worldCupPlacements),
    [view]
  );

  const filteredData = useMemo(() => {
    if (period === "all" || view === "worldcup") {
      return dataset;
    }

    const selected = periodConfig.find((option) => option.value === period);
    if (!selected || !selected.years || dataset.length === 0) {
      return dataset;
    }

    const windowStart = dataset[dataset.length - 1].year - (selected.years - 1);
    return dataset.filter((point) => point.year >= windowStart);
  }, [dataset, period, view]);

  const yAxisProps =
    view === "ranking"
      ? {
          domain: [0, 50],
          ticks: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50], // exact intervals
          reversed: true,
          tickFormatter: (value: number) =>
            value === 0 ? "1" : value.toString(),
        }
      : {
          domain: [1, 8],
          reversed: true,
          ticks: [1, 2, 3, 4, 5, 6, 7, 8],
          tickFormatter: (_value: number) => "1",
        };

  const horizontalGuides = useMemo(() => {
    if (view === "ranking") {
      return [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    }
    return [1, 2, 3, 4, 5, 6, 7, 8];
  }, [view]);

  const toggleOptions: { label: string; value: ChartView }[] = [
    { label: "FIFA rankings", value: "ranking" },
    { label: "World Cup runs", value: "worldcup" },
  ];

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            form tracker
          </p>
          <h2 className="text-2xl font-semibold">
            {view === "ranking" ? "FIFA rankings" : "World Cup runs"}
          </h2>
        </div>
        <div className="inline-flex rounded-full border border-border p-1 text-[0.7rem] uppercase tracking-[0.15em] sm:text-xs">
          {toggleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              className={`rounded-full px-3 py-1 transition ${
                view === option.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === "ranking" && (
        <div className="flex flex-wrap gap-2">
          {periodConfig.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                period === option.value
                  ? "bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <ChartContainer
        config={chartConfig}
        className="h-[320px] w-full rounded-2xl border border-transparent bg-transparent p-0 text-xs"
      >
        <LineChart data={filteredData} margin={{ left: 16, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            stroke="currentColor"
            tickFormatter={(value: number) => `${value}`}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis
            {...yAxisProps}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            width={40}
            padding={{ top: 12, bottom: 12 }}
          />
          {horizontalGuides.map((value) => (
            <ReferenceLine
              key={`guide-${value}`}
              y={value}
              stroke="currentColor"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />
          ))}
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(value) => `Year ${value}`}
              />
            }
          />
          <Line
            type="monotone"
            dataKey={view === "ranking" ? "ranking" : "placement"}
            stroke="currentColor"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
