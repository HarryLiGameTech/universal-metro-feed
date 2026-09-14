// Generated from the official MTA static GTFS files. Do not edit by hand.
import type { Route, Station } from "../types";

export const routes: Record<string, Route> = {
  "1": {
    "id": "1",
    "name": "Broadway - 7 Avenue Local",
    "color": "#D82233",
    "textColor": "#FFFFFF"
  },
  "2": {
    "id": "2",
    "name": "7 Avenue Express",
    "color": "#D82233",
    "textColor": "#FFFFFF"
  },
  "3": {
    "id": "3",
    "name": "7 Avenue Express",
    "color": "#D82233",
    "textColor": "#FFFFFF"
  },
  "4": {
    "id": "4",
    "name": "Lexington Avenue Express",
    "color": "#009952",
    "textColor": "#FFFFFF"
  },
  "5": {
    "id": "5",
    "name": "Lexington Avenue Express",
    "color": "#009952",
    "textColor": "#FFFFFF"
  },
  "6": {
    "id": "6",
    "name": "Lexington Avenue Local",
    "color": "#009952",
    "textColor": "#FFFFFF"
  },
  "7": {
    "id": "7",
    "name": "Flushing Local",
    "color": "#9A38A1",
    "textColor": "#FFFFFF"
  },
  "A": {
    "id": "A",
    "name": "8 Avenue Express",
    "color": "#0062CF",
    "textColor": "#FFFFFF"
  },
  "C": {
    "id": "C",
    "name": "8 Avenue Local",
    "color": "#0062CF",
    "textColor": "#FFFFFF"
  },
  "E": {
    "id": "E",
    "name": "8 Avenue Local",
    "color": "#0062CF",
    "textColor": "#FFFFFF"
  },
  "B": {
    "id": "B",
    "name": "6 Avenue Express",
    "color": "#EB6800",
    "textColor": "#FFFFFF"
  },
  "D": {
    "id": "D",
    "name": "6 Avenue Express",
    "color": "#EB6800",
    "textColor": "#FFFFFF"
  },
  "F": {
    "id": "F",
    "name": "Queens Blvd Express/6 Av Local",
    "color": "#EB6800",
    "textColor": "#FFFFFF"
  },
  "FX": {
    "id": "FX",
    "name": "Brooklyn F Express",
    "color": "#EB6800",
    "textColor": "#FFFFFF"
  },
  "M": {
    "id": "M",
    "name": "Queens Blvd Local/6 Av Local",
    "color": "#EB6800",
    "textColor": "#FFFFFF"
  },
  "G": {
    "id": "G",
    "name": "Brooklyn-Queens Crosstown",
    "color": "#799534",
    "textColor": "#FFFFFF"
  },
  "J": {
    "id": "J",
    "name": "Nassau St Local",
    "color": "#8E5C33",
    "textColor": "#FFFFFF"
  },
  "Z": {
    "id": "Z",
    "name": "Nassau St Express",
    "color": "#8E5C33",
    "textColor": "#FFFFFF"
  },
  "L": {
    "id": "L",
    "name": "14 St-Canarsie Local",
    "color": "#7C858C",
    "textColor": "#FFFFFF"
  },
  "N": {
    "id": "N",
    "name": "Broadway Local",
    "color": "#F6BC26",
    "textColor": "#000000"
  },
  "Q": {
    "id": "Q",
    "name": "Broadway Express",
    "color": "#F6BC26",
    "textColor": "#000000"
  },
  "R": {
    "id": "R",
    "name": "Broadway Local",
    "color": "#F6BC26",
    "textColor": "#000000"
  },
  "W": {
    "id": "W",
    "name": "Broadway Local",
    "color": "#F6BC26",
    "textColor": "#000000"
  },
  "GS": {
    "id": "GS",
    "name": "42 St Shuttle",
    "color": "#7C858C",
    "textColor": "#FFFFFF"
  },
  "FS": {
    "id": "FS",
    "name": "Franklin Avenue Shuttle",
    "color": "#7C858C",
    "textColor": "#FFFFFF"
  },
  "H": {
    "id": "H",
    "name": "Rockaway Park Shuttle",
    "color": "#7C858C",
    "textColor": "#FFFFFF"
  },
  "6X": {
    "id": "6X",
    "name": "Pelham Bay Park Express",
    "color": "#009952",
    "textColor": "#FFFFFF"
  },
  "7X": {
    "id": "7X",
    "name": "Flushing Express",
    "color": "#9A38A1",
    "textColor": "#FFFFFF"
  },
  "SI": {
    "id": "SI",
    "name": "Staten Island Railway",
    "color": "#08179C",
    "textColor": "#FFFFFF"
  }
};

