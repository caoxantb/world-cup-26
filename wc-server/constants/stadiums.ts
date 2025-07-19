export const getStadiums = (code: string, idx: number) => {
  const STADIUMS: { [key: string]: string[] } = {
    "AFC-4th": [
      "Lusail Stadium, Lusail",
      "Lusail Stadium, Lusail",
      "Lusail Stadium, Lusail",
      "Beijing National Stadium, Beijing",
      "Beijing National Stadium, Beijing",
      "Beijing National Stadium, Beijing",
    ],
    "CAF-PO-SF": [
      "Stade Mohammed V, Casablanca",
      "Misr Stadium, New Administrative Capital",
      "5 July 1962 Stadium, Algiers",
      "Hammadi Agrebi Olympic Stadium, Tunis",
    ],
    "CAF-PO-F": [
      "Misr Stadium, New Administrative Capital",
      "Stade Mohammed V, Casablanca",
    ],
    "OFC-PRE-SF": [
      "Wellington Regional Stadium, Wellington",
      "North Harbour Stadium, Albany",
    ],
    "OFC-PRE-F": ["North Harbour Stadium, Albany"],
    "OFC-1st": [
      "Forsyth Barr Stadium, Dunedin",
      "North Harbour Stadium, Albany",
      "Forsyth Barr Stadium, Dunedin",
      "North Harbour Stadium, Albany",
      "Forsyth Barr Stadium, Dunedin",
      "North Harbour Stadium, Albany",
      "Go Media Stadium, Auckland",
      "Wellington Regional Stadium, Wellington",
      "Go Media Stadium, Auckland",
      "Wellington Regional Stadium, Wellington",
      "Go Media Stadium, Auckland",
      "Wellington Regional Stadium, Wellington",
    ],
    "OFC-2nd": [
      "Wellington Regional Stadium, Wellington",
      "North Harbour Stadium, Albany",
    ],
    "OFC-3rd": ["North Harbour Stadium, Albany"],
    "UEFA-NL-SF": ["Stade de France, Saint-Denis", "Camp Nou, Barcelona"],
    "UEFA-NL-3P": ["Olympiastadion Berlin, Berlin"],
    "UEFA-NL-F": ["Wembley Stadium, London"],
    "UEFA-PO-SF": [
      "Parken Stadium, Copenhagen",
      "Estádio da Luz, Lisbon",
      "Johan Cruijff ArenA, Amsterdam",
      "Ernst-Happel-Stadion, Vienna",
      "Stadio Olimpico, Rome",
      "Ferenc Puskás Stadium, Budapest",
      "Atatürk Olympic Stadium, Istanbul",
      "Cardiff City Stadium, Cardiff",
    ],
    "UEFA-PO-F": [
      "Stade de France, Saint-Denis",
      "Camp Nou, Barcelona",
      "Wembley Stadium, London",
      "Olympiastadion Berlin, Berlin",
    ],
  };

  return STADIUMS[code][idx];
};
