import math
import numpy as np
import pandas as pd
import random
from datetime import datetime
import time

df_matches = pd.read_csv('cleaned/filtered-matches.csv', encoding="utf-8")
df_rankings = pd.read_csv('cleaned/fifa-rankings.csv', encoding="utf-8")
df_matches = df_matches[df_matches['date'].apply(
    lambda x: datetime.strptime(x, '%Y-%m-%d')
) > datetime(2006, 7, 9)]

def get_current_rank(team):
    rank = df_rankings.loc[(df_rankings["country_full"] == team) & (df_rankings["rank_date"] == "2023-06-29"), 'rank'].values[0]
    return rank

def calc_linear(team):
    home_results = df_matches.loc[df_matches['home_team'] == team,
                                  ['home_score', 'home_team_rank', 'away_team_rank']].values
    away_results = df_matches.loc[df_matches['away_team'] == team,
                                  ['away_score', 'away_team_rank', 'home_team_rank']].values
    results = list(map(lambda x: [x[0], x[1] - x[2]], [*home_results, *away_results]))
    results_transpose = np.array(results).T

    parameters = np.polyfit(results_transpose[1], results_transpose[0], 1)

    return parameters

def calc_poisson(team, rank_diff):
    [a, b] = calc_linear(team)
    avg = rank_diff*a + b
    
    dist = [(avg**k)*np.exp(-avg)/math.factorial(k) for k in range(0, 20)]

    return dist

def compute_score(team1, team2, is_extra_time=False):
    team1_rank = get_current_rank(team1)
    team2_rank = get_current_rank(team2)

    team1_dist = calc_poisson(team1, team1_rank - team2_rank)
    team2_dist = calc_poisson(team2, team2_rank - team1_rank)

    team1_score = random.choices(range(0, 20), team1_dist)[0]
    team2_score = random.choices(range(0, 20), team2_dist)[0]

    if (is_extra_time):
        team1_score = round(team1_score / 3)
        team2_score = round(team2_score / 3)
    
    print(f"{team1} {team1_score} - {team2_score} {team2}")

def penalty(team1, team2):
    kick_first = round(random.random())
    if kick_first:
        team1, team2 = team2, team1

    team1_round, team2_round, team1_score, team2_score = 0, 0, 0, 0

    while True:
        team1_round += 1
        input()
        print(f"Round {team1_round}")
        is_goal = random.choices(range(0, 2), [25, 75])[0]
        team1_score += is_goal
        input()
        print(f"{team1} {'scored' if is_goal else 'missed'}. Score: {team1_score} - {team2_score}")
        if team2_round < 5 and (5 - team1_round + team1_score < team2_score or 5 - team2_round + team2_score < team1_score):
            print(f"Final score: {team1} {team1_score} - {team2_score} {team2}")
            return 
        team2_round += 1
        is_goal = random.choices(range(0, 2), [25, 75])[0]
        team2_score += is_goal
        input()
        print(f"{team2} {'scored' if is_goal else 'missed'}. Score: {team1_score} - {team2_score}")
        if team2_round < 5 and (5 - team1_round + team1_score < team2_score or 5 - team2_round + team2_score < team1_score):
            print(f"Final score: {team1} {team1_score} - {team2_score} {team2}")
            return 
        if team2_round >= 5 and team1_score - team2_score != 0:
            print(f"Final score: {team1} {team1_score} - {team2_score} {team2}")
            return
        

def group(team1, team2, team3, team4):
    compute_score(team1, team2)
    compute_score(team3, team4)
    input()
    compute_score(team1, team3)
    compute_score(team2, team4)
    input()
    compute_score(team1, team4)
    compute_score(team2, team3)

compute_score("Mexico", "Belgium")