export const stations: readonly Station[] = [
  {
    "id": "L06",
    "name": "1 Av",
    "latitude": 40.730953,
    "longitude": -73.981628,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "119",
    "name": "103 St",
    "latitude": 40.799446,
    "longitude": -73.968379,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "624",
    "name": "103 St",
    "latitude": 40.7906,
    "longitude": -73.947478,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A18",
    "name": "103 St",
    "latitude": 40.796092,
    "longitude": -73.961454,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "706",
    "name": "103 St-Corona Plaza",
    "latitude": 40.749865,
    "longitude": -73.8627,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A63",
    "name": "104 St",
    "latitude": 40.681711,
    "longitude": -73.837683,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J14",
    "name": "104 St",
    "latitude": 40.695178,
    "longitude": -73.84433,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "623",
    "name": "110 St",
    "latitude": 40.79502,
    "longitude": -73.94425,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "227",
    "name": "110 St-Malcolm X Plaza",
    "latitude": 40.799075,
    "longitude": -73.951822,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "705",
    "name": "111 St",
    "latitude": 40.75173,
    "longitude": -73.855334,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A64",
    "name": "111 St",
    "latitude": 40.684331,
    "longitude": -73.832163,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J13",
    "name": "111 St",
    "latitude": 40.697418,
    "longitude": -73.836345,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "226",
    "name": "116 St",
    "latitude": 40.802098,
    "longitude": -73.949625,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "622",
    "name": "116 St",
    "latitude": 40.798629,
    "longitude": -73.941617,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A16",
    "name": "116 St",
    "latitude": 40.805085,
    "longitude": -73.954882,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "117",
    "name": "116 St-Columbia University",
    "latitude": 40.807722,
    "longitude": -73.96411,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J12",
    "name": "121 St",
    "latitude": 40.700492,
    "longitude": -73.828294,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "116",
    "name": "125 St",
    "latitude": 40.815581,
    "longitude": -73.958372,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "225",
    "name": "125 St",
    "latitude": 40.807754,
    "longitude": -73.945495,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "621",
    "name": "125 St",
    "latitude": 40.804138,
    "longitude": -73.937594,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A15",
    "name": "125 St",
    "latitude": 40.811109,
    "longitude": -73.952343,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "224",
    "name": "135 St",
    "latitude": 40.814229,
    "longitude": -73.94077,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A14",
    "name": "135 St",
    "latitude": 40.817894,
    "longitude": -73.947649,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "115",
    "name": "137 St-City College",
    "latitude": 40.822008,
    "longitude": -73.953676,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "416",
    "name": "138 St-Grand Concourse",
    "latitude": 40.813224,
    "longitude": -73.929849,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "132",
    "name": "14 St",
    "latitude": 40.737826,
    "longitude": -74.000201,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A31",
    "name": "14 St",
    "latitude": 40.740893,
    "longitude": -74.00169,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D19",
    "name": "14 St",
    "latitude": 40.738228,
    "longitude": -73.996209,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "635",
    "name": "14 St-Union Sq",
    "latitude": 40.734673,
    "longitude": -73.989951,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L03",
    "name": "14 St-Union Sq",
    "latitude": 40.734789,
    "longitude": -73.99073,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R20",
    "name": "14 St-Union Sq",
    "latitude": 40.735736,
    "longitude": -73.990568,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "114",
    "name": "145 St",
    "latitude": 40.826551,
    "longitude": -73.95036,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "302",
    "name": "145 St",
    "latitude": 40.820421,
    "longitude": -73.936245,
    "routes": [
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A12",
    "name": "145 St",
    "latitude": 40.824783,
    "longitude": -73.944216,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D13",
    "name": "145 St",
    "latitude": 40.824783,
    "longitude": -73.944216,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "222",
    "name": "149 St-Hostos",
    "latitude": 40.81841,
    "longitude": -73.926718,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "415",
    "name": "149 St-Hostos",
    "latitude": 40.818375,
    "longitude": -73.927351,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F25",
    "name": "15 St-Prospect Park",
    "latitude": 40.660365,
    "longitude": -73.979493,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A11",
    "name": "155 St",
    "latitude": 40.830518,
    "longitude": -73.941514,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D12",
    "name": "155 St",
    "latitude": 40.830135,
    "longitude": -73.938209,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "113",
    "name": "157 St",
    "latitude": 40.834041,
    "longitude": -73.94489,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "414",
    "name": "161 St-Yankee Stadium",
    "latitude": 40.827994,
    "longitude": -73.925831,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D11",
    "name": "161 St-Yankee Stadium",
    "latitude": 40.827905,
    "longitude": -73.925651,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A10",
    "name": "163 St-Amsterdam Av",
    "latitude": 40.836013,
    "longitude": -73.939892,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "413",
    "name": "167 St",
    "latitude": 40.835537,
    "longitude": -73.9214,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D10",
    "name": "167 St",
    "latitude": 40.833771,
    "longitude": -73.91844,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A09",
    "name": "168 St",
    "latitude": 40.840719,
    "longitude": -73.939561,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "112",
    "name": "168 St-Washington Hts",
    "latitude": 40.840556,
    "longitude": -73.940133,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F02",
    "name": "169 St",
    "latitude": 40.71047,
    "longitude": -73.793604,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "412",
    "name": "170 St",
    "latitude": 40.840075,
    "longitude": -73.917791,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D09",
    "name": "170 St",
    "latitude": 40.839306,
    "longitude": -73.9134,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "215",
    "name": "174 St",
    "latitude": 40.837288,
    "longitude": -73.887734,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D08",
    "name": "174-175 Sts",
    "latitude": 40.8459,
    "longitude": -73.910136,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A07",
    "name": "175 St",
    "latitude": 40.847391,
    "longitude": -73.939704,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "410",
    "name": "176 St",
    "latitude": 40.84848,
    "longitude": -73.911794,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B19",
    "name": "18 Av",
    "latitude": 40.607954,
    "longitude": -74.001736,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F30",
    "name": "18 Av",
    "latitude": 40.629755,
    "longitude": -73.976971,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N05",
    "name": "18 Av",
    "latitude": 40.620671,
    "longitude": -73.990414,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "131",
    "name": "18 St",
    "latitude": 40.74104,
    "longitude": -73.997871,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "111",
    "name": "181 St",
    "latitude": 40.849505,
    "longitude": -73.933596,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A06",
    "name": "181 St",
    "latitude": 40.851695,
    "longitude": -73.937969,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D06",
    "name": "182-183 Sts",
    "latitude": 40.856093,
    "longitude": -73.900741,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "408",
    "name": "183 St",
    "latitude": 40.858407,
    "longitude": -73.903879,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A05",
    "name": "190 St",
    "latitude": 40.859022,
    "longitude": -73.93418,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "110",
    "name": "191 St",
    "latitude": 40.855225,
    "longitude": -73.929412,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F14",
    "name": "2 Av",
    "latitude": 40.723402,
    "longitude": -73.989938,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B20",
    "name": "20 Av",
    "latitude": 40.604556,
    "longitude": -73.998168,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N06",
    "name": "20 Av",
    "latitude": 40.61741,
    "longitude": -73.985026,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "108",
    "name": "207 St",
    "latitude": 40.864621,
    "longitude": -73.918822,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G24",
    "name": "21 St",
    "latitude": 40.744065,
    "longitude": -73.949724,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B04",
    "name": "21 St-Queensbridge",
    "latitude": 40.754203,
    "longitude": -73.942836,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "107",
    "name": "215 St",
    "latitude": 40.869444,
    "longitude": -73.915279,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "207",
    "name": "219 St",
    "latitude": 40.883895,
    "longitude": -73.862633,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "206",
    "name": "225 St",
    "latitude": 40.888022,
    "longitude": -73.860341,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "130",
    "name": "23 St",
    "latitude": 40.744081,
    "longitude": -73.995657,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A30",
    "name": "23 St",
    "latitude": 40.745906,
    "longitude": -73.998041,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D18",
    "name": "23 St",
    "latitude": 40.742878,
    "longitude": -73.992821,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R19",
    "name": "23 St",
    "latitude": 40.741303,
    "longitude": -73.989344,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "634",
    "name": "23 St-Baruch College",
    "latitude": 40.739864,
    "longitude": -73.986599,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "104",
    "name": "231 St",
    "latitude": 40.878856,
    "longitude": -73.904834,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "205",
    "name": "233 St",
    "latitude": 40.893193,
    "longitude": -73.857473,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "103",
    "name": "238 St",
    "latitude": 40.884667,
    "longitude": -73.90087,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B22",
    "name": "25 Av",
    "latitude": 40.597704,
    "longitude": -73.986829,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R35",
    "name": "25 St",
    "latitude": 40.660397,
    "longitude": -73.998091,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "129",
    "name": "28 St",
    "latitude": 40.747215,
    "longitude": -73.993365,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "633",
    "name": "28 St",
    "latitude": 40.74307,
    "longitude": -73.984264,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R18",
    "name": "28 St",
    "latitude": 40.745494,
    "longitude": -73.988691,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L05",
    "name": "3 Av",
    "latitude": 40.732849,
    "longitude": -73.986122,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "619",
    "name": "3 Av-138 St",
    "latitude": 40.810476,
    "longitude": -73.926138,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "221",
    "name": "3 Av-149 St",
    "latitude": 40.816109,
    "longitude": -73.917757,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R04",
    "name": "30 Av",
    "latitude": 40.766779,
    "longitude": -73.921479,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "632",
    "name": "33 St",
    "latitude": 40.746081,
    "longitude": -73.982076,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "716",
    "name": "33 St-Rawson St",
    "latitude": 40.744587,
    "longitude": -73.930997,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D17",
    "name": "34 St-Herald Sq",
    "latitude": 40.749719,
    "longitude": -73.987823,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R17",
    "name": "34 St-Herald Sq",
    "latitude": 40.749567,
    "longitude": -73.98795,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "726",
    "name": "34 St-Hudson Yards",
    "latitude": 40.755882,
    "longitude": -74.00191,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "128",
    "name": "34 St-Penn Station",
    "latitude": 40.750373,
    "longitude": -73.991057,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A28",
    "name": "34 St-Penn Station",
    "latitude": 40.752287,
    "longitude": -73.993391,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R06",
    "name": "36 Av",
    "latitude": 40.756804,
    "longitude": -73.929575,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G20",
    "name": "36 St",
    "latitude": 40.752039,
    "longitude": -73.928781,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R36",
    "name": "36 St",
    "latitude": 40.655144,
    "longitude": -74.003549,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R08",
    "name": "39 Av-Dutch Kills",
    "latitude": 40.752882,
    "longitude": -73.932755,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F23",
    "name": "4 Av-9 St",
    "latitude": 40.670272,
    "longitude": -73.989779,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R33",
    "name": "4 Av-9 St",
    "latitude": 40.670847,
    "longitude": -73.988302,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "715",
    "name": "40 St-Lowery St",
    "latitude": 40.743781,
    "longitude": -73.924016,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D16",
    "name": "42 St-Bryant Pk",
    "latitude": 40.754222,
    "longitude": -73.984569,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A27",
    "name": "42 St-Port Authority Bus Terminal",
    "latitude": 40.757308,
    "longitude": -73.989735,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R39",
    "name": "45 St",
    "latitude": 40.648939,
    "longitude": -74.010006,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G18",
    "name": "46 St",
    "latitude": 40.756312,
    "longitude": -73.913333,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "714",
    "name": "46 St-Bliss St",
    "latitude": 40.743132,
    "longitude": -73.918435,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D15",
    "name": "47-50 Sts-Rockefeller Ctr",
    "latitude": 40.758663,
    "longitude": -73.981329,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R15",
    "name": "49 St",
    "latitude": 40.759901,
    "longitude": -73.984139,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "724",
    "name": "5 Av",
    "latitude": 40.753821,
    "longitude": -73.981963,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F12",
    "name": "5 Av/53 St",
    "latitude": 40.760167,
    "longitude": -73.975224,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R13",
    "name": "5 Av/59 St",
    "latitude": 40.764811,
    "longitude": -73.973347,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "126",
    "name": "50 St",
    "latitude": 40.761728,
    "longitude": -73.983849,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A25",
    "name": "50 St",
    "latitude": 40.762456,
    "longitude": -73.985984,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B14",
    "name": "50 St",
    "latitude": 40.63626,
    "longitude": -73.994791,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "630",
    "name": "51 St",
    "latitude": 40.757107,
    "longitude": -73.97192,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "713",
    "name": "52 St",
    "latitude": 40.744149,
    "longitude": -73.912549,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "S"
        ]
      }
    ]
  },
  {
    "id": "R40",
    "name": "53 St",
    "latitude": 40.645069,
    "longitude": -74.014034,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B15",
    "name": "55 St",
    "latitude": 40.631435,
    "longitude": -73.995476,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B10",
    "name": "57 St",
    "latitude": 40.763972,
    "longitude": -73.97745,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R14",
    "name": "57 St-7 Av",
    "latitude": 40.764664,
    "longitude": -73.980658,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "629",
    "name": "59 St",
    "latitude": 40.762526,
    "longitude": -73.967967,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R41",
    "name": "59 St",
    "latitude": 40.641362,
    "longitude": -74.017881,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "125",
    "name": "59 St-Columbus Circle",
    "latitude": 40.768247,
    "longitude": -73.981929,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A24",
    "name": "59 St-Columbus Circle",
    "latitude": 40.768296,
    "longitude": -73.981736,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L02",
    "name": "6 Av",
    "latitude": 40.737335,
    "longitude": -73.996786,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "712",
    "name": "61 St-Woodside",
    "latitude": 40.74563,
    "longitude": -73.902984,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B16",
    "name": "62 St",
    "latitude": 40.626472,
    "longitude": -73.996895,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "S"
        ]
      }
    ]
  },
  {
    "id": "G10",
    "name": "63 Dr-Rego Park",
    "latitude": 40.729846,
    "longitude": -73.861604,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G15",
    "name": "65 St",
    "latitude": 40.749669,
    "longitude": -73.898453,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "124",
    "name": "66 St-Lincoln Center",
    "latitude": 40.77344,
    "longitude": -73.982209,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G09",
    "name": "67 Av",
    "latitude": 40.726523,
    "longitude": -73.852719,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "628",
    "name": "68 St-Hunter College",
    "latitude": 40.768141,
    "longitude": -73.96387,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "711",
    "name": "69 St",
    "latitude": 40.746325,
    "longitude": -73.896403,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "S"
        ]
      }
    ]
  },
  {
    "id": "D14",
    "name": "7 Av",
    "latitude": 40.762862,
    "longitude": -73.981637,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D25",
    "name": "7 Av",
    "latitude": 40.67705,
    "longitude": -73.972367,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F24",
    "name": "7 Av",
    "latitude": 40.666271,
    "longitude": -73.980305,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B17",
    "name": "71 St",
    "latitude": 40.619589,
    "longitude": -73.998864,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "123",
    "name": "72 St",
    "latitude": 40.778453,
    "longitude": -73.98197,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A22",
    "name": "72 St",
    "latitude": 40.775594,
    "longitude": -73.97641,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "Q03",
    "name": "72 St",
    "latitude": 40.768799,
    "longitude": -73.958424,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "710",
    "name": "74 St-Broadway",
    "latitude": 40.746848,
    "longitude": -73.891394,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "S"
        ]
      }
    ]
  },
  {
    "id": "F07",
    "name": "75 Av",
    "latitude": 40.718331,
    "longitude": -73.837324,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J17",
    "name": "75 St-Elderts Ln",
    "latitude": 40.691324,
    "longitude": -73.867139,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "627",
    "name": "77 St",
    "latitude": 40.77362,
    "longitude": -73.959874,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R43",
    "name": "77 St",
    "latitude": 40.629742,
    "longitude": -74.02551,
    "routes": [
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "122",
    "name": "79 St",
    "latitude": 40.783934,
    "longitude": -73.979917,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B18",
    "name": "79 St",
    "latitude": 40.613501,
    "longitude": -74.00061,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L01",
    "name": "8 Av",
    "latitude": 40.739777,
    "longitude": -74.002578,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N02",
    "name": "8 Av",
    "latitude": 40.635064,
    "longitude": -74.011719,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R21",
    "name": "8 St-NYU",
    "latitude": 40.730328,
    "longitude": -73.992629,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A59",
    "name": "80 St",
    "latitude": 40.679371,
    "longitude": -73.858992,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A21",
    "name": "81 St-Museum of Natural History",
    "latitude": 40.781433,
    "longitude": -73.972143,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "709",
    "name": "82 St-Jackson Hts",
    "latitude": 40.747659,
    "longitude": -73.883697,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J16",
    "name": "85 St-Forest Pkwy",
    "latitude": 40.692435,
    "longitude": -73.86001,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "121",
    "name": "86 St",
    "latitude": 40.788644,
    "longitude": -73.976218,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "626",
    "name": "86 St",
    "latitude": 40.779492,
    "longitude": -73.955589,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A20",
    "name": "86 St",
    "latitude": 40.785868,
    "longitude": -73.968916,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N10",
    "name": "86 St",
    "latitude": 40.592721,
    "longitude": -73.97823,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "Q04",
    "name": "86 St",
    "latitude": 40.777891,
    "longitude": -73.951787,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "R44",
    "name": "86 St",
    "latitude": 40.622687,
    "longitude": -74.028398,
    "routes": [
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A60",
    "name": "88 St",
    "latitude": 40.679843,
    "longitude": -73.85147,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B12",
    "name": "9 Av",
    "latitude": 40.646292,
    "longitude": -73.994324,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "S"
        ]
      }
    ]
  },
  {
    "id": "708",
    "name": "90 St-Elmhurst Av",
    "latitude": 40.748408,
    "longitude": -73.876613,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "120",
    "name": "96 St",
    "latitude": 40.793919,
    "longitude": -73.972323,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "625",
    "name": "96 St",
    "latitude": 40.785672,
    "longitude": -73.95107,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A19",
    "name": "96 St",
    "latitude": 40.791642,
    "longitude": -73.964696,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "Q05",
    "name": "96 St",
    "latitude": 40.784318,
    "longitude": -73.947152,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "J24",
    "name": "Alabama Av",
    "latitude": 40.676992,
    "longitude": -73.898654,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "210",
    "name": "Allerton Av",
    "latitude": 40.865462,
    "longitude": -73.867352,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S17",
    "name": "Annadale",
    "latitude": 40.54046,
    "longitude": -74.178217,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H01",
    "name": "Aqueduct Racetrack",
    "latitude": 40.672097,
    "longitude": -73.835919,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "H02",
    "name": "Aqueduct-N Conduit Av",
    "latitude": 40.668234,
    "longitude": -73.834058,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S11",
    "name": "Arthur Kill",
    "latitude": 40.516578,
    "longitude": -74.242096,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "636",
    "name": "Astor Pl",
    "latitude": 40.730054,
    "longitude": -73.99107,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R03",
    "name": "Astoria Blvd",
    "latitude": 40.770258,
    "longitude": -73.917843,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R01",
    "name": "Astoria-Ditmars Blvd",
    "latitude": 40.775036,
    "longitude": -73.912034,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L24",
    "name": "Atlantic Av",
    "latitude": 40.675345,
    "longitude": -73.903097,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "235",
    "name": "Atlantic Av-Barclays Ctr",
    "latitude": 40.684359,
    "longitude": -73.977666,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D24",
    "name": "Atlantic Av-Barclays Ctr",
    "latitude": 40.68446,
    "longitude": -73.97689,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R31",
    "name": "Atlantic Av-Barclays Ctr",
    "latitude": 40.683666,
    "longitude": -73.97881,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D32",
    "name": "Avenue H",
    "latitude": 40.62927,
    "longitude": -73.961639,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F31",
    "name": "Avenue I",
    "latitude": 40.625322,
    "longitude": -73.976127,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D33",
    "name": "Avenue J",
    "latitude": 40.625039,
    "longitude": -73.960803,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D34",
    "name": "Avenue M",
    "latitude": 40.617618,
    "longitude": -73.959399,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F33",
    "name": "Avenue N",
    "latitude": 40.61514,
    "longitude": -73.974197,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F34",
    "name": "Avenue P",
    "latitude": 40.608944,
    "longitude": -73.973022,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D37",
    "name": "Avenue U",
    "latitude": 40.5993,
    "longitude": -73.955929,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F36",
    "name": "Avenue U",
    "latitude": 40.596063,
    "longitude": -73.973357,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N09",
    "name": "Avenue U",
    "latitude": 40.597473,
    "longitude": -73.979137,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F38",
    "name": "Avenue X",
    "latitude": 40.58962,
    "longitude": -73.97425,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B23",
    "name": "Bay 50 St",
    "latitude": 40.588841,
    "longitude": -73.983765,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B21",
    "name": "Bay Pkwy",
    "latitude": 40.601875,
    "longitude": -73.993728,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "S"
        ]
      }
    ]
  },
  {
    "id": "F32",
    "name": "Bay Pkwy",
    "latitude": 40.620769,
    "longitude": -73.975264,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N07",
    "name": "Bay Pkwy",
    "latitude": 40.611815,
    "longitude": -73.981848,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R42",
    "name": "Bay Ridge Av",
    "latitude": 40.634967,
    "longitude": -74.023377,
    "routes": [
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R45",
    "name": "Bay Ridge-95 St",
    "latitude": 40.616622,
    "longitude": -74.030876,
    "routes": [
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S20",
    "name": "Bay Terrace",
    "latitude": 40.5564,
    "longitude": -74.136907,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "502",
    "name": "Baychester Av",
    "latitude": 40.878663,
    "longitude": -73.838591,
    "routes": [
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H14",
    "name": "Beach 105 St",
    "latitude": 40.583209,
    "longitude": -73.827559,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H10",
    "name": "Beach 25 St",
    "latitude": 40.600066,
    "longitude": -73.761353,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H09",
    "name": "Beach 36 St",
    "latitude": 40.595398,
    "longitude": -73.768175,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H08",
    "name": "Beach 44 St",
    "latitude": 40.592943,
    "longitude": -73.776013,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H07",
    "name": "Beach 60 St",
    "latitude": 40.592374,
    "longitude": -73.788522,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H06",
    "name": "Beach 67 St",
    "latitude": 40.590927,
    "longitude": -73.796924,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H12",
    "name": "Beach 90 St",
    "latitude": 40.588034,
    "longitude": -73.813641,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H13",
    "name": "Beach 98 St",
    "latitude": 40.585307,
    "longitude": -73.820558,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L08",
    "name": "Bedford Av",
    "latitude": 40.717304,
    "longitude": -73.956872,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D03",
    "name": "Bedford Park Blvd",
    "latitude": 40.873244,
    "longitude": -73.887138,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "405",
    "name": "Bedford Park Blvd-Lehman College",
    "latitude": 40.873412,
    "longitude": -73.890064,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G33",
    "name": "Bedford-Nostrand Avs",
    "latitude": 40.689627,
    "longitude": -73.953522,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "236",
    "name": "Bergen St",
    "latitude": 40.680829,
    "longitude": -73.975098,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F20",
    "name": "Bergen St",
    "latitude": 40.686145,
    "longitude": -73.990862,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D29",
    "name": "Beverley Rd",
    "latitude": 40.644031,
    "longitude": -73.964492,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "245",
    "name": "Beverly Rd",
    "latitude": 40.645098,
    "longitude": -73.948959,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "637",
    "name": "Bleecker St",
    "latitude": 40.725915,
    "longitude": -73.994659,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "232",
    "name": "Borough Hall",
    "latitude": 40.693219,
    "longitude": -73.989998,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "423",
    "name": "Borough Hall",
    "latitude": 40.692404,
    "longitude": -73.990151,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S04",
    "name": "Botanic Garden",
    "latitude": 40.670343,
    "longitude": -73.959245,
    "routes": [
      {
        "routeId": "FS",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M19",
    "name": "Bowery",
    "latitude": 40.72028,
    "longitude": -73.993915,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "420",
    "name": "Bowling Green",
    "latitude": 40.704817,
    "longitude": -74.014065,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F05",
    "name": "Briarwood",
    "latitude": 40.709179,
    "longitude": -73.820574,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D40",
    "name": "Brighton Beach",
    "latitude": 40.577621,
    "longitude": -73.961376,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H04",
    "name": "Broad Channel",
    "latitude": 40.608382,
    "longitude": -73.815925,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M23",
    "name": "Broad St",
    "latitude": 40.706476,
    "longitude": -74.011056,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G30",
    "name": "Broadway",
    "latitude": 40.706092,
    "longitude": -73.950308,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R05",
    "name": "Broadway",
    "latitude": 40.76182,
    "longitude": -73.925508,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A51",
    "name": "Broadway Junction",
    "latitude": 40.678334,
    "longitude": -73.905316,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J27",
    "name": "Broadway Junction",
    "latitude": 40.679498,
    "longitude": -73.904512,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L22",
    "name": "Broadway Junction",
    "latitude": 40.678856,
    "longitude": -73.90324,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D21",
    "name": "Broadway-Lafayette St",
    "latitude": 40.725297,
    "longitude": -73.996204,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "212",
    "name": "Bronx Park East",
    "latitude": 40.848828,
    "longitude": -73.868457,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "618",
    "name": "Brook Av",
    "latitude": 40.807566,
    "longitude": -73.91924,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "640",
    "name": "Brooklyn Bridge-City Hall",
    "latitude": 40.713065,
    "longitude": -74.004131,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "602",
    "name": "Buhre Av",
    "latitude": 40.84681,
    "longitude": -73.832569,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "209",
    "name": "Burke Av",
    "latitude": 40.871356,
    "longitude": -73.867164,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "409",
    "name": "Burnside Av",
    "latitude": 40.853453,
    "longitude": -73.907684,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L21",
    "name": "Bushwick Av-Aberdeen St",
    "latitude": 40.682829,
    "longitude": -73.905249,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "135",
    "name": "Canal St",
    "latitude": 40.722854,
    "longitude": -74.006277,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "639",
    "name": "Canal St",
    "latitude": 40.718803,
    "longitude": -74.000193,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A34",
    "name": "Canal St",
    "latitude": 40.720824,
    "longitude": -74.005229,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M20",
    "name": "Canal St",
    "latitude": 40.718092,
    "longitude": -73.999892,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "Q01",
    "name": "Canal St",
    "latitude": 40.718383,
    "longitude": -74.00046,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R23",
    "name": "Canal St",
    "latitude": 40.719527,
    "longitude": -74.001775,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L29",
    "name": "Canarsie-Rockaway Pkwy",
    "latitude": 40.646654,
    "longitude": -73.90185,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F21",
    "name": "Carroll St",
    "latitude": 40.680303,
    "longitude": -73.995048,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "607",
    "name": "Castle Hill Av",
    "latitude": 40.834255,
    "longitude": -73.851222,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "118",
    "name": "Cathedral Pkwy (110 St)",
    "latitude": 40.803967,
    "longitude": -73.966847,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A17",
    "name": "Cathedral Pkwy (110 St)",
    "latitude": 40.800603,
    "longitude": -73.958161,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M10",
    "name": "Central Av",
    "latitude": 40.697857,
    "longitude": -73.927397,
    "routes": [
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "137",
    "name": "Chambers St",
    "latitude": 40.715478,
    "longitude": -74.009266,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A36",
    "name": "Chambers St",
    "latitude": 40.714111,
    "longitude": -74.008585,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M21",
    "name": "Chambers St",
    "latitude": 40.713243,
    "longitude": -74.003401,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J28",
    "name": "Chauncey St",
    "latitude": 40.682893,
    "longitude": -73.910456,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "133",
    "name": "Christopher St-Stonewall",
    "latitude": 40.733422,
    "longitude": -74.002906,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "244",
    "name": "Church Av",
    "latitude": 40.650843,
    "longitude": -73.949575,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D28",
    "name": "Church Av",
    "latitude": 40.650527,
    "longitude": -73.962982,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F27",
    "name": "Church Av",
    "latitude": 40.644041,
    "longitude": -73.979678,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R24",
    "name": "City Hall",
    "latitude": 40.713282,
    "longitude": -74.006978,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "231",
    "name": "Clark St",
    "latitude": 40.697466,
    "longitude": -73.993086,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G34",
    "name": "Classon Av",
    "latitude": 40.688873,
    "longitude": -73.96007,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J22",
    "name": "Cleveland St",
    "latitude": 40.679947,
    "longitude": -73.884639,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S28",
    "name": "Clifton",
    "latitude": 40.621319,
    "longitude": -74.071402,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A44",
    "name": "Clinton-Washington Avs",
    "latitude": 40.683263,
    "longitude": -73.965838,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G35",
    "name": "Clinton-Washington Avs",
    "latitude": 40.688089,
    "longitude": -73.966839,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D43",
    "name": "Coney Island-Stillwell Av",
    "latitude": 40.577422,
    "longitude": -73.981233,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D30",
    "name": "Cortelyou Rd",
    "latitude": 40.640927,
    "longitude": -73.963891,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R25",
    "name": "Cortlandt St",
    "latitude": 40.710668,
    "longitude": -74.011029,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "719",
    "name": "Court Sq",
    "latitude": 40.747023,
    "longitude": -73.945264,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G22",
    "name": "Court Sq",
    "latitude": 40.746554,
    "longitude": -73.943832,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F09",
    "name": "Court Sq-23 St",
    "latitude": 40.747846,
    "longitude": -73.946,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R28",
    "name": "Court St",
    "latitude": 40.6941,
    "longitude": -73.991777,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J20",
    "name": "Crescent St",
    "latitude": 40.683194,
    "longitude": -73.873785,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "250",
    "name": "Crown Hts-Utica Av",
    "latitude": 40.668897,
    "longitude": -73.932942,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "617",
    "name": "Cypress Av",
    "latitude": 40.805368,
    "longitude": -73.914042,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J19",
    "name": "Cypress Hills",
    "latitude": 40.689941,
    "longitude": -73.87255,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L16",
    "name": "DeKalb Av",
    "latitude": 40.703811,
    "longitude": -73.918425,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R30",
    "name": "DeKalb Av",
    "latitude": 40.690635,
    "longitude": -73.981824,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F15",
    "name": "Delancey St-Essex St",
    "latitude": 40.718611,
    "longitude": -73.988114,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M18",
    "name": "Delancey St-Essex St",
    "latitude": 40.718315,
    "longitude": -73.987437,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F29",
    "name": "Ditmas Av",
    "latitude": 40.636119,
    "longitude": -73.978172,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S25",
    "name": "Dongan Hills",
    "latitude": 40.588849,
    "longitude": -74.09609,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "109",
    "name": "Dyckman St",
    "latitude": 40.860531,
    "longitude": -73.925536,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A03",
    "name": "Dyckman St",
    "latitude": 40.865491,
    "longitude": -73.927271,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "616",
    "name": "E 143 St-St Mary's St",
    "latitude": 40.808719,
    "longitude": -73.907657,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "615",
    "name": "E 149 St",
    "latitude": 40.812118,
    "longitude": -73.904098,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "213",
    "name": "E 180 St",
    "latitude": 40.841894,
    "longitude": -73.873488,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L28",
    "name": "East 105 St",
    "latitude": 40.650573,
    "longitude": -73.899485,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F16",
    "name": "East Broadway",
    "latitude": 40.713715,
    "longitude": -73.990173,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "501",
    "name": "Eastchester-Dyre Av",
    "latitude": 40.8883,
    "longitude": -73.830834,
    "routes": [
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "238",
    "name": "Eastern Pkwy-Brooklyn Museum",
    "latitude": 40.671987,
    "longitude": -73.964375,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "611",
    "name": "Elder Av",
    "latitude": 40.828584,
    "longitude": -73.879159,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G13",
    "name": "Elmhurst Av",
    "latitude": 40.742454,
    "longitude": -73.882017,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S18",
    "name": "Eltingville",
    "latitude": 40.544601,
    "longitude": -74.16457,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A55",
    "name": "Euclid Av",
    "latitude": 40.675377,
    "longitude": -73.872106,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H11",
    "name": "Far Rockaway-Mott Av",
    "latitude": 40.603995,
    "longitude": -73.755405,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "247",
    "name": "Flatbush Av-Brooklyn College",
    "latitude": 40.632836,
    "longitude": -73.947642,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G31",
    "name": "Flushing Av",
    "latitude": 40.700377,
    "longitude": -73.950234,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M12",
    "name": "Flushing Av",
    "latitude": 40.70026,
    "longitude": -73.941126,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "701",
    "name": "Flushing-Main St",
    "latitude": 40.7596,
    "longitude": -73.83003,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "407",
    "name": "Fordham Rd",
    "latitude": 40.862803,
    "longitude": -73.901034,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D05",
    "name": "Fordham Rd",
    "latitude": 40.861296,
    "longitude": -73.897749,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M05",
    "name": "Forest Av",
    "latitude": 40.704423,
    "longitude": -73.903077,
    "routes": [
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G08",
    "name": "Forest Hills-71 Av",
    "latitude": 40.721691,
    "longitude": -73.844521,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B13",
    "name": "Fort Hamilton Pkwy",
    "latitude": 40.640914,
    "longitude": -73.994304,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F26",
    "name": "Fort Hamilton Pkwy",
    "latitude": 40.650782,
    "longitude": -73.975776,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N03",
    "name": "Fort Hamilton Pkwy",
    "latitude": 40.631386,
    "longitude": -74.005351,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A45",
    "name": "Franklin Av",
    "latitude": 40.68138,
    "longitude": -73.956848,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S01",
    "name": "Franklin Av",
    "latitude": 40.680596,
    "longitude": -73.955827,
    "routes": [
      {
        "routeId": "FS",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "239",
    "name": "Franklin Av-Medgar Evers College",
    "latitude": 40.670682,
    "longitude": -73.958131,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "136",
    "name": "Franklin St",
    "latitude": 40.719318,
    "longitude": -74.006886,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "216",
    "name": "Freeman St",
    "latitude": 40.829993,
    "longitude": -73.891865,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M04",
    "name": "Fresh Pond Rd",
    "latitude": 40.706186,
    "longitude": -73.895877,
    "routes": [
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "229",
    "name": "Fulton St",
    "latitude": 40.709416,
    "longitude": -74.006571,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "418",
    "name": "Fulton St",
    "latitude": 40.710368,
    "longitude": -74.009509,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A38",
    "name": "Fulton St",
    "latitude": 40.710197,
    "longitude": -74.007691,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G36",
    "name": "Fulton St",
    "latitude": 40.687119,
    "longitude": -73.975375,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M22",
    "name": "Fulton St",
    "latitude": 40.710374,
    "longitude": -74.007582,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J30",
    "name": "Gates Av",
    "latitude": 40.68963,
    "longitude": -73.92227,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L11",
    "name": "Graham Av",
    "latitude": 40.714565,
    "longitude": -73.944053,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "237",
    "name": "Grand Army Plaza",
    "latitude": 40.675235,
    "longitude": -73.971046,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G12",
    "name": "Grand Av-Newtown",
    "latitude": 40.737015,
    "longitude": -73.877223,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "631",
    "name": "Grand Central-42 St",
    "latitude": 40.751776,
    "longitude": -73.976848,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "723",
    "name": "Grand Central-42 St",
    "latitude": 40.751431,
    "longitude": -73.976041,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "901",
    "name": "Grand Central-42 St",
    "latitude": 40.752769,
    "longitude": -73.979189,
    "routes": [
      {
        "routeId": "GS",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D22",
    "name": "Grand St",
    "latitude": 40.718267,
    "longitude": -73.993753,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L12",
    "name": "Grand St",
    "latitude": 40.711926,
    "longitude": -73.94067,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A57",
    "name": "Grant Av",
    "latitude": 40.677044,
    "longitude": -73.86505,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S23",
    "name": "Grant City",
    "latitude": 40.578965,
    "longitude": -74.109704,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S27",
    "name": "Grasmere",
    "latitude": 40.603117,
    "longitude": -74.084087,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S19",
    "name": "Great Kills",
    "latitude": 40.551231,
    "longitude": -74.151399,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G26",
    "name": "Greenpoint Av",
    "latitude": 40.731352,
    "longitude": -73.954449,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "208",
    "name": "Gun Hill Rd",
    "latitude": 40.87785,
    "longitude": -73.866256,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "503",
    "name": "Gun Hill Rd",
    "latitude": 40.869526,
    "longitude": -73.846384,
    "routes": [
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J29",
    "name": "Halsey St",
    "latitude": 40.68637,
    "longitude": -73.916559,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L19",
    "name": "Halsey St",
    "latitude": 40.695602,
    "longitude": -73.904084,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "301",
    "name": "Harlem-148 St",
    "latitude": 40.82388,
    "longitude": -73.93647,
    "routes": [
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M14",
    "name": "Hewes St",
    "latitude": 40.70687,
    "longitude": -73.953431,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A40",
    "name": "High St",
    "latitude": 40.699337,
    "longitude": -73.990531,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "134",
    "name": "Houston St",
    "latitude": 40.728251,
    "longitude": -74.005367,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H03",
    "name": "Howard Beach-JFK Airport",
    "latitude": 40.660476,
    "longitude": -73.830301,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "233",
    "name": "Hoyt St",
    "latitude": 40.690545,
    "longitude": -73.985065,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A42",
    "name": "Hoyt-Schermerhorn Sts",
    "latitude": 40.688484,
    "longitude": -73.985001,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S16",
    "name": "Huguenot",
    "latitude": 40.533674,
    "longitude": -74.191794,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "720",
    "name": "Hunters Point Av",
    "latitude": 40.742216,
    "longitude": -73.948916,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "613",
    "name": "Hunts Point Av",
    "latitude": 40.820948,
    "longitude": -73.890549,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "218",
    "name": "Intervale Av",
    "latitude": 40.822181,
    "longitude": -73.896736,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A02",
    "name": "Inwood-207 St",
    "latitude": 40.868072,
    "longitude": -73.919899,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "220",
    "name": "Jackson Av",
    "latitude": 40.81649,
    "longitude": -73.907807,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G14",
    "name": "Jackson Hts-Roosevelt Av",
    "latitude": 40.746644,
    "longitude": -73.891338,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G05",
    "name": "Jamaica Center-Parsons/Archer",
    "latitude": 40.702147,
    "longitude": -73.801109,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F01",
    "name": "Jamaica-179 St",
    "latitude": 40.712646,
    "longitude": -73.783817,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G07",
    "name": "Jamaica-Van Wyck",
    "latitude": 40.702566,
    "longitude": -73.816859,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A41",
    "name": "Jay St-MetroTech",
    "latitude": 40.692338,
    "longitude": -73.987342,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R29",
    "name": "Jay St-MetroTech",
    "latitude": 40.69218,
    "longitude": -73.985942,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S24",
    "name": "Jefferson Av",
    "latitude": 40.583591,
    "longitude": -74.103338,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L15",
    "name": "Jefferson St",
    "latitude": 40.706607,
    "longitude": -73.922913,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "707",
    "name": "Junction Blvd",
    "latitude": 40.749145,
    "longitude": -73.869527,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "254",
    "name": "Junius St",
    "latitude": 40.663515,
    "longitude": -73.902447,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "F06",
    "name": "Kew Gardens-Union Tpke",
    "latitude": 40.714441,
    "longitude": -73.831008,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D35",
    "name": "Kings Hwy",
    "latitude": 40.60867,
    "longitude": -73.957734,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F35",
    "name": "Kings Hwy",
    "latitude": 40.603217,
    "longitude": -73.972361,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N08",
    "name": "Kings Hwy",
    "latitude": 40.603923,
    "longitude": -73.980353,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "406",
    "name": "Kingsbridge Rd",
    "latitude": 40.86776,
    "longitude": -73.897174,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D04",
    "name": "Kingsbridge Rd",
    "latitude": 40.866978,
    "longitude": -73.893509,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "249",
    "name": "Kingston Av",
    "latitude": 40.669399,
    "longitude": -73.942161,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "A47",
    "name": "Kingston-Throop Avs",
    "latitude": 40.679921,
    "longitude": -73.940858,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M09",
    "name": "Knickerbocker Av",
    "latitude": 40.698664,
    "longitude": -73.919711,
    "routes": [
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J31",
    "name": "Kosciuszko St",
    "latitude": 40.693342,
    "longitude": -73.928814,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A43",
    "name": "Lafayette Av",
    "latitude": 40.686113,
    "longitude": -73.973946,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F11",
    "name": "Lexington Av/53 St",
    "latitude": 40.757552,
    "longitude": -73.969055,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R11",
    "name": "Lexington Av/59 St",
    "latitude": 40.76266,
    "longitude": -73.967258,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B08",
    "name": "Lexington Av/63 St",
    "latitude": 40.764629,
    "longitude": -73.966113,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "A52",
    "name": "Liberty Av",
    "latitude": 40.674542,
    "longitude": -73.896548,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L26",
    "name": "Livonia Av",
    "latitude": 40.664038,
    "longitude": -73.900571,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "614",
    "name": "Longwood Av",
    "latitude": 40.816104,
    "longitude": -73.896435,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L10",
    "name": "Lorimer St",
    "latitude": 40.714063,
    "longitude": -73.950275,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M13",
    "name": "Lorimer St",
    "latitude": 40.703869,
    "longitude": -73.947408,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "106",
    "name": "Marble Hill-225 St",
    "latitude": 40.874561,
    "longitude": -73.909831,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M16",
    "name": "Marcy Av",
    "latitude": 40.708359,
    "longitude": -73.957757,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G29",
    "name": "Metropolitan Av",
    "latitude": 40.712792,
    "longitude": -73.951418,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "702",
    "name": "Mets-Willets Point",
    "latitude": 40.754622,
    "longitude": -73.845625,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M01",
    "name": "Middle Village-Metropolitan Av",
    "latitude": 40.711396,
    "longitude": -73.889601,
    "routes": [
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "603",
    "name": "Middletown Rd",
    "latitude": 40.843863,
    "longitude": -73.836322,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L13",
    "name": "Montrose Av",
    "latitude": 40.707739,
    "longitude": -73.93985,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L14",
    "name": "Morgan Av",
    "latitude": 40.706152,
    "longitude": -73.933147,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "505",
    "name": "Morris Park",
    "latitude": 40.854364,
    "longitude": -73.860495,
    "routes": [
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "610",
    "name": "Morrison Av-Soundview",
    "latitude": 40.829521,
    "longitude": -73.874516,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "402",
    "name": "Mosholu Pkwy",
    "latitude": 40.87975,
    "longitude": -73.884655,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "411",
    "name": "Mt Eden Av",
    "latitude": 40.844434,
    "longitude": -73.914685,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M11",
    "name": "Myrtle Av",
    "latitude": 40.697207,
    "longitude": -73.935657,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G32",
    "name": "Myrtle-Willoughby Avs",
    "latitude": 40.694568,
    "longitude": -73.949046,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L17",
    "name": "Myrtle-Wyckoff Avs",
    "latitude": 40.699814,
    "longitude": -73.911586,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "M08",
    "name": "Myrtle-Wyckoff Avs",
    "latitude": 40.69943,
    "longitude": -73.912385,
    "routes": [
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G28",
    "name": "Nassau Av",
    "latitude": 40.724635,
    "longitude": -73.951277,
    "routes": [
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D38",
    "name": "Neck Rd",
    "latitude": 40.595246,
    "longitude": -73.955161,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F39",
    "name": "Neptune Av",
    "latitude": 40.581011,
    "longitude": -73.974574,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "204",
    "name": "Nereid Av",
    "latitude": 40.898379,
    "longitude": -73.854376,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "234",
    "name": "Nevins St",
    "latitude": 40.688246,
    "longitude": -73.980492,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S22",
    "name": "New Dorp",
    "latitude": 40.57348,
    "longitude": -74.11721,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "257",
    "name": "New Lots Av",
    "latitude": 40.666235,
    "longitude": -73.884079,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "L27",
    "name": "New Lots Av",
    "latitude": 40.658733,
    "longitude": -73.899232,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "N04",
    "name": "New Utrecht Av",
    "latitude": 40.624842,
    "longitude": -73.996353,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "246",
    "name": "Newkirk Av-Little Haiti",
    "latitude": 40.639967,
    "longitude": -73.948411,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D31",
    "name": "Newkirk Plaza",
    "latitude": 40.635082,
    "longitude": -73.962793,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G16",
    "name": "Northern Blvd",
    "latitude": 40.752885,
    "longitude": -73.906006,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J21",
    "name": "Norwood Av",
    "latitude": 40.68141,
    "longitude": -73.880039,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D01",
    "name": "Norwood-205 St",
    "latitude": 40.874811,
    "longitude": -73.878855,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "248",
    "name": "Nostrand Av",
    "latitude": 40.669847,
    "longitude": -73.950466,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "A46",
    "name": "Nostrand Av",
    "latitude": 40.680438,
    "longitude": -73.950426,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S21",
    "name": "Oakwood Heights",
    "latitude": 40.56511,
    "longitude": -74.12632,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D41",
    "name": "Ocean Pkwy",
    "latitude": 40.576312,
    "longitude": -73.968501,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S26",
    "name": "Old Town",
    "latitude": 40.596612,
    "longitude": -74.087368,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A65",
    "name": "Ozone Park-Lefferts Blvd",
    "latitude": 40.685951,
    "longitude": -73.825798,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S03",
    "name": "Park Pl",
    "latitude": 40.674772,
    "longitude": -73.957624,
    "routes": [
      {
        "routeId": "FS",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "228",
    "name": "Park Place",
    "latitude": 40.713051,
    "longitude": -74.008811,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "608",
    "name": "Parkchester",
    "latitude": 40.833226,
    "longitude": -73.860816,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D27",
    "name": "Parkside Av",
    "latitude": 40.655292,
    "longitude": -73.961495,
    "routes": [
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F03",
    "name": "Parsons Blvd",
    "latitude": 40.707564,
    "longitude": -73.803326,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "601",
    "name": "Pelham Bay Park",
    "latitude": 40.852462,
    "longitude": -73.828121,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "211",
    "name": "Pelham Pkwy",
    "latitude": 40.857192,
    "longitude": -73.867615,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "504",
    "name": "Pelham Pkwy",
    "latitude": 40.858985,
    "longitude": -73.855359,
    "routes": [
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "255",
    "name": "Pennsylvania Av",
    "latitude": 40.664635,
    "longitude": -73.894895,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "S14",
    "name": "Pleasant Plains",
    "latitude": 40.52241,
    "longitude": -74.217847,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "241",
    "name": "President St-Medgar Evers College",
    "latitude": 40.667883,
    "longitude": -73.950683,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R22",
    "name": "Prince St",
    "latitude": 40.724329,
    "longitude": -73.997702,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S15",
    "name": "Prince's Bay",
    "latitude": 40.525507,
    "longitude": -74.200064,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "219",
    "name": "Prospect Av",
    "latitude": 40.819585,
    "longitude": -73.90177,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R34",
    "name": "Prospect Av",
    "latitude": 40.665414,
    "longitude": -73.992872,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D26",
    "name": "Prospect Park",
    "latitude": 40.661614,
    "longitude": -73.962246,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FS",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G21",
    "name": "Queens Plaza",
    "latitude": 40.748973,
    "longitude": -73.937243,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "718",
    "name": "Queensboro Plaza",
    "latitude": 40.750582,
    "longitude": -73.940202,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R09",
    "name": "Queensboro Plaza",
    "latitude": 40.750582,
    "longitude": -73.940202,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A49",
    "name": "Ralph Av",
    "latitude": 40.678822,
    "longitude": -73.920786,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "139",
    "name": "Rector St",
    "latitude": 40.707513,
    "longitude": -74.013783,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R26",
    "name": "Rector St",
    "latitude": 40.70722,
    "longitude": -74.013342,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S13",
    "name": "Richmond Valley",
    "latitude": 40.519631,
    "longitude": -74.229141,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "253",
    "name": "Rockaway Av",
    "latitude": 40.662549,
    "longitude": -73.908946,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "A50",
    "name": "Rockaway Av",
    "latitude": 40.67834,
    "longitude": -73.911946,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A61",
    "name": "Rockaway Blvd",
    "latitude": 40.680429,
    "longitude": -73.843853,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "H15",
    "name": "Rockaway Park-Beach 116 St",
    "latitude": 40.580903,
    "longitude": -73.835592,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "H",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "B06",
    "name": "Roosevelt Island",
    "latitude": 40.759145,
    "longitude": -73.95326,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "252",
    "name": "Saratoga Av",
    "latitude": 40.661453,
    "longitude": -73.916327,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "M06",
    "name": "Seneca Av",
    "latitude": 40.702762,
    "longitude": -73.90774,
    "routes": [
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D39",
    "name": "Sheepshead Bay",
    "latitude": 40.586896,
    "longitude": -73.954155,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A54",
    "name": "Shepherd Av",
    "latitude": 40.67413,
    "longitude": -73.88075,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "217",
    "name": "Simpson St",
    "latitude": 40.824073,
    "longitude": -73.893064,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F22",
    "name": "Smith-9 Sts",
    "latitude": 40.67358,
    "longitude": -73.995959,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "G",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "142",
    "name": "South Ferry",
    "latitude": 40.702068,
    "longitude": -74.013664,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "638",
    "name": "Spring St",
    "latitude": 40.722301,
    "longitude": -73.997141,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A33",
    "name": "Spring St",
    "latitude": 40.726227,
    "longitude": -74.003739,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S31",
    "name": "St George",
    "latitude": 40.643748,
    "longitude": -74.073643,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "609",
    "name": "St Lawrence Av",
    "latitude": 40.831509,
    "longitude": -73.867618,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S29",
    "name": "Stapleton",
    "latitude": 40.627915,
    "longitude": -74.075162,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G19",
    "name": "Steinway St",
    "latitude": 40.756879,
    "longitude": -73.92074,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "242",
    "name": "Sterling St",
    "latitude": 40.662742,
    "longitude": -73.95085,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F04",
    "name": "Sutphin Blvd",
    "latitude": 40.70546,
    "longitude": -73.810708,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G06",
    "name": "Sutphin Blvd-Archer Av-JFK Airport",
    "latitude": 40.700486,
    "longitude": -73.807969,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L25",
    "name": "Sutter Av",
    "latitude": 40.669367,
    "longitude": -73.901975,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "251",
    "name": "Sutter Av-Rutland Rd",
    "latitude": 40.664717,
    "longitude": -73.92261,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "127",
    "name": "Times Sq-42 St",
    "latitude": 40.75529,
    "longitude": -73.987495,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "725",
    "name": "Times Sq-42 St",
    "latitude": 40.755477,
    "longitude": -73.987691,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "902",
    "name": "Times Sq-42 St",
    "latitude": 40.755983,
    "longitude": -73.986229,
    "routes": [
      {
        "routeId": "GS",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R16",
    "name": "Times Sq-42 St",
    "latitude": 40.754672,
    "longitude": -73.986754,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S30",
    "name": "Tompkinsville",
    "latitude": 40.636949,
    "longitude": -74.074835,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "S09",
    "name": "Tottenville",
    "latitude": 40.512764,
    "longitude": -74.251961,
    "routes": [
      {
        "routeId": "SI",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D07",
    "name": "Tremont Av",
    "latitude": 40.85041,
    "longitude": -73.905227,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R32",
    "name": "Union St",
    "latitude": 40.677316,
    "longitude": -73.98311,
    "routes": [
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A48",
    "name": "Utica Av",
    "latitude": 40.679364,
    "longitude": -73.930729,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "101",
    "name": "Van Cortlandt Park-242 St",
    "latitude": 40.889248,
    "longitude": -73.898583,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "256",
    "name": "Van Siclen Av",
    "latitude": 40.665449,
    "longitude": -73.889395,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N"
        ]
      }
    ]
  },
  {
    "id": "A53",
    "name": "Van Siclen Av",
    "latitude": 40.67271,
    "longitude": -73.890358,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J23",
    "name": "Van Siclen Av",
    "latitude": 40.678024,
    "longitude": -73.891688,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "721",
    "name": "Vernon Blvd-Jackson Av",
    "latitude": 40.742626,
    "longitude": -73.953581,
    "routes": [
      {
        "routeId": "7",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "7X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "A32",
    "name": "W 4 St-Wash Sq",
    "latitude": 40.732338,
    "longitude": -74.000495,
    "routes": [
      {
        "routeId": "A",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "C",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D20",
    "name": "W 4 St-Wash Sq",
    "latitude": 40.732338,
    "longitude": -74.000495,
    "routes": [
      {
        "routeId": "B",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "D",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "D42",
    "name": "W 8 St-NY Aquarium",
    "latitude": 40.576127,
    "longitude": -73.975939,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Q",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "201",
    "name": "Wakefield-241 St",
    "latitude": 40.903125,
    "longitude": -73.85062,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "230",
    "name": "Wall St",
    "latitude": 40.706821,
    "longitude": -74.0091,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "3",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "419",
    "name": "Wall St",
    "latitude": 40.707557,
    "longitude": -74.011862,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "214",
    "name": "West Farms Sq-E Tremont Av",
    "latitude": 40.840295,
    "longitude": -73.880049,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "604",
    "name": "Westchester Sq-E Tremont Av",
    "latitude": 40.839892,
    "longitude": -73.842952,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "R27",
    "name": "Whitehall St-South Ferry",
    "latitude": 40.703087,
    "longitude": -74.012994,
    "routes": [
      {
        "routeId": "N",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "W",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "612",
    "name": "Whitlock Av",
    "latitude": 40.826525,
    "longitude": -73.886283,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "L20",
    "name": "Wilson Av",
    "latitude": 40.688764,
    "longitude": -73.904046,
    "routes": [
      {
        "routeId": "L",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "243",
    "name": "Winthrop St",
    "latitude": 40.656652,
    "longitude": -73.9502,
    "routes": [
      {
        "routeId": "2",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "5",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "G11",
    "name": "Woodhaven Blvd",
    "latitude": 40.733106,
    "longitude": -73.869229,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "M",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "R",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "J15",
    "name": "Woodhaven Blvd",
    "latitude": 40.693879,
    "longitude": -73.851576,
    "routes": [
      {
        "routeId": "J",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "Z",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "401",
    "name": "Woodlawn",
    "latitude": 40.886037,
    "longitude": -73.878751,
    "routes": [
      {
        "routeId": "4",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "E01",
    "name": "World Trade Center",
    "latitude": 40.712582,
    "longitude": -74.009781,
    "routes": [
      {
        "routeId": "E",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "138",
    "name": "WTC Cortlandt",
    "latitude": 40.711835,
    "longitude": -74.012188,
    "routes": [
      {
        "routeId": "1",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "F18",
    "name": "York St",
    "latitude": 40.701397,
    "longitude": -73.986751,
    "routes": [
      {
        "routeId": "F",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "FX",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  },
  {
    "id": "606",
    "name": "Zerega Av",
    "latitude": 40.836488,
    "longitude": -73.847036,
    "routes": [
      {
        "routeId": "6",
        "directions": [
          "N",
          "S"
        ]
      },
      {
        "routeId": "6X",
        "directions": [
          "N",
          "S"
        ]
      }
    ]
  }
];
