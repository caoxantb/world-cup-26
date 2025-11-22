"use client";

import { useMemo, useState } from "react";

type MatchRecord = {
  date: string;
  team1: string;
  team2: string;
  team1Score?: number;
  team2Score?: number;
};

type MatchView = "last" | "next";

type MatchOutcome = "win" | "loss" | "draw" | "upcoming";

const matchHistory: MatchRecord[] = [
  {
    date: "2025-06-18",
    team1: "Vietnam",
    team2: "Thailand",
    team1Score: 2,
    team2Score: 1,
  },
  {
    date: "2025-03-26",
    team1: "Thailand",
    team2: "Vietnam",
    team1Score: 1,
    team2Score: 1,
  },
  {
    date: "2024-12-21",
    team1: "Vietnam",
    team2: "Thailand",
    team1Score: 0,
    team2Score: 2,
  },
  {
    date: "2024-07-14",
    team1: "Thailand",
    team2: "Vietnam",
    team1Score: 3,
    team2Score: 2,
  },
  {
    date: "2024-03-17",
    team1: "Vietnam",
    team2: "Thailand",
    team1Score: 1,
    team2Score: 0,
  },
  {
    date: "2023-10-29",
    team1: "Vietnam",
    team2: "Thailand",
    team1Score: 2,
    team2Score: 2,
  },
  {
    date: "2023-05-11",
    team1: "Thailand",
    team2: "Vietnam",
    team1Score: 0,
    team2Score: 1,
  },
  {
    date: "2023-01-27",
    team1: "Vietnam",
    team2: "Thailand",
    team1Score: 1,
    team2Score: 1,
  },
  {
    date: "2022-08-04",
    team1: "Thailand",
    team2: "Vietnam",
    team1Score: 2,
    team2Score: 0,
  },
  {
    date: "2022-05-10",
    team1: "Vietnam",
    team2: "Thailand",
    team1Score: 3,
    team2Score: 2,
  },
];

const upcomingMatches: MatchRecord[] = [
  {
    date: "2025-09-05",
    team1: "Vietnam",
    team2: "Japan",
  },
  {
    date: "2025-10-12",
    team1: "South Korea",
    team2: "Vietnam",
  },
  {
    date: "2025-11-18",
    team1: "Vietnam",
    team2: "Australia",
  },
  {
    date: "2026-01-22",
    team1: "Vietnam",
    team2: "Saudi Arabia",
  },
  {
    date: "2026-03-30",
    team1: "China",
    team2: "Vietnam",
  },
];

const outcomeStyles: Record<MatchOutcome, string> = {
  win: "bg-emerald-500 text-white",
  loss: "bg-rose-500 text-white",
  draw: "bg-amber-400 text-primary-foreground",
  upcoming: "bg-muted text-muted-foreground",
};

function getMatchOutcome(match: MatchRecord): MatchOutcome {
  if (
    typeof match.team1Score !== "number" ||
    typeof match.team2Score !== "number"
  ) {
    return "upcoming";
  }

  if (match.team1Score > match.team2Score) {
    return "win";
  }

  if (match.team1Score < match.team2Score) {
    return "loss";
  }

  return "draw";
}

export default function VersusHistory() {
  const [view, setView] = useState<MatchView>("last");

  const recordsToDisplay = useMemo(() => {
    const dataset = view === "last" ? matchHistory : upcomingMatches;
    return dataset.slice(0, 5);
  }, [view]);

  const toggleOptions: { label: string; value: MatchView }[] = [
    { label: "Last 5", value: "last" },
    { label: "Next 5", value: "next" },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Matches
          </p>
          <div className="inline-flex rounded-full border border-border p-1 text-[0.65rem] uppercase tracking-[0.2em] sm:text-xs">
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
        <div className="mt-6 space-y-2 h-72 overflow-y-hidden">
          {recordsToDisplay.map((match) => {
            const outcome = getMatchOutcome(match);
            const hasScore =
              typeof match.team1Score === "number" &&
              typeof match.team2Score === "number";

            return (
              <div
                key={`${match.date}-${match.team1}-${match.team2}`}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm"
              >
                <span
                  className={`h-6 w-6 rounded-full col-span-1 mx-auto flex items-center justify-center ${outcomeStyles[outcome]}`}
                >
                  H
                </span>
                <span className="text-center text-base font-semibold tracking-wide text-muted-foreground col-span-2">
                  {hasScore
                    ? `${match.team1Score} - ${match.team2Score}`
                    : "vs"}
                </span>
                <span className="font-semibold text-left uppercase tracking-tight col-span-6 truncate">
                  UNITED STATES OF AMERICA
                </span>
                <span className="font-medium text-right text-muted-foreground whitespace-nowrap col-span-3">
                  {new Date(match.date).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "2-digit",
                  })}{" "}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
