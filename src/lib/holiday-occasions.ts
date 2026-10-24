import type { HolidayCollection } from "./holiday-collection-types";

// Generated alongside holiday-collections.ts. Discovery never needs the artwork scenes.
export const HOLIDAY_OCCASIONS = [
  {
    "id": "new-years-day",
    "name": "New Year’s Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 1,
      "day": 1,
      "duration": 1
    },
    "palettes": [
      "sage",
      "marine",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "new year January brunch fresh start"
  },
  {
    "id": "mlk-day",
    "name": "Martin Luther King Jr. Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 1,
      "weekday": 1,
      "occurrence": 3
    },
    "palettes": [
      "marine",
      "ochre",
      "sage"
    ],
    "purpose": "volunteers",
    "aliases": "MLK Martin Luther King day of service January"
  },
  {
    "id": "presidents-day",
    "name": "Presidents’ Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 2,
      "weekday": 1,
      "occurrence": 3
    },
    "palettes": [
      "cobalt",
      "slate",
      "ochre"
    ],
    "purpose": "meeting",
    "aliases": "Washington birthday Presidents Day history February"
  },
  {
    "id": "memorial-day",
    "name": "Memorial Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 5,
      "weekday": 1,
      "occurrence": -1
    },
    "palettes": [
      "slate",
      "marine",
      "sage"
    ],
    "purpose": "volunteers",
    "aliases": "Memorial Day remembrance honor fallen May"
  },
  {
    "id": "juneteenth",
    "name": "Juneteenth",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 6,
      "day": 19,
      "duration": 1
    },
    "palettes": [
      "cherry",
      "ochre",
      "evergreen"
    ],
    "purpose": "celebration",
    "aliases": "Juneteenth freedom emancipation June nineteenth"
  },
  {
    "id": "july-fourth",
    "name": "July Fourth",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 7,
      "day": 4,
      "duration": 1
    },
    "palettes": [
      "cobalt",
      "cherry",
      "marine"
    ],
    "purpose": "celebration",
    "aliases": "Independence Day 4th July Fourth fourth of July fireworks"
  },
  {
    "id": "labor-day",
    "name": "Labor Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 9,
      "weekday": 1,
      "occurrence": 1
    },
    "palettes": [
      "terracotta",
      "marine",
      "olive"
    ],
    "purpose": "celebration",
    "aliases": "Labor Day workers September long weekend"
  },
  {
    "id": "columbus-day",
    "name": "Columbus Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 10,
      "weekday": 1,
      "occurrence": 2
    },
    "palettes": [
      "marine",
      "cocoa",
      "slate"
    ],
    "purpose": "meeting",
    "aliases": "Columbus Day October maritime history"
  },
  {
    "id": "veterans-day",
    "name": "Veterans Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 11,
      "day": 11,
      "duration": 1
    },
    "palettes": [
      "slate",
      "cobalt",
      "evergreen"
    ],
    "purpose": "volunteers",
    "aliases": "Veterans Day November veterans appreciation service"
  },
  {
    "id": "thanksgiving",
    "name": "Thanksgiving",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 11,
      "weekday": 4,
      "occurrence": 4
    },
    "palettes": [
      "cider",
      "olive",
      "terracotta"
    ],
    "purpose": "potluck",
    "aliases": "Thanksgiving November gratitude turkey feast"
  },
  {
    "id": "christmas",
    "name": "Christmas",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 12,
      "day": 25,
      "duration": 1
    },
    "palettes": [
      "evergreen",
      "cherry",
      "cocoa"
    ],
    "purpose": "celebration",
    "aliases": "Christmas Xmas December holiday Christmas Eve"
  },
  {
    "id": "new-years-eve",
    "name": "New Year’s Eve",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 12,
      "day": 31,
      "duration": 1
    },
    "palettes": [
      "midnight",
      "ochre",
      "plum"
    ],
    "purpose": "celebration",
    "aliases": "NYE New Years Eve countdown December"
  },
  {
    "id": "valentines-day",
    "name": "Valentine’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 2,
      "day": 14,
      "duration": 1
    },
    "palettes": [
      "rose",
      "cherry",
      "plum"
    ],
    "purpose": "celebration",
    "aliases": "Valentines Galentines February friendship love"
  },
  {
    "id": "st-patricks-day",
    "name": "St. Patrick’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 3,
      "day": 17,
      "duration": 1
    },
    "palettes": [
      "moss",
      "evergreen",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Saint Patricks Irish March shamrock"
  },
  {
    "id": "mardi-gras",
    "name": "Mardi Gras",
    "kind": "Celebrations",
    "date": {
      "kind": "easter",
      "offset": -47
    },
    "palettes": [
      "plum",
      "evergreen",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Mardi Gras Fat Tuesday carnival"
  },
  {
    "id": "easter",
    "name": "Easter",
    "kind": "Celebrations",
    "date": {
      "kind": "easter"
    },
    "palettes": [
      "lavender",
      "sage",
      "apricot"
    ],
    "purpose": "celebration",
    "aliases": "Easter Sunday spring egg hunt"
  },
  {
    "id": "mothers-day",
    "name": "Mother’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "weekday",
      "month": 5,
      "weekday": 0,
      "occurrence": 2
    },
    "palettes": [
      "rose",
      "sage",
      "lavender"
    ],
    "purpose": "celebration",
    "aliases": "Mothers Day mom mum May brunch"
  },
  {
    "id": "fathers-day",
    "name": "Father’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "weekday",
      "month": 6,
      "weekday": 0,
      "occurrence": 3
    },
    "palettes": [
      "marine",
      "moss",
      "cocoa"
    ],
    "purpose": "celebration",
    "aliases": "Fathers Day dad June"
  },
  {
    "id": "earth-day",
    "name": "Earth Day",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 4,
      "day": 22,
      "duration": 1
    },
    "palettes": [
      "sage",
      "moss",
      "teal"
    ],
    "purpose": "volunteers",
    "aliases": "Earth Day April environment cleanup planet"
  },
  {
    "id": "cinco-de-mayo",
    "name": "Cinco de Mayo",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 5,
      "day": 5,
      "duration": 1
    },
    "palettes": [
      "terracotta",
      "cherry",
      "teal"
    ],
    "purpose": "celebration",
    "aliases": "Cinco de Mayo May fifth Mexican culture Puebla"
  },
  {
    "id": "halloween",
    "name": "Halloween",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 10,
      "day": 31,
      "duration": 1
    },
    "palettes": [
      "terracotta",
      "plum",
      "midnight"
    ],
    "purpose": "celebration",
    "aliases": "Halloween October spooky costumes trick or treat"
  },
  {
    "id": "indigenous-peoples-day",
    "name": "Indigenous Peoples’ Day",
    "kind": "Celebrations",
    "date": {
      "kind": "weekday",
      "month": 10,
      "weekday": 1,
      "occurrence": 2
    },
    "palettes": [
      "terracotta",
      "moss",
      "cocoa"
    ],
    "purpose": "meeting",
    "aliases": "Indigenous Peoples Day October Native community"
  },
  {
    "id": "day-of-the-dead",
    "name": "Día de los Muertos",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 11,
      "day": 1,
      "duration": 2
    },
    "palettes": [
      "ochre",
      "plum",
      "terracotta"
    ],
    "purpose": "celebration",
    "aliases": "Dia de los Muertos Day of the Dead November remembrance"
  },
  {
    "id": "lunar-new-year",
    "name": "Lunar New Year",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "chinese",
      "month": "1",
      "day": 1,
      "duration": 15,
      "eve": false
    },
    "palettes": [
      "cherry",
      "ochre",
      "plum"
    ],
    "purpose": "celebration",
    "aliases": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
  },
  {
    "id": "passover",
    "name": "Passover",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Nisan",
      "day": 15,
      "duration": 8,
      "eve": true
    },
    "palettes": [
      "marine",
      "sage",
      "ochre"
    ],
    "purpose": "potluck",
    "aliases": "Passover Pesach seder spring"
  },
  {
    "id": "rosh-hashanah",
    "name": "Rosh Hashanah",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Tishri",
      "day": 1,
      "duration": 2,
      "eve": true
    },
    "palettes": [
      "ochre",
      "sage",
      "terracotta"
    ],
    "purpose": "celebration",
    "aliases": "Rosh Hashanah Jewish New Year apples honey"
  },
  {
    "id": "yom-kippur",
    "name": "Yom Kippur",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Tishri",
      "day": 10,
      "duration": 1,
      "eve": true
    },
    "palettes": [
      "slate",
      "marine",
      "sage"
    ],
    "purpose": "meeting",
    "aliases": "Yom Kippur Day of Atonement reflection"
  },
  {
    "id": "sukkot",
    "name": "Sukkot",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Tishri",
      "day": 15,
      "duration": 7,
      "eve": true
    },
    "palettes": [
      "olive",
      "cider",
      "sage"
    ],
    "purpose": "potluck",
    "aliases": "Sukkot sukkah harvest Jewish fall"
  },
  {
    "id": "hanukkah",
    "name": "Hanukkah",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Kislev",
      "day": 25,
      "duration": 8,
      "eve": true
    },
    "palettes": [
      "marine",
      "cobalt",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Hanukkah Chanukah festival lights dreidel"
  },
  {
    "id": "kwanzaa",
    "name": "Kwanzaa",
    "kind": "Religious & cultural",
    "date": {
      "kind": "fixed",
      "month": 12,
      "day": 26,
      "duration": 7
    },
    "palettes": [
      "evergreen",
      "cherry",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Kwanzaa December January community harvest"
  },
  {
    "id": "ramadan",
    "name": "Ramadan",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "islamic-umalqura",
      "month": "9",
      "day": 1,
      "duration": 30,
      "eve": true
    },
    "palettes": [
      "teal",
      "ochre",
      "midnight"
    ],
    "purpose": "potluck",
    "aliases": "Ramadan Ramazan iftar suhoor community"
  },
  {
    "id": "eid-al-fitr",
    "name": "Eid al-Fitr",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "islamic-umalqura",
      "month": "10",
      "day": 1,
      "duration": 3,
      "eve": true
    },
    "palettes": [
      "teal",
      "rose",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
  },
  {
    "id": "eid-al-adha",
    "name": "Eid al-Adha",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "islamic-umalqura",
      "month": "12",
      "day": 10,
      "duration": 4,
      "eve": true
    },
    "palettes": [
      "olive",
      "ochre",
      "marine"
    ],
    "purpose": "celebration",
    "aliases": "Eid al Adha Eid ul Adha community sharing"
  },
  {
    "id": "diwali",
    "name": "Diwali",
    "kind": "Religious & cultural",
    "date": {
      "kind": "dates",
      "dates": {
        "2025": "10-20",
        "2026": "11-08",
        "2027": "10-29",
        "2028": "10-17"
      },
      "fallback": [
        10,
        11
      ]
    },
    "palettes": [
      "terracotta",
      "plum",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Diwali Deepavali Deepawali festival lights"
  },
  {
    "id": "holi",
    "name": "Holi",
    "kind": "Religious & cultural",
    "date": {
      "kind": "dates",
      "dates": {
        "2025": "03-14",
        "2026": "03-04",
        "2027": "03-22",
        "2028": "03-11"
      },
      "fallback": [
        2,
        3
      ]
    },
    "palettes": [
      "rose",
      "teal",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Holi festival colors Rangwali spring"
  },
  {
    "id": "nowruz",
    "name": "Nowruz",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "persian",
      "month": "1",
      "day": 1,
      "duration": 13,
      "eve": false
    },
    "palettes": [
      "sage",
      "teal",
      "rose"
    ],
    "purpose": "celebration",
    "aliases": "Nowruz Persian New Year spring equinox"
  },
  {
    "id": "vaisakhi",
    "name": "Vaisakhi",
    "kind": "Religious & cultural",
    "date": {
      "kind": "window",
      "start": [
        4,
        13
      ],
      "end": [
        4,
        14
      ]
    },
    "palettes": [
      "ochre",
      "terracotta",
      "sage"
    ],
    "purpose": "celebration",
    "aliases": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
  },
  {
    "id": "corn-maze",
    "name": "Corn Mazes",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        9,
        1
      ],
      "end": [
        10,
        31
      ]
    },
    "palettes": [
      "cider",
      "moss",
      "olive"
    ],
    "purpose": "volunteers",
    "aliases": "corn maze autumn fall farm maze hayride"
  },
  {
    "id": "trunk-or-treat",
    "name": "Trunk-or-Treat",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        10,
        1
      ],
      "end": [
        10,
        31
      ]
    },
    "palettes": [
      "terracotta",
      "plum",
      "ochre"
    ],
    "purpose": "volunteers",
    "aliases": "trunk or treat school church parking lot Halloween"
  },
  {
    "id": "fall-harvest",
    "name": "Fall Harvest",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        9,
        1
      ],
      "end": [
        11,
        15
      ]
    },
    "palettes": [
      "cider",
      "olive",
      "terracotta"
    ],
    "purpose": "celebration",
    "aliases": "fall harvest autumn pumpkin patch apple picking hayride festival"
  },
  {
    "id": "friendsgiving",
    "name": "Friendsgiving",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        11,
        1
      ],
      "end": [
        11,
        30
      ]
    },
    "palettes": [
      "cider",
      "plum",
      "terracotta"
    ],
    "purpose": "potluck",
    "aliases": "Friendsgiving friends November potluck thanks"
  },
  {
    "id": "summer-camp",
    "name": "Summer Camps",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        6,
        1
      ],
      "end": [
        8,
        31
      ]
    },
    "palettes": [
      "moss",
      "marine",
      "ochre"
    ],
    "purpose": "volunteers",
    "aliases": "summer camps day camp camp registration June July August"
  },
  {
    "id": "back-to-school",
    "name": "Back to School",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        7,
        15
      ],
      "end": [
        9,
        15
      ]
    },
    "palettes": [
      "cobalt",
      "ochre",
      "sage"
    ],
    "purpose": "volunteers",
    "aliases": "back to school classroom fall supplies August September"
  },
  {
    "id": "graduation",
    "name": "Graduation",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        5,
        1
      ],
      "end": [
        6,
        30
      ]
    },
    "palettes": [
      "slate",
      "ochre",
      "marine"
    ],
    "purpose": "celebration",
    "aliases": "graduation commencement seniors school May June"
  }
] as const satisfies readonly Omit<HolidayCollection, "designs">[];
