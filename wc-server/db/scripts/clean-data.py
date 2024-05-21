import numpy as np
import pandas as pd
from datetime import datetime
from collections import Counter

UPDATED_NAMES = {
    "Turkey": "Türkiye", "St. Kitts and Nevis": "Saint Kitts and Nevis", "Curacao": "Curaçao", "Sao Tome e Principe": "São Tomé and Príncipe",
    "FYR Macedonia": "North Macedonia", "Czech Republic": "Czechia", "St. Vincent and the Grenadines": "Saint Vincent and the Grenadines",
    "Swaziland": "Eswatini", "Gambia": "The Gambia", "St. Lucia": "Saint Lucia", "Cape Verde Islands": "Cabo Verde",
    "Serbia and Montenegro": "Serbia", "Netherlands Antilles": "Curaçao", "Yugoslavia": "Serbia", "Zaire": "Congo DR", "Czechoslovakia": "Czechia",
    "St. Vincent / Grenadines": "Saint Vincent and the Grenadines", "USA": "United States", "South Korea": "Korea Republic", "DR Congo": "Congo DR",
    "Kyrgyzstan": "Kyrgyz Republic", "US Virgin Islands": "United States Virgin Islands", "Cape Verde": "Cabo Verde",
    "St Vincent and the Grenadines": "Saint Vincent and the Grenadines", "Taiwan": "Chinese Taipei", "Brunei": "Brunei Darussalam",
    "North Korea": "Korea DPR", "St Lucia": "Saint Lucia", "Iran": "IR Iran", "St Kitts and Nevis": "Saint Kitts and Nevis", "The Gambia": "Gambia",
    "São Tomé e Príncipe": "São Tomé and Príncipe", "Ivory Coast": "Côte d'Ivoire", "Vietnam Republic": "Vietnam"
}

UPDATED_CODES = {
    "SCG": "SRB",
    "ANT": "CUW",
    "TCH": "CZE",
    "YUG": "SRB",
    "ZAI": "COD",
    "LIB": "LBN"
}


def update_data():
    for name in UPDATED_NAMES:
        df_rankings.loc[df_rankings["country_full"] ==
                        name, "country_full"] = UPDATED_NAMES[name]
        df_matches.loc[df_matches["home_team"] ==
                       name, "home_team"] = UPDATED_NAMES[name]
        df_matches.loc[df_matches["away_team"] ==
                       name, "away_team"] = UPDATED_NAMES[name]

    for code in UPDATED_CODES:
        df_rankings.loc[df_rankings["country_abrv"] ==
                        code, "country_abrv"] = UPDATED_CODES[code]


def clean_rankings(df_rankings):
    df_rankings = df_rankings[df_rankings['rank_date'].apply(
        lambda x: datetime.strptime(x, '%Y-%m-%d')
    ) < datetime(2023, 7, 20)]

    for date in all_dates:
        data = df_rankings[df_rankings['rank_date'] == date]
        duplicate_items = [k
                           for k, v in Counter(data['country_full']).items()
                           if v > 1]
        duplicate_indexes = df_rankings.index[(df_rankings['country_full'].isin(duplicate_items))
                                              & (df_rankings['rank_date'] == date)].tolist()
        if duplicate_indexes:
            indexes_transform = list(map(
                lambda i: 0 if df_rankings.loc[i,
                                               "previous_points"] == 0 else 1,
                duplicate_indexes
            ))
            if not np.any(indexes_transform):
                indexes_to_drop = duplicate_indexes[1:]
            else:
                first_non_zero_index = np.argmax(indexes_transform != 0)
                indexes_to_drop = duplicate_indexes[:first_non_zero_index] + \
                    duplicate_indexes[first_non_zero_index + 1:]

            df_rankings = df_rankings.drop(indexes_to_drop)

    return df_rankings


def clean_matches(df_matches):
    df_matches = df_matches[df_matches['date'].apply(
        lambda x: datetime.strptime(x, '%Y-%m-%d')
    ) < datetime(2023, 7, 20)]

    matches_teams_set = set(df_matches['home_team']) & set(
        df_matches['away_team'])
    rankings_teams_set = set(df_rankings["country_full"])
    non_exist_teams = matches_teams_set - rankings_teams_set

    df_matches = df_matches[~df_matches["home_team"].isin(
        non_exist_teams) & ~df_matches["away_team"].isin(non_exist_teams)]

    return df_matches


def transform_teams_rankings(row, isHomeTeam=True):
    date = datetime.strptime(row["date"], '%Y-%m-%d')
    if date < datetime(1992, 12, 31) or date >= datetime(2023, 7, 20):
        return None

    left = 0
    right = len(all_dates) - 1
    closest_index = 0

    while left <= right:
        mid = left + (right - left) // 2
        if all_dates[mid] == row["date"]:
            closest_index = mid
            break
        elif datetime.strptime(all_dates[mid], '%Y-%m-%d') < date:
            closest_index = mid
            left = mid + 1
        else:
            right = mid - 1

    homeTeamStatus = "home_team" if isHomeTeam else "away_team"
    rank_date = all_dates[closest_index]
    try:
        rank = cleaned_rankings.loc[(row[homeTeamStatus], rank_date)]["rank"]
    except:
        return None
    return rank


def apply_rankings_to_matches(matches):
    matches["home_team_rank"] = matches.apply(
        transform_teams_rankings, axis=1)
    matches["away_team_rank"] = matches.apply(
        lambda row: transform_teams_rankings(row, isHomeTeam=False), axis=1)

    matches_filtered = matches[~matches["home_team_rank"].isna()
                               & ~matches["away_team_rank"].isna()]
    
    matches_filtered = matches_filtered[matches_filtered['date'].apply(
        lambda x: datetime.strptime(x, '%Y-%m-%d')
    ) >= datetime(2006, 6, 9)]

    matches_filtered['home_team_rank'] = matches_filtered['home_team_rank'].astype(
        int)
    matches_filtered['away_team_rank'] = matches_filtered['away_team_rank'].astype(
        int)

    return matches_filtered


if __name__ == "__main__":
    df_matches = pd.read_csv('db/backup/matches.csv', encoding="utf-8")
    df_rankings = pd.read_csv('db/backup/fifa-ranking.csv', encoding="utf-8")
    all_dates = list(df_rankings['rank_date'].unique())[:-1]

    update_data()
    cleaned_rankings = clean_rankings(df_rankings)
    cleaned_rankings_copy = cleaned_rankings.copy()
    cleaned_rankings.set_index(["country_full", "rank_date"], inplace=True)
    cleaned_matches = clean_matches(df_matches)
    filtered_matches = apply_rankings_to_matches(cleaned_matches)

    cleaned_rankings_copy.to_csv("db/cleaned/fifa-rankings.csv", index=False)
    cleaned_matches.to_csv("db/cleaned/full-matches.csv", index=False)
    filtered_matches.to_csv("db/cleaned/filtered-matches.csv", index=False)
