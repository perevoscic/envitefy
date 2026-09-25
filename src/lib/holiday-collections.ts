import type { HolidayCollection } from "./holiday-collection-types";

// Curated source: scripts/build-holiday-collections.py. Dates guide discovery only.
export const HOLIDAY_COLLECTIONS = [
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
    "aliases": "new year January brunch fresh start",
    "designs": [
      {
        "slug": "morning-light",
        "name": "Morning Light",
        "scene": "A small breakfast table by a winter window, simple coffee mugs and oranges"
      },
      {
        "slug": "first-walk",
        "name": "First Walk",
        "scene": "A quiet frosty park path in pale morning daylight"
      },
      {
        "slug": "brunch-together",
        "name": "Brunch Together",
        "scene": "A family kitchen table with pancakes, berries and mismatched plates"
      },
      {
        "slug": "fresh-chapter",
        "name": "Fresh Chapter",
        "scene": "An open blank notebook and a plain ceramic mug on a lived-in desk"
      },
      {
        "slug": "winter-kitchen",
        "name": "Winter Kitchen",
        "scene": "A loaf of bread cooling beside a tea towel in an ordinary kitchen"
      },
      {
        "slug": "open-door",
        "name": "Open Door",
        "scene": "A welcoming front porch with a simple evergreen wreath and snow on the steps"
      },
      {
        "slug": "quiet-start",
        "name": "Quiet Start",
        "scene": "A soft wool blanket, closed book and tea beside a window"
      },
      {
        "slug": "neighborhood-morning",
        "name": "Neighborhood Morning",
        "scene": "An empty neighborhood cafe with chairs and natural window light"
      },
      {
        "slug": "new-growth",
        "name": "New Growth",
        "scene": "Small potted herbs on a slightly weathered windowsill"
      },
      {
        "slug": "around-the-table",
        "name": "Around the Table",
        "scene": "A modest lunch table with linen napkins and winter greenery"
      }
    ]
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
    "aliases": "MLK Martin Luther King day of service January",
    "designs": [
      {
        "slug": "serve-together",
        "name": "Serve Together",
        "scene": "A community hall table with reusable bags and donated canned food, no readable labels"
      },
      {
        "slug": "shared-library",
        "name": "Shared Library",
        "scene": "A neighborhood little free library filled with well-used books, no readable titles"
      },
      {
        "slug": "helping-hands",
        "name": "Helping Hands",
        "scene": "Clean work gloves and a few hand tools on a park bench"
      },
      {
        "slug": "community-kitchen",
        "name": "Community Kitchen",
        "scene": "Simple soup bowls and bread arranged for a community meal"
      },
      {
        "slug": "open-circle",
        "name": "Open Circle",
        "scene": "A circle of mismatched chairs in a sunlit community room"
      },
      {
        "slug": "growing-hope",
        "name": "Growing Hope",
        "scene": "A community garden bed with young plants and a watering can"
      },
      {
        "slug": "care-packages",
        "name": "Care Packages",
        "scene": "Open cardboard care packages with socks and toiletries without labels"
      },
      {
        "slug": "learning-together",
        "name": "Learning Together",
        "scene": "Stacks of children's books and pencils on a classroom table, no legible titles"
      },
      {
        "slug": "neighborhood-care",
        "name": "Neighborhood Care",
        "scene": "A folded trash picker, gloves and reusable collection sacks at a park entrance"
      },
      {
        "slug": "a-place-for-everyone",
        "name": "A Place for Everyone",
        "scene": "An accessible community center entrance in ordinary winter daylight, no signage"
      }
    ]
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
    "aliases": "Washington birthday Presidents Day history February",
    "designs": [
      {
        "slug": "history-table",
        "name": "History Table",
        "scene": "A small arrangement of old unlettered books, reading glasses and a desk lamp"
      },
      {
        "slug": "library-afternoon",
        "name": "Library Afternoon",
        "scene": "A neighborhood library history shelf without readable titles"
      },
      {
        "slug": "civic-hall",
        "name": "Civic Hall",
        "scene": "An empty small-town civic meeting room with wooden chairs and daylight"
      },
      {
        "slug": "founding-papers",
        "name": "Founding Papers",
        "scene": "Unmarked aged paper, a simple quill and inkwell on a wooden desk"
      },
      {
        "slug": "museum-visit",
        "name": "Museum Visit",
        "scene": "A quiet historical museum corridor with distant displays, no readable text"
      },
      {
        "slug": "town-square",
        "name": "Town Square",
        "scene": "A traditional American small-town courthouse square in winter"
      },
      {
        "slug": "civic-garden",
        "name": "Civic Garden",
        "scene": "A modest flagpole beside a winter garden outside a town hall"
      },
      {
        "slug": "reading-room",
        "name": "Reading Room",
        "scene": "A wooden reading table with closed books and winter window light"
      },
      {
        "slug": "archive-desk",
        "name": "Archive Desk",
        "scene": "A box of archival folders and cotton handling gloves on a table, no labels"
      },
      {
        "slug": "community-forum",
        "name": "Community Forum",
        "scene": "A lectern and a few rows of chairs in a modest hall, no campaign material"
      }
    ]
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
    "aliases": "Memorial Day remembrance honor fallen May",
    "designs": [
      {
        "slug": "quiet-reflection",
        "name": "Quiet Reflection",
        "scene": "A simple remembrance bench with a small bouquet of white flowers in a park"
      },
      {
        "slug": "poppy-garden",
        "name": "Poppy Garden",
        "scene": "Natural red poppies growing unevenly beside a weathered stone path"
      },
      {
        "slug": "wreath-of-remembrance",
        "name": "Wreath of Remembrance",
        "scene": "A modest green remembrance wreath with a narrow red white and blue ribbon on a plain stone wall"
      },
      {
        "slug": "morning-tribute",
        "name": "Morning Tribute",
        "scene": "A small American flag planted beside white daisies in a community memorial garden"
      },
      {
        "slug": "honored-service",
        "name": "Honored Service",
        "scene": "A neatly folded triangular American flag on a wooden table beside white flowers"
      },
      {
        "slug": "gather-in-remembrance",
        "name": "Gather in Remembrance",
        "scene": "Rows of empty folding chairs facing a modest wreath in a green park"
      },
      {
        "slug": "white-roses",
        "name": "White Roses",
        "scene": "A few white roses laid on an uninscribed stone ledge in soft daylight"
      },
      {
        "slug": "peaceful-path",
        "name": "Peaceful Path",
        "scene": "A leafy path leading toward a simple uninscribed community memorial stone"
      },
      {
        "slug": "remembrance-table",
        "name": "Remembrance Table",
        "scene": "A plain white candle, small flower vase and blank guest book on a modest table"
      },
      {
        "slug": "lasting-gratitude",
        "name": "Lasting Gratitude",
        "scene": "A weathered park bench beside irises and a small unobtrusive American flag"
      }
    ]
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
    "aliases": "Juneteenth freedom emancipation June nineteenth",
    "designs": [
      {
        "slug": "community-table",
        "name": "Community Table",
        "scene": "A neighborhood picnic table with red drinks, summer fruit and simple place settings"
      },
      {
        "slug": "freedom-garden",
        "name": "Freedom Garden",
        "scene": "Red hibiscus flowers in a community garden in June daylight"
      },
      {
        "slug": "front-porch-gathering",
        "name": "Front Porch Gathering",
        "scene": "An ordinary welcoming porch with red cushions and a pitcher of iced tea"
      },
      {
        "slug": "neighborhood-picnic",
        "name": "Neighborhood Picnic",
        "scene": "Picnic blankets and baskets under a mature shade tree"
      },
      {
        "slug": "summer-reading",
        "name": "Summer Reading",
        "scene": "Books with unmarked covers and a pitcher of red hibiscus tea on a library table"
      },
      {
        "slug": "shared-recipes",
        "name": "Shared Recipes",
        "scene": "A homemade summer meal with cornbread and greens on a wooden kitchen table"
      },
      {
        "slug": "music-in-the-park",
        "name": "Music in the Park",
        "scene": "A modest outdoor community music stage with an acoustic guitar and empty chairs"
      },
      {
        "slug": "red-velvet",
        "name": "Red Velvet",
        "scene": "A homemade red velvet cake with uneven frosting on a simple serving plate"
      },
      {
        "slug": "community-market",
        "name": "Community Market",
        "scene": "A small outdoor neighborhood market with crafts and summer produce, no labels"
      },
      {
        "slug": "evening-together",
        "name": "Evening Together",
        "scene": "A backyard table with red flowers, watermelon and glasses of iced tea"
      }
    ]
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
    "aliases": "Independence Day 4th July Fourth fourth of July fireworks",
    "designs": [
      {
        "slug": "porch-picnic",
        "name": "Porch Picnic",
        "scene": "A modest porch picnic with faded red white and blue bunting and a pitcher of lemonade"
      },
      {
        "slug": "lakeside-afternoon",
        "name": "Lakeside Afternoon",
        "scene": "A picnic blanket and simple wicker basket beside an ordinary American lake"
      },
      {
        "slug": "backyard-barbecue",
        "name": "Backyard Barbecue",
        "scene": "A backyard charcoal grill and outdoor table with corn on the cob and plain plates"
      },
      {
        "slug": "main-street",
        "name": "Main Street",
        "scene": "Small American flags on a quiet small-town main street in summer daylight"
      },
      {
        "slug": "berry-bowl",
        "name": "Berry Bowl",
        "scene": "Strawberries blueberries and a white ceramic serving bowl on a picnic table"
      },
      {
        "slug": "fireworks-by-the-lake",
        "name": "Fireworks by the Lake",
        "scene": "A few believable distant fireworks above a lake after dusk, restrained exposure"
      },
      {
        "slug": "block-party",
        "name": "Block Party",
        "scene": "Folding tables and chairs being set out on a residential street with understated bunting"
      },
      {
        "slug": "summer-porch",
        "name": "Summer Porch",
        "scene": "Weathered porch chairs and a small American flag beside potted flowers"
      },
      {
        "slug": "picnic-basket",
        "name": "Picnic Basket",
        "scene": "A close view of a picnic basket with a blue cloth, red apples and lemonade"
      },
      {
        "slug": "riverside-gathering",
        "name": "Riverside Gathering",
        "scene": "A riverside picnic shelter with red checked tablecloths and small flags"
      }
    ]
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
    "aliases": "Labor Day workers September long weekend",
    "designs": [
      {
        "slug": "community-picnic",
        "name": "Community Picnic",
        "scene": "A modest late-summer community picnic table in the shade"
      },
      {
        "slug": "workshop-break",
        "name": "Workshop Break",
        "scene": "Worn work gloves and a plain lunch box on a workshop bench"
      },
      {
        "slug": "end-of-summer",
        "name": "End of Summer",
        "scene": "Empty lawn chairs beside a garden with late-summer flowers"
      },
      {
        "slug": "neighborhood-cookout",
        "name": "Neighborhood Cookout",
        "scene": "A backyard table with grilled vegetables and simple plates"
      },
      {
        "slug": "lakeside-weekend",
        "name": "Lakeside Weekend",
        "scene": "A small canoe resting beside a calm late-summer lake"
      },
      {
        "slug": "shared-lunch",
        "name": "Shared Lunch",
        "scene": "Lunch containers and mugs on a break-room table without brand labels"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A table under a backyard tree with pears and simple linen napkins"
      },
      {
        "slug": "local-makers",
        "name": "Local Makers",
        "scene": "A modest craft market table with handmade bowls and baskets"
      },
      {
        "slug": "trail-day",
        "name": "Trail Day",
        "scene": "A quiet wooded trailhead with a backpack and sturdy walking shoes"
      },
      {
        "slug": "front-porch-rest",
        "name": "Front Porch Rest",
        "scene": "A simple porch swing with a folded cotton blanket in afternoon shade"
      }
    ]
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
    "aliases": "Columbus Day October maritime history",
    "designs": [
      {
        "slug": "maritime-museum",
        "name": "Maritime Museum",
        "scene": "A small wooden sailing ship model on a maritime museum table"
      },
      {
        "slug": "harbor-history",
        "name": "Harbor History",
        "scene": "An old working harbor with weathered wooden docks under an overcast sky"
      },
      {
        "slug": "nautical-study",
        "name": "Nautical Study",
        "scene": "An unmarked compass, plain paper and rope on a wooden study table"
      },
      {
        "slug": "sailcloth",
        "name": "Sailcloth",
        "scene": "Folded natural sailcloth and weathered marine rope in soft light"
      },
      {
        "slug": "history-workshop",
        "name": "History Workshop",
        "scene": "A classroom table with unlabelled historical books and blank paper"
      },
      {
        "slug": "coastal-archive",
        "name": "Coastal Archive",
        "scene": "A quiet coastal archive room with closed document boxes without labels"
      },
      {
        "slug": "harbor-walk",
        "name": "Harbor Walk",
        "scene": "An ordinary waterfront path with small sailing boats in the distance"
      },
      {
        "slug": "museum-courtyard",
        "name": "Museum Courtyard",
        "scene": "A simple brick museum courtyard with wooden benches"
      },
      {
        "slug": "navigation-desk",
        "name": "Navigation Desk",
        "scene": "A traditional brass compass and closed journal beside a window"
      },
      {
        "slug": "community-discussion",
        "name": "Community Discussion",
        "scene": "A circle of chairs and a few plain books in a local history room"
      }
    ]
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
    "aliases": "Veterans Day November veterans appreciation service",
    "designs": [
      {
        "slug": "with-gratitude",
        "name": "With Gratitude",
        "scene": "A modest bouquet and small American flag on a community welcome table"
      },
      {
        "slug": "community-breakfast",
        "name": "Community Breakfast",
        "scene": "A simple breakfast table with coffee cups and plain pastries in a community hall"
      },
      {
        "slug": "service-stories",
        "name": "Service Stories",
        "scene": "An empty chair, blank notebook and microphone at a local oral-history event"
      },
      {
        "slug": "honor-garden",
        "name": "Honor Garden",
        "scene": "Autumn flowers and a small flag near an uninscribed park memorial"
      },
      {
        "slug": "welcome-home",
        "name": "Welcome Home",
        "scene": "A neighborhood porch with a simple American flag and autumn mums"
      },
      {
        "slug": "shared-coffee",
        "name": "Shared Coffee",
        "scene": "Plain coffee mugs and cookies on a veterans community center table, no labels"
      },
      {
        "slug": "quiet-tribute",
        "name": "Quiet Tribute",
        "scene": "A wreath of autumn leaves with a narrow patriotic ribbon against brick"
      },
      {
        "slug": "gather-to-honor",
        "name": "Gather to Honor",
        "scene": "Rows of chairs in a small-town hall with a single flag at the side"
      },
      {
        "slug": "letters-of-thanks",
        "name": "Letters of Thanks",
        "scene": "Unmarked envelopes and pencils on a volunteer packing table"
      },
      {
        "slug": "november-reflection",
        "name": "November Reflection",
        "scene": "A park bench with a small bouquet on a soft overcast November day"
      }
    ]
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
    "aliases": "Thanksgiving November gratitude turkey feast",
    "designs": [
      {
        "slug": "harvest-supper",
        "name": "Harvest Supper",
        "scene": "A modest family table with roast vegetables, bread and autumn flowers"
      },
      {
        "slug": "kitchen-preparations",
        "name": "Kitchen Preparations",
        "scene": "Homemade pies cooling on a worn kitchen counter"
      },
      {
        "slug": "gather-round",
        "name": "Gather Round",
        "scene": "A simple dining table with mismatched chairs and linen napkins"
      },
      {
        "slug": "autumn-pantry",
        "name": "Autumn Pantry",
        "scene": "Squash, apples and a loaf of bread in an ordinary kitchen"
      },
      {
        "slug": "passing-the-plate",
        "name": "Passing the Plate",
        "scene": "A serving platter of roast turkey and simple side dishes on a table"
      },
      {
        "slug": "grateful-garden",
        "name": "Grateful Garden",
        "scene": "A small arrangement of seasonal leaves and mums in a ceramic jug"
      },
      {
        "slug": "pie-social",
        "name": "Pie Social",
        "scene": "Three homemade pies with imperfect crusts on a community table"
      },
      {
        "slug": "country-table",
        "name": "Country Table",
        "scene": "A farmhouse kitchen table with plain plates and a pumpkin centerpiece"
      },
      {
        "slug": "neighborly-feast",
        "name": "Neighborly Feast",
        "scene": "Potluck dishes in everyday serving bowls on folding tables"
      },
      {
        "slug": "candlelit-supper",
        "name": "Candlelit Supper",
        "scene": "A modest dining room with a few white candles and fall foliage, natural low light"
      }
    ]
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
    "aliases": "Christmas Xmas December holiday Christmas Eve",
    "designs": [
      {
        "slug": "evergreen-kitchen",
        "name": "Evergreen Kitchen",
        "scene": "A little evergreen branch beside homemade cookies in a lived-in kitchen"
      },
      {
        "slug": "front-door-welcome",
        "name": "Front Door Welcome",
        "scene": "A simple real evergreen wreath on a weathered front door"
      },
      {
        "slug": "family-table",
        "name": "Family Table",
        "scene": "A modest Christmas meal table with red napkins and pine sprigs"
      },
      {
        "slug": "wrapped-with-care",
        "name": "Wrapped with Care",
        "scene": "A few gifts wrapped in kraft paper with cotton ribbon on a wooden table"
      },
      {
        "slug": "neighborhood-lights",
        "name": "Neighborhood Lights",
        "scene": "An ordinary residential porch with a restrained string of warm lights at dusk"
      },
      {
        "slug": "cookie-afternoon",
        "name": "Cookie Afternoon",
        "scene": "Homemade gingerbread cookies with imperfect icing on a baking tray"
      },
      {
        "slug": "winter-window",
        "name": "Winter Window",
        "scene": "A small real Christmas tree by a window with simple handmade ornaments"
      },
      {
        "slug": "community-supper",
        "name": "Community Supper",
        "scene": "Folding tables prepared for a community Christmas meal with subtle greenery"
      },
      {
        "slug": "quiet-christmas",
        "name": "Quiet Christmas",
        "scene": "A wooden church pew with evergreen decoration and soft daylight"
      },
      {
        "slug": "cozy-gathering",
        "name": "Cozy Gathering",
        "scene": "A lived-in sitting room with a small tree, wool blankets and a simple tea tray"
      }
    ]
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
    "aliases": "NYE New Years Eve countdown December",
    "designs": [
      {
        "slug": "small-celebration",
        "name": "Small Celebration",
        "scene": "A few sparkling cider glasses and simple gold paper streamers on a dining table"
      },
      {
        "slug": "city-window",
        "name": "City Window",
        "scene": "A quiet apartment dinner setting beside a window overlooking ordinary city lights"
      },
      {
        "slug": "midnight-table",
        "name": "Midnight Table",
        "scene": "A modest evening table with candles, snacks and dark linen"
      },
      {
        "slug": "paper-confetti",
        "name": "Paper Confetti",
        "scene": "A handful of handmade paper confetti and plain party hats on a wooden table"
      },
      {
        "slug": "kitchen-toast",
        "name": "Kitchen Toast",
        "scene": "Sparkling cider and citrus slices on a lived-in kitchen counter"
      },
      {
        "slug": "evening-supper",
        "name": "Evening Supper",
        "scene": "A small dinner gathering setup with plain dishes and winter flowers"
      },
      {
        "slug": "record-night",
        "name": "Record Night",
        "scene": "A turntable, records with blank sleeves and a small snack bowl"
      },
      {
        "slug": "winter-terrace",
        "name": "Winter Terrace",
        "scene": "Two outdoor chairs, wool throws and string lights on a small terrace"
      },
      {
        "slug": "golden-pears",
        "name": "Golden Pears",
        "scene": "Pears, nuts and simple glassware on a winter supper table"
      },
      {
        "slug": "after-dark",
        "name": "After Dark",
        "scene": "A small neighborhood cafe ready for an evening gathering, soft realistic lighting"
      }
    ]
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
    "aliases": "Valentines Galentines February friendship love",
    "designs": [
      {
        "slug": "paper-hearts",
        "name": "Paper Hearts",
        "scene": "Hand-cut paper hearts, scissors and twine on a classroom craft table"
      },
      {
        "slug": "garden-roses",
        "name": "Garden Roses",
        "scene": "A few natural pink roses in a chipped ceramic vase by a window"
      },
      {
        "slug": "coffee-for-two",
        "name": "Coffee for Two",
        "scene": "Two coffee cups and a small pastry on a neighborhood cafe table"
      },
      {
        "slug": "friendship-table",
        "name": "Friendship Table",
        "scene": "A modest tea table with berries and mismatched pink plates"
      },
      {
        "slug": "cookie-exchange",
        "name": "Cookie Exchange",
        "scene": "Homemade heart-shaped cookies on parchment, slightly uneven icing"
      },
      {
        "slug": "letters-and-flowers",
        "name": "Letters and Flowers",
        "scene": "Blank envelopes and a small bunch of tulips on a wooden desk"
      },
      {
        "slug": "winter-picnic",
        "name": "Winter Picnic",
        "scene": "A basket with a red checked cloth and simple homemade treats"
      },
      {
        "slug": "sweet-workshop",
        "name": "Sweet Workshop",
        "scene": "Bowls of icing and plain cupcakes on a community baking table"
      },
      {
        "slug": "pink-tulips",
        "name": "Pink Tulips",
        "scene": "An informal bunch of pink tulips in a glass jar in daylight"
      },
      {
        "slug": "shared-dessert",
        "name": "Shared Dessert",
        "scene": "A homemade chocolate cake and two forks on a simple kitchen table"
      }
    ]
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
    "aliases": "Saint Patricks Irish March shamrock",
    "designs": [
      {
        "slug": "green-table",
        "name": "Green Table",
        "scene": "A casual table with a green linen runner and small potted shamrocks"
      },
      {
        "slug": "soda-bread",
        "name": "Soda Bread",
        "scene": "A homemade loaf of Irish soda bread and butter in an ordinary kitchen"
      },
      {
        "slug": "spring-clover",
        "name": "Spring Clover",
        "scene": "Close view of real clover growing beside a weathered stone wall"
      },
      {
        "slug": "neighborhood-supper",
        "name": "Neighborhood Supper",
        "scene": "A modest community supper table with green napkins and plain dishes"
      },
      {
        "slug": "irish-tea",
        "name": "Irish Tea",
        "scene": "A pot of tea and simple biscuits beside a green wool scarf"
      },
      {
        "slug": "music-evening",
        "name": "Music Evening",
        "scene": "An acoustic fiddle and a small wooden flute on a chair in a community room"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A simple outdoor table beside early spring greenery"
      },
      {
        "slug": "paper-garland",
        "name": "Paper Garland",
        "scene": "Handmade green paper garlands above a classroom craft table"
      },
      {
        "slug": "pot-of-clover",
        "name": "Pot of Clover",
        "scene": "A terracotta pot of shamrocks on a kitchen windowsill"
      },
      {
        "slug": "local-gathering",
        "name": "Local Gathering",
        "scene": "An ordinary cozy cafe corner with subtle green decorations, no alcohol branding"
      }
    ]
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
    "aliases": "Mardi Gras Fat Tuesday carnival",
    "designs": [
      {
        "slug": "king-cake",
        "name": "King Cake",
        "scene": "A homemade ring-shaped king cake with modest purple green and gold sugar"
      },
      {
        "slug": "paper-carnival",
        "name": "Paper Carnival",
        "scene": "Handmade purple green and gold paper garlands on a community table"
      },
      {
        "slug": "brass-afternoon",
        "name": "Brass Afternoon",
        "scene": "An unbranded brass trumpet on a worn wooden chair beside a window"
      },
      {
        "slug": "porch-colors",
        "name": "Porch Colors",
        "scene": "A modest neighborhood porch with a few purple green and gold ribbons"
      },
      {
        "slug": "carnival-table",
        "name": "Carnival Table",
        "scene": "Plain plates, a simple cake and folded colorful napkins for a small gathering"
      },
      {
        "slug": "handmade-masks",
        "name": "Handmade Masks",
        "scene": "Simple paper carnival masks and craft supplies without faces"
      },
      {
        "slug": "neighborhood-music",
        "name": "Neighborhood Music",
        "scene": "A small outdoor music setup with drums and brass instruments, no people"
      },
      {
        "slug": "ribbon-workshop",
        "name": "Ribbon Workshop",
        "scene": "Spools of colored ribbon and scissors on a craft table"
      },
      {
        "slug": "community-supper",
        "name": "Community Supper",
        "scene": "Everyday serving dishes on a table with understated carnival decorations"
      },
      {
        "slug": "courtyard-gathering",
        "name": "Courtyard Gathering",
        "scene": "A modest brick courtyard with folding chairs and small paper lanterns"
      }
    ]
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
    "aliases": "Easter Sunday spring egg hunt",
    "designs": [
      {
        "slug": "garden-egg-hunt",
        "name": "Garden Egg Hunt",
        "scene": "A few naturally dyed eggs partly hidden in uneven spring grass"
      },
      {
        "slug": "spring-basket",
        "name": "Spring Basket",
        "scene": "A wicker basket with softly colored eggs and a simple linen cloth"
      },
      {
        "slug": "easter-brunch",
        "name": "Easter Brunch",
        "scene": "A modest brunch table with daffodils, bread and boiled eggs"
      },
      {
        "slug": "quiet-morning",
        "name": "Quiet Morning",
        "scene": "White lilies beside a plain wooden cross in a softly lit church alcove"
      },
      {
        "slug": "painted-eggs",
        "name": "Painted Eggs",
        "scene": "Hand-painted eggs with imperfect marks drying on a kitchen table"
      },
      {
        "slug": "garden-table",
        "name": "Garden Table",
        "scene": "A simple outdoor spring table with tulips and pale napkins"
      },
      {
        "slug": "spring-baking",
        "name": "Spring Baking",
        "scene": "Homemade hot cross buns on a cooling rack in a kitchen"
      },
      {
        "slug": "daffodil-path",
        "name": "Daffodil Path",
        "scene": "Daffodils growing beside a weathered garden gate"
      },
      {
        "slug": "community-hunt",
        "name": "Community Hunt",
        "scene": "Small baskets and a few scattered pastel eggs in a neighborhood park"
      },
      {
        "slug": "family-lunch",
        "name": "Family Lunch",
        "scene": "A modest family lunch setting with spring greenery and plain white plates"
      }
    ]
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
    "aliases": "Mothers Day mom mum May brunch",
    "designs": [
      {
        "slug": "garden-brunch",
        "name": "Garden Brunch",
        "scene": "A small garden table with tea, toast and an informal bouquet"
      },
      {
        "slug": "peony-morning",
        "name": "Peony Morning",
        "scene": "A few peonies in a glass jar on a kitchen windowsill"
      },
      {
        "slug": "breakfast-tray",
        "name": "Breakfast Tray",
        "scene": "A simple breakfast tray with coffee and homemade toast"
      },
      {
        "slug": "tea-together",
        "name": "Tea Together",
        "scene": "Mismatched teacups and a homemade cake on a dining table"
      },
      {
        "slug": "handmade-bouquet",
        "name": "Handmade Bouquet",
        "scene": "An informal bunch of garden flowers tied with plain string"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "A modest kitchen counter with a mixing bowl and a fresh cake"
      },
      {
        "slug": "porch-afternoon",
        "name": "Porch Afternoon",
        "scene": "Two porch chairs and a small vase of spring flowers"
      },
      {
        "slug": "garden-walk",
        "name": "Garden Walk",
        "scene": "A quiet garden path lined with irises and green foliage"
      },
      {
        "slug": "crafted-with-love",
        "name": "Crafted with Love",
        "scene": "Blank folded cards, colored pencils and pressed flowers on a table"
      },
      {
        "slug": "sunday-lunch",
        "name": "Sunday Lunch",
        "scene": "A simple lunch table with cloth napkins and natural garden cuttings"
      }
    ]
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
    "aliases": "Fathers Day dad June",
    "designs": [
      {
        "slug": "backyard-lunch",
        "name": "Backyard Lunch",
        "scene": "A modest backyard table with sandwiches and a pitcher of iced tea"
      },
      {
        "slug": "workshop-morning",
        "name": "Workshop Morning",
        "scene": "A small woodworking bench with worn hand tools and a coffee cup"
      },
      {
        "slug": "trail-together",
        "name": "Trail Together",
        "scene": "Walking boots and a daypack beside a wooded trail"
      },
      {
        "slug": "coffee-break",
        "name": "Coffee Break",
        "scene": "A plain coffee mug and folded newspaper without readable text on a porch"
      },
      {
        "slug": "lakeside-day",
        "name": "Lakeside Day",
        "scene": "A small fishing tackle box and folding chair beside a quiet lake"
      },
      {
        "slug": "family-cookout",
        "name": "Family Cookout",
        "scene": "An ordinary charcoal grill with vegetables beside a picnic table"
      },
      {
        "slug": "garden-time",
        "name": "Garden Time",
        "scene": "Work gloves, pruning shears and a terracotta pot on a garden bench"
      },
      {
        "slug": "sunday-pancakes",
        "name": "Sunday Pancakes",
        "scene": "Homemade pancakes and berries on a simple kitchen table"
      },
      {
        "slug": "game-afternoon",
        "name": "Game Afternoon",
        "scene": "A worn baseball glove and plain ball on grass beside a picnic basket"
      },
      {
        "slug": "front-porch",
        "name": "Front Porch",
        "scene": "Two weathered porch chairs and a small table with lemonade"
      }
    ]
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
    "aliases": "Earth Day April environment cleanup planet",
    "designs": [
      {
        "slug": "seedling-morning",
        "name": "Seedling Morning",
        "scene": "Young seedlings in reused pots on a community greenhouse bench"
      },
      {
        "slug": "park-cleanup",
        "name": "Park Cleanup",
        "scene": "Reusable litter bags and work gloves beside a park path"
      },
      {
        "slug": "garden-tools",
        "name": "Garden Tools",
        "scene": "Used hand tools and soil on a garden table"
      },
      {
        "slug": "river-care",
        "name": "River Care",
        "scene": "A clean riverbank with a trash picker and reusable sack"
      },
      {
        "slug": "native-flowers",
        "name": "Native Flowers",
        "scene": "A patch of native wildflowers growing naturally in a neighborhood garden"
      },
      {
        "slug": "compost-corner",
        "name": "Compost Corner",
        "scene": "A small backyard compost bin beside a vegetable bed"
      },
      {
        "slug": "repair-together",
        "name": "Repair Together",
        "scene": "A community repair table with a lamp, basic tools and mending supplies"
      },
      {
        "slug": "plant-swap",
        "name": "Plant Swap",
        "scene": "A modest table of assorted potted plants at a neighborhood plant swap"
      },
      {
        "slug": "tree-day",
        "name": "Tree Day",
        "scene": "A small sapling and a spade beside a freshly dug garden hole"
      },
      {
        "slug": "reuse-workshop",
        "name": "Reuse Workshop",
        "scene": "Glass jars and fabric scraps on an ordinary community craft table"
      }
    ]
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
    "aliases": "Cinco de Mayo May fifth Mexican culture Puebla",
    "designs": [
      {
        "slug": "community-table",
        "name": "Community Table",
        "scene": "A modest Mexican community meal table with handmade tortillas and colorful cloth napkins"
      },
      {
        "slug": "paper-banners",
        "name": "Paper Banners",
        "scene": "A few papel picado banners above a simple courtyard gathering"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "Homemade tamales on a ceramic plate in a lived-in kitchen"
      },
      {
        "slug": "puebla-ceramics",
        "name": "Puebla Ceramics",
        "scene": "A few hand-painted ceramic bowls on a rustic kitchen shelf"
      },
      {
        "slug": "courtyard-lunch",
        "name": "Courtyard Lunch",
        "scene": "A small courtyard table with flowers, plain plates and fresh lime water"
      },
      {
        "slug": "cooking-together",
        "name": "Cooking Together",
        "scene": "A bowl of masa, rolling pin and simple cooking utensils on a worktop"
      },
      {
        "slug": "flower-market",
        "name": "Flower Market",
        "scene": "A modest market bucket of colorful fresh flowers beside simple woven baskets"
      },
      {
        "slug": "shared-recipes",
        "name": "Shared Recipes",
        "scene": "Everyday serving dishes with beans, rice and tortillas on a table"
      },
      {
        "slug": "music-gathering",
        "name": "Music Gathering",
        "scene": "An acoustic guitar beside chairs in a modest community room"
      },
      {
        "slug": "neighborhood-celebration",
        "name": "Neighborhood Celebration",
        "scene": "A residential courtyard with a small number of paper banners and folding chairs"
      }
    ]
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
    "aliases": "Halloween October spooky costumes trick or treat",
    "designs": [
      {
        "slug": "pumpkin-porch",
        "name": "Pumpkin Porch",
        "scene": "Two imperfectly carved pumpkins on an ordinary weathered porch in overcast daylight"
      },
      {
        "slug": "friendly-ghosts",
        "name": "Friendly Ghosts",
        "scene": "Handmade white paper ghosts hanging above a simple classroom table"
      },
      {
        "slug": "autumn-doorstep",
        "name": "Autumn Doorstep",
        "scene": "An ordinary front step with one pumpkin and a pot of mums"
      },
      {
        "slug": "cookie-monsters",
        "name": "Cookie Monsters",
        "scene": "Homemade Halloween cookies with slightly uneven icing on a kitchen tray"
      },
      {
        "slug": "neighborhood-night",
        "name": "Neighborhood Night",
        "scene": "A real residential sidewalk at blue hour with a few modest porch decorations"
      },
      {
        "slug": "paper-bats",
        "name": "Paper Bats",
        "scene": "Hand-cut black paper bats and scissors on a family craft table"
      },
      {
        "slug": "pumpkin-workshop",
        "name": "Pumpkin Workshop",
        "scene": "Partly carved pumpkins and ordinary carving tools on a covered outdoor table"
      },
      {
        "slug": "harvest-treats",
        "name": "Harvest Treats",
        "scene": "Bowls of wrapped unbranded sweets on a small Halloween welcome table"
      },
      {
        "slug": "cozy-spooky",
        "name": "Cozy Spooky",
        "scene": "A small living room with a few paper decorations and orange cushions"
      },
      {
        "slug": "lantern-walk",
        "name": "Lantern Walk",
        "scene": "A couple of simple pumpkin lanterns beside a garden path at dusk"
      }
    ]
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
    "aliases": "Indigenous Peoples Day October Native community",
    "designs": [
      {
        "slug": "community-learning",
        "name": "Community Learning",
        "scene": "A welcoming community reading table with unlettered books and simple flowers"
      },
      {
        "slug": "land-and-water",
        "name": "Land and Water",
        "scene": "A natural river bend with native trees in ordinary autumn daylight"
      },
      {
        "slug": "native-garden",
        "name": "Native Garden",
        "scene": "A community garden with native plants, no ceremonial objects"
      },
      {
        "slug": "shared-conversation",
        "name": "Shared Conversation",
        "scene": "A circle of chairs in a simple community room with daylight"
      },
      {
        "slug": "local-voices",
        "name": "Local Voices",
        "scene": "A microphone and empty chair at a small community storytelling event"
      },
      {
        "slug": "stewardship-day",
        "name": "Stewardship Day",
        "scene": "Gardening gloves and a sapling beside a community planting site"
      },
      {
        "slug": "harvest-table",
        "name": "Harvest Table",
        "scene": "Locally grown squash and corn in a simple woven basket, no sacred imagery"
      },
      {
        "slug": "neighborhood-gathering",
        "name": "Neighborhood Gathering",
        "scene": "A modest outdoor community table in the shade of mature trees"
      },
      {
        "slug": "living-landscape",
        "name": "Living Landscape",
        "scene": "A quiet woodland path with natural autumn undergrowth"
      },
      {
        "slug": "learning-circle",
        "name": "Learning Circle",
        "scene": "Blank paper and pencils on a community workshop table, no invented tribal patterns"
      }
    ]
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
    "aliases": "Dia de los Muertos Day of the Dead November remembrance",
    "designs": [
      {
        "slug": "marigold-morning",
        "name": "Marigold Morning",
        "scene": "Fresh orange marigolds in an ordinary ceramic vase beside a window"
      },
      {
        "slug": "remembrance-table",
        "name": "Remembrance Table",
        "scene": "A small respectful home ofrenda with marigolds and candles, no invented portraits"
      },
      {
        "slug": "pan-de-muerto",
        "name": "Pan de Muerto",
        "scene": "Homemade pan de muerto on a plain plate with a few marigolds nearby"
      },
      {
        "slug": "paper-flowers",
        "name": "Paper Flowers",
        "scene": "Tissue paper marigolds and simple craft supplies on a table"
      },
      {
        "slug": "courtyard-marigolds",
        "name": "Courtyard Marigolds",
        "scene": "Pots of marigolds in a modest residential courtyard"
      },
      {
        "slug": "shared-memories",
        "name": "Shared Memories",
        "scene": "A blank photo frame, simple candle and small marigold bouquet on a table"
      },
      {
        "slug": "candle-and-petals",
        "name": "Candle and Petals",
        "scene": "A single candle in a plain holder beside scattered marigold petals"
      },
      {
        "slug": "community-workshop",
        "name": "Community Workshop",
        "scene": "A modest table with paper flower supplies and unpainted craft objects"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "Homemade bread and a pot of hot chocolate in a lived-in Mexican kitchen"
      },
      {
        "slug": "flower-path",
        "name": "Flower Path",
        "scene": "A short simple line of marigold petals leading to a modest decorated doorway"
      }
    ]
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
    "aliases": "Lunar Chinese Korean Vietnamese New Year Tet Seollal",
    "designs": [
      {
        "slug": "red-lanterns",
        "name": "Red Lanterns",
        "scene": "Two simple red paper lanterns above a modest neighborhood courtyard"
      },
      {
        "slug": "mandarin-table",
        "name": "Mandarin Table",
        "scene": "A bowl of mandarins and a few plain red envelopes on a wooden table"
      },
      {
        "slug": "family-dumplings",
        "name": "Family Dumplings",
        "scene": "Handmade dumplings being prepared on a kitchen worktop, no hands visible"
      },
      {
        "slug": "spring-branches",
        "name": "Spring Branches",
        "scene": "A few flowering plum branches in a simple ceramic vase"
      },
      {
        "slug": "tea-and-fruit",
        "name": "Tea and Fruit",
        "scene": "A small teapot, everyday cups and citrus fruit on a family table"
      },
      {
        "slug": "paper-workshop",
        "name": "Paper Workshop",
        "scene": "Red paper, scissors and string on a community craft table, no text"
      },
      {
        "slug": "courtyard-welcome",
        "name": "Courtyard Welcome",
        "scene": "A modest doorway with simple red decorations and potted plants"
      },
      {
        "slug": "shared-supper",
        "name": "Shared Supper",
        "scene": "A family reunion meal with everyday dishes and red cloth napkins"
      },
      {
        "slug": "lantern-afternoon",
        "name": "Lantern Afternoon",
        "scene": "Paper lanterns resting on a community hall table before a gathering"
      },
      {
        "slug": "new-year-kitchen",
        "name": "New Year Kitchen",
        "scene": "A tray of rice cakes and a plain red cloth in a lived-in kitchen"
      }
    ]
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
    "aliases": "Passover Pesach seder spring",
    "designs": [
      {
        "slug": "seder-table",
        "name": "Seder Table",
        "scene": "A modest Passover table with matzah, plain plates and a simple wine cup"
      },
      {
        "slug": "matzah-and-linen",
        "name": "Matzah and Linen",
        "scene": "Matzah on a ceramic plate beside a folded linen cloth"
      },
      {
        "slug": "spring-welcome",
        "name": "Spring Welcome",
        "scene": "A simple vase of spring flowers beside a Passover table setting"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "A bowl of charoset and matzah on an ordinary kitchen counter"
      },
      {
        "slug": "quiet-preparation",
        "name": "Quiet Preparation",
        "scene": "Plain dishes, parsley and a small saltwater bowl on a wooden table"
      },
      {
        "slug": "community-seder",
        "name": "Community Seder",
        "scene": "Long tables in a modest community room prepared with matzah and simple dishes"
      },
      {
        "slug": "silver-cup",
        "name": "Silver Cup",
        "scene": "A simple silver kiddush cup beside matzah on a linen cloth"
      },
      {
        "slug": "spring-window",
        "name": "Spring Window",
        "scene": "A small bunch of tulips and a matzah plate beside a kitchen window"
      },
      {
        "slug": "gather-together",
        "name": "Gather Together",
        "scene": "A home dining table with mismatched chairs, matzah and plain glassware"
      },
      {
        "slug": "shared-traditions",
        "name": "Shared Traditions",
        "scene": "A small covered matzah plate and two plain candles on a sideboard"
      }
    ]
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
    "aliases": "Rosh Hashanah Jewish New Year apples honey",
    "designs": [
      {
        "slug": "apples-and-honey",
        "name": "Apples and Honey",
        "scene": "A sliced apple and a small honey jar on a simple wooden table"
      },
      {
        "slug": "round-challah",
        "name": "Round Challah",
        "scene": "A homemade round challah on a linen cloth in a kitchen"
      },
      {
        "slug": "sweet-beginning",
        "name": "Sweet Beginning",
        "scene": "A modest holiday table with apples, honey and ordinary plates"
      },
      {
        "slug": "autumn-orchard",
        "name": "Autumn Orchard",
        "scene": "A real apple orchard in soft overcast early-autumn daylight"
      },
      {
        "slug": "pomegranate-table",
        "name": "Pomegranate Table",
        "scene": "A few pomegranates and a ceramic bowl on a kitchen table"
      },
      {
        "slug": "family-gathering",
        "name": "Family Gathering",
        "scene": "A home dining table with round challah and seasonal flowers"
      },
      {
        "slug": "honey-cake",
        "name": "Honey Cake",
        "scene": "A homemade honey cake with an imperfect crust on a plain plate"
      },
      {
        "slug": "quiet-reflection",
        "name": "Quiet Reflection",
        "scene": "A simple bench beside a gentle stream in early autumn"
      },
      {
        "slug": "community-welcome",
        "name": "Community Welcome",
        "scene": "A community hall table with apples, honey and plain serving dishes"
      },
      {
        "slug": "golden-kitchen",
        "name": "Golden Kitchen",
        "scene": "Apples in a basket beside a jar of honey on a lived-in kitchen counter"
      }
    ]
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
    "aliases": "Yom Kippur Day of Atonement reflection",
    "designs": [
      {
        "slug": "quiet-candle",
        "name": "Quiet Candle",
        "scene": "A single plain white memorial candle on an uncluttered wooden table"
      },
      {
        "slug": "reflection-garden",
        "name": "Reflection Garden",
        "scene": "A quiet garden bench beside white autumn flowers"
      },
      {
        "slug": "open-door",
        "name": "Open Door",
        "scene": "A simple synagogue entrance in soft daylight, no readable signage"
      },
      {
        "slug": "still-water",
        "name": "Still Water",
        "scene": "A calm pond bordered by autumn reeds under an overcast sky"
      },
      {
        "slug": "white-linen",
        "name": "White Linen",
        "scene": "A neatly folded white linen cloth beside a plain candle holder"
      },
      {
        "slug": "community-space",
        "name": "Community Space",
        "scene": "A modest quiet room with rows of wooden chairs and natural light"
      },
      {
        "slug": "autumn-light",
        "name": "Autumn Light",
        "scene": "Soft daylight falling across an empty wooden bench and pale wall"
      },
      {
        "slug": "peaceful-path",
        "name": "Peaceful Path",
        "scene": "A quiet tree-lined path with scattered early autumn leaves"
      },
      {
        "slug": "gather-in-reflection",
        "name": "Gather in Reflection",
        "scene": "A circle of empty chairs in a calm community room"
      },
      {
        "slug": "evening-candle",
        "name": "Evening Candle",
        "scene": "One simple white candle glowing beside a window at dusk, realistic exposure"
      }
    ]
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
    "aliases": "Sukkot sukkah harvest Jewish fall",
    "designs": [
      {
        "slug": "garden-sukkah",
        "name": "Garden Sukkah",
        "scene": "A modest backyard sukkah with a branch-covered roof and a simple table"
      },
      {
        "slug": "harvest-basket",
        "name": "Harvest Basket",
        "scene": "An etrog citron and seasonal fruit in a plain basket on a table"
      },
      {
        "slug": "under-the-branches",
        "name": "Under the Branches",
        "scene": "A small family table inside a simple sukkah, leafy roof visible"
      },
      {
        "slug": "paper-chains",
        "name": "Paper Chains",
        "scene": "Handmade paper chains decorating a modest outdoor sukkah"
      },
      {
        "slug": "autumn-welcome",
        "name": "Autumn Welcome",
        "scene": "A simple sukkah entrance with potted plants and seasonal fruit"
      },
      {
        "slug": "shared-supper",
        "name": "Shared Supper",
        "scene": "Everyday dishes and bread on a table beneath a leafy sukkah roof"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "Folding chairs around a modest table inside a backyard sukkah"
      },
      {
        "slug": "harvest-kitchen",
        "name": "Harvest Kitchen",
        "scene": "Pomegranates, apples and squash on a lived-in kitchen counter"
      },
      {
        "slug": "afternoon-shade",
        "name": "Afternoon Shade",
        "scene": "Sunlight filtered through natural branches above a simple outdoor table"
      },
      {
        "slug": "community-sukkah",
        "name": "Community Sukkah",
        "scene": "A modest community sukkah with folding tables and restrained decorations"
      }
    ]
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
    "aliases": "Hanukkah Chanukah festival lights dreidel",
    "designs": [
      {
        "slug": "window-lights",
        "name": "Window Lights",
        "scene": "A simple nine-branched hanukkiah on a windowsill, eight equal-height candle holders and one elevated central shamash, natural home setting"
      },
      {
        "slug": "latke-kitchen",
        "name": "Latke Kitchen",
        "scene": "Homemade latkes and applesauce on plain plates in an ordinary kitchen"
      },
      {
        "slug": "dreidel-afternoon",
        "name": "Dreidel Afternoon",
        "scene": "A few plain wooden dreidels beside chocolate coins on a table, no readable lettering"
      },
      {
        "slug": "family-table",
        "name": "Family Table",
        "scene": "A modest holiday supper table with blue napkins and simple flowers"
      },
      {
        "slug": "sufganiyot",
        "name": "Sufganiyot",
        "scene": "Homemade jelly doughnuts with uneven powdered sugar on a plain serving plate"
      },
      {
        "slug": "blue-and-linen",
        "name": "Blue and Linen",
        "scene": "A table setting with blue cloth napkins, ordinary plates and beeswax candles"
      },
      {
        "slug": "community-supper",
        "name": "Community Supper",
        "scene": "Folding tables prepared for a community Hanukkah meal with subtle blue decorations"
      },
      {
        "slug": "handmade-stars",
        "name": "Handmade Stars",
        "scene": "Paper star decorations and craft supplies on a family table"
      },
      {
        "slug": "winter-welcome",
        "name": "Winter Welcome",
        "scene": "A modest doorway with blue paper decorations and a small winter plant"
      },
      {
        "slug": "kitchen-gathering",
        "name": "Kitchen Gathering",
        "scene": "A well-used kitchen counter with dough, jam and a tray of doughnuts"
      }
    ]
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
    "aliases": "Kwanzaa December January community harvest",
    "designs": [
      {
        "slug": "harvest-table",
        "name": "Harvest Table",
        "scene": "A simple woven mat with corn, fruit and a plain wooden bowl on a family table"
      },
      {
        "slug": "seven-candles",
        "name": "Seven Candles",
        "scene": "A simple kinara with exactly seven candles, three red on the left, one black in the center and three green on the right, on a modest table"
      },
      {
        "slug": "community-gathering",
        "name": "Community Gathering",
        "scene": "A modest community table with red green and black cloth napkins"
      },
      {
        "slug": "shared-fruit",
        "name": "Shared Fruit",
        "scene": "A basket of oranges, apples and corn on an ordinary wooden table"
      },
      {
        "slug": "family-meal",
        "name": "Family Meal",
        "scene": "A home meal setting with greens, bread and everyday serving dishes"
      },
      {
        "slug": "handmade-gifts",
        "name": "Handmade Gifts",
        "scene": "A few small gifts wrapped in plain kraft paper with red and green ribbon"
      },
      {
        "slug": "story-circle",
        "name": "Story Circle",
        "scene": "A circle of chairs with a small table of unlettered books in a community room"
      },
      {
        "slug": "woven-textures",
        "name": "Woven Textures",
        "scene": "A natural woven mat and plain ceramic cup beside seasonal fruit"
      },
      {
        "slug": "neighborhood-supper",
        "name": "Neighborhood Supper",
        "scene": "Folding tables set for a community supper with restrained red and green decorations"
      },
      {
        "slug": "growing-community",
        "name": "Growing Community",
        "scene": "A basket of harvest produce beside potted plants on a simple porch"
      }
    ]
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
    "aliases": "Ramadan Ramazan iftar suhoor community",
    "designs": [
      {
        "slug": "dates-and-water",
        "name": "Dates and Water",
        "scene": "A small bowl of dates and two glasses of water on a modest iftar table"
      },
      {
        "slug": "evening-welcome",
        "name": "Evening Welcome",
        "scene": "A simple metal lantern beside a doorway at realistic dusk"
      },
      {
        "slug": "community-iftar",
        "name": "Community Iftar",
        "scene": "Long tables in a modest community hall prepared with dates and water"
      },
      {
        "slug": "shared-soup",
        "name": "Shared Soup",
        "scene": "Plain bowls of soup and bread on a family table after sunset"
      },
      {
        "slug": "quiet-lantern",
        "name": "Quiet Lantern",
        "scene": "An ordinary metal lantern on a wooden windowsill in soft daylight"
      },
      {
        "slug": "family-preparation",
        "name": "Family Preparation",
        "scene": "A kitchen counter with fresh dates, bread and simple serving dishes"
      },
      {
        "slug": "tea-after-sunset",
        "name": "Tea After Sunset",
        "scene": "A small tea tray beside a window at blue hour"
      },
      {
        "slug": "neighborhood-table",
        "name": "Neighborhood Table",
        "scene": "A modest outdoor meal table with dates and pitchers of water"
      },
      {
        "slug": "giving-together",
        "name": "Giving Together",
        "scene": "Plain food packages and reusable bags on a community donation table"
      },
      {
        "slug": "evening-courtyard",
        "name": "Evening Courtyard",
        "scene": "A small residential courtyard with simple chairs and one lantern at dusk"
      }
    ]
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
    "aliases": "Eid al Fitr Eid ul Fitr celebration end Ramadan",
    "designs": [
      {
        "slug": "morning-sweets",
        "name": "Morning Sweets",
        "scene": "Homemade Eid pastries and a small teapot on a family table"
      },
      {
        "slug": "open-house",
        "name": "Open House",
        "scene": "A modest welcoming doorway with flowers and simple paper decorations"
      },
      {
        "slug": "family-brunch",
        "name": "Family Brunch",
        "scene": "A home brunch table with plain dishes, fruit and tea"
      },
      {
        "slug": "gift-envelopes",
        "name": "Gift Envelopes",
        "scene": "Plain colored gift envelopes and small wrapped presents on a wooden table"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A simple garden table with flowers and a tea tray"
      },
      {
        "slug": "community-lunch",
        "name": "Community Lunch",
        "scene": "Long tables in a community hall with everyday serving dishes"
      },
      {
        "slug": "sweet-exchange",
        "name": "Sweet Exchange",
        "scene": "A plate of homemade date-filled cookies wrapped for sharing"
      },
      {
        "slug": "spring-flowers",
        "name": "Spring Flowers",
        "scene": "An informal bouquet and a small dish of sweets beside a window"
      },
      {
        "slug": "tea-together",
        "name": "Tea Together",
        "scene": "Ordinary teacups and pastries on a modest living-room table"
      },
      {
        "slug": "neighborhood-welcome",
        "name": "Neighborhood Welcome",
        "scene": "A residential courtyard with folding chairs and subtle festive decorations"
      }
    ]
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
    "aliases": "Eid al Adha Eid ul Adha community sharing",
    "designs": [
      {
        "slug": "shared-table",
        "name": "Shared Table",
        "scene": "A modest family Eid meal with rice, vegetables and ordinary serving dishes"
      },
      {
        "slug": "giving-day",
        "name": "Giving Day",
        "scene": "Plain food parcels and reusable bags on a community distribution table"
      },
      {
        "slug": "garden-lunch",
        "name": "Garden Lunch",
        "scene": "A simple outdoor lunch table with fresh flowers and plain plates"
      },
      {
        "slug": "family-welcome",
        "name": "Family Welcome",
        "scene": "A modest doorway with a small flower arrangement and simple festive ribbons"
      },
      {
        "slug": "tea-and-dates",
        "name": "Tea and Dates",
        "scene": "A small tea tray and dates on a lived-in dining table"
      },
      {
        "slug": "community-meal",
        "name": "Community Meal",
        "scene": "Folding tables prepared for a community lunch with understated decoration"
      },
      {
        "slug": "wrapped-with-care",
        "name": "Wrapped with Care",
        "scene": "A few small gifts in plain paper on a wooden sideboard"
      },
      {
        "slug": "kitchen-preparations",
        "name": "Kitchen Preparations",
        "scene": "Everyday pots and fresh ingredients in a family kitchen"
      },
      {
        "slug": "neighborly-sharing",
        "name": "Neighborly Sharing",
        "scene": "Covered food containers ready to share on a plain kitchen counter"
      },
      {
        "slug": "courtyard-together",
        "name": "Courtyard Together",
        "scene": "A modest courtyard with chairs, a simple table and potted greenery"
      }
    ]
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
    "aliases": "Diwali Deepavali Deepawali festival lights",
    "designs": [
      {
        "slug": "clay-lamps",
        "name": "Clay Lamps",
        "scene": "A few ordinary clay diyas on a worn stone doorstep at dusk"
      },
      {
        "slug": "marigold-welcome",
        "name": "Marigold Welcome",
        "scene": "A simple marigold garland on a modest home doorway"
      },
      {
        "slug": "sweets-to-share",
        "name": "Sweets to Share",
        "scene": "Homemade Indian sweets in a plain steel serving tray"
      },
      {
        "slug": "family-rangoli",
        "name": "Family Rangoli",
        "scene": "A small handmade rangoli with slightly uneven colored powder on a courtyard floor"
      },
      {
        "slug": "evening-table",
        "name": "Evening Table",
        "scene": "A modest family table with small diyas and everyday dishes"
      },
      {
        "slug": "lamp-workshop",
        "name": "Lamp Workshop",
        "scene": "Unpainted clay diyas and simple craft supplies on a community table"
      },
      {
        "slug": "courtyard-lights",
        "name": "Courtyard Lights",
        "scene": "A few diyas along a modest courtyard wall at realistic evening exposure"
      },
      {
        "slug": "gift-of-sweets",
        "name": "Gift of Sweets",
        "scene": "A small box of homemade sweets wrapped with plain ribbon"
      },
      {
        "slug": "kitchen-gathering",
        "name": "Kitchen Gathering",
        "scene": "A lived-in kitchen counter with flour, a mixing bowl and prepared sweets"
      },
      {
        "slug": "quiet-glow",
        "name": "Quiet Glow",
        "scene": "Two small clay lamps beside marigold petals on a wooden sideboard"
      }
    ]
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
    "aliases": "Holi festival colors Rangwali spring",
    "designs": [
      {
        "slug": "bowls-of-color",
        "name": "Bowls of Color",
        "scene": "Small plain bowls of pink yellow and blue Holi powder on a worn outdoor table"
      },
      {
        "slug": "spring-gathering",
        "name": "Spring Gathering",
        "scene": "A modest park picnic setup with a few bowls of Holi colors"
      },
      {
        "slug": "color-workshop",
        "name": "Color Workshop",
        "scene": "Paper and simple color powder bowls on a community craft table"
      },
      {
        "slug": "sweet-spring",
        "name": "Sweet Spring",
        "scene": "Homemade gujiya on a steel plate beside a small bowl of color"
      },
      {
        "slug": "courtyard-colors",
        "name": "Courtyard Colors",
        "scene": "A modest courtyard with a few natural powder stains on the stone floor"
      },
      {
        "slug": "flower-welcome",
        "name": "Flower Welcome",
        "scene": "Bright spring flowers in ordinary jars beside a gathering table"
      },
      {
        "slug": "picnic-and-color",
        "name": "Picnic and Color",
        "scene": "A plain picnic blanket with snacks and sealed packets of Holi powder without labels"
      },
      {
        "slug": "handmade-garland",
        "name": "Handmade Garland",
        "scene": "Simple colorful paper garlands above an outdoor community table"
      },
      {
        "slug": "kitchen-treats",
        "name": "Kitchen Treats",
        "scene": "A lived-in kitchen with a tray of homemade festival sweets"
      },
      {
        "slug": "after-the-colors",
        "name": "After the Colors",
        "scene": "Folded white cotton cloth with small powder stains beside a bowl of flowers"
      }
    ]
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
    "aliases": "Nowruz Persian New Year spring equinox",
    "designs": [
      {
        "slug": "spring-hyacinths",
        "name": "Spring Hyacinths",
        "scene": "A pot of real hyacinths beside a window in a modest home"
      },
      {
        "slug": "green-shoots",
        "name": "Green Shoots",
        "scene": "A small dish of wheat sprouts on a family table"
      },
      {
        "slug": "haft-sin-details",
        "name": "Haft Sin Details",
        "scene": "Apples, garlic, a dish of sprouts and a simple mirror on a modest Nowruz table, no goldfish"
      },
      {
        "slug": "family-tea",
        "name": "Family Tea",
        "scene": "Tea glasses and homemade pastries on a lived-in dining table"
      },
      {
        "slug": "spring-orchard",
        "name": "Spring Orchard",
        "scene": "Blossoming fruit trees in ordinary soft spring daylight"
      },
      {
        "slug": "painted-eggs",
        "name": "Painted Eggs",
        "scene": "Hand-painted eggs with imperfect marks beside fresh sprouts"
      },
      {
        "slug": "open-house",
        "name": "Open House",
        "scene": "A modest doorway with spring flowers and a small welcome table"
      },
      {
        "slug": "shared-meal",
        "name": "Shared Meal",
        "scene": "A home table with herb rice, plain dishes and fresh greenery"
      },
      {
        "slug": "garden-picnic",
        "name": "Garden Picnic",
        "scene": "A simple picnic blanket and food basket under budding trees"
      },
      {
        "slug": "fresh-beginning",
        "name": "Fresh Beginning",
        "scene": "A small bowl of apples, hyacinths and a plain candle beside a window"
      }
    ]
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
    "aliases": "Vaisakhi Baisakhi Sikh Punjabi harvest April",
    "designs": [
      {
        "slug": "harvest-morning",
        "name": "Harvest Morning",
        "scene": "A real wheat field in ordinary soft morning daylight"
      },
      {
        "slug": "community-kitchen",
        "name": "Community Kitchen",
        "scene": "Large plain serving pots and stacks of plates in a modest community kitchen"
      },
      {
        "slug": "shared-meal",
        "name": "Shared Meal",
        "scene": "Simple steel plates with dal, rice and roti on a community table"
      },
      {
        "slug": "spring-welcome",
        "name": "Spring Welcome",
        "scene": "A modest doorway decorated with a small marigold garland"
      },
      {
        "slug": "golden-wheat",
        "name": "Golden Wheat",
        "scene": "A few naturally uneven wheat stems in a plain ceramic jug"
      },
      {
        "slug": "helping-together",
        "name": "Helping Together",
        "scene": "Clean aprons and serving spoons on a community kitchen counter"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A simple outdoor table with marigolds and plain water glasses"
      },
      {
        "slug": "harvest-basket",
        "name": "Harvest Basket",
        "scene": "Wheat stems and fresh seasonal produce in a plain basket"
      },
      {
        "slug": "community-hall",
        "name": "Community Hall",
        "scene": "An empty modest community hall prepared with simple meal service stations"
      },
      {
        "slug": "spring-courtyard",
        "name": "Spring Courtyard",
        "scene": "A quiet courtyard with potted flowers and a few chairs in natural daylight"
      }
    ]
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
    "aliases": "corn maze autumn fall farm maze hayride",
    "designs": [
      {
        "slug": "farm-trail",
        "name": "Farm Trail",
        "scene": "Eye-level view down a narrow muddy path through tall drying corn on an overcast autumn afternoon, uneven stalks and modest farm fencing"
      },
      {
        "slug": "barnside-maze",
        "name": "Barnside Maze",
        "scene": "An ordinary corn maze beside a small weathered farm shed under a pale cloudy sky"
      },
      {
        "slug": "morning-dew",
        "name": "Morning Dew",
        "scene": "A close view of corn leaves with real dew beside a slightly rutted maze path"
      },
      {
        "slug": "field-journal",
        "name": "Field Journal",
        "scene": "A worn notebook with blank pages and simple work gloves on a farm gate, cornfield behind"
      },
      {
        "slug": "harvest-entrance",
        "name": "Harvest Entrance",
        "scene": "A modest corn-maze entrance with an unlettered wooden sign and one imperfect pumpkin"
      },
      {
        "slug": "country-afternoon",
        "name": "Country Afternoon",
        "scene": "An ordinary rural corn maze seen from a low hillside under soft daylight, no dramatic sky"
      },
      {
        "slug": "pumpkin-stop",
        "name": "Pumpkin Stop",
        "scene": "A few uneven pumpkins in a simple wooden crate beside a cornfield path"
      },
      {
        "slug": "autumn-footpath",
        "name": "Autumn Footpath",
        "scene": "Dry corn husks scattered on an irregular dirt footpath through the maze"
      },
      {
        "slug": "family-farm",
        "name": "Family Farm",
        "scene": "A weathered picnic table and a small wagon beside a real-looking cornfield"
      },
      {
        "slug": "last-rows",
        "name": "Last Rows",
        "scene": "A quiet opening between uneven rows of drying corn with a simple fence in the distance"
      }
    ]
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
    "aliases": "trunk or treat school church parking lot Halloween",
    "designs": [
      {
        "slug": "pumpkin-trunk",
        "name": "Pumpkin Trunk",
        "scene": "An ordinary parked hatchback with its trunk open, two pumpkins and a small candy bowl, modest handmade autumn decorations"
      },
      {
        "slug": "paper-monster",
        "name": "Paper Monster",
        "scene": "A parked car trunk decorated with simple paper monster teeth and a bowl of unbranded sweets"
      },
      {
        "slug": "neighborhood-treats",
        "name": "Neighborhood Treats",
        "scene": "A small folding table of wrapped sweets beside an open hatchback in a school parking lot"
      },
      {
        "slug": "friendly-ghost-car",
        "name": "Friendly Ghost Car",
        "scene": "An ordinary car trunk decorated with a few handmade white paper ghosts"
      },
      {
        "slug": "fall-tailgate",
        "name": "Fall Tailgate",
        "scene": "A pickup tailgate with a plaid blanket and a simple pumpkin candy bowl"
      },
      {
        "slug": "candy-crew",
        "name": "Candy Crew",
        "scene": "Paper bags, wrapped sweets and plain volunteer supplies on a folding table beside parked cars"
      },
      {
        "slug": "storybook-trunk",
        "name": "Storybook Trunk",
        "scene": "A car trunk with modest handmade cardboard castle decorations, visibly handmade and imperfect"
      },
      {
        "slug": "harvest-parking-lot",
        "name": "Harvest Parking Lot",
        "scene": "A small row of ordinary parked cars with subtle pumpkin decorations in overcast daylight"
      },
      {
        "slug": "spooky-little-setup",
        "name": "Spooky Little Setup",
        "scene": "An open hatchback with paper bats, a plain orange cloth and a small candy basket"
      },
      {
        "slug": "community-candy-stop",
        "name": "Community Candy Stop",
        "scene": "A simple church parking-lot treat station with a few pumpkins, folding chairs and an open car trunk"
      }
    ]
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
    "aliases": "fall harvest autumn pumpkin patch apple picking hayride festival",
    "designs": [
      {
        "slug": "apple-orchard",
        "name": "Apple Orchard",
        "scene": "An ordinary apple orchard with a half-filled picking basket under a cloudy sky"
      },
      {
        "slug": "pumpkin-patch",
        "name": "Pumpkin Patch",
        "scene": "Uneven pumpkins on muddy ground with tangled vines, soft autumn daylight"
      },
      {
        "slug": "harvest-table",
        "name": "Harvest Table",
        "scene": "A worn farm table with squash, apples and a plain linen cloth"
      },
      {
        "slug": "hayride-afternoon",
        "name": "Hayride Afternoon",
        "scene": "A simple hay wagon parked beside a farm shed, no decorative staging"
      },
      {
        "slug": "market-morning",
        "name": "Market Morning",
        "scene": "A modest farm stand with seasonal produce in wooden crates, no labels"
      },
      {
        "slug": "autumn-garden",
        "name": "Autumn Garden",
        "scene": "A real backyard garden with drying sunflowers and fall vegetables"
      },
      {
        "slug": "cider-kitchen",
        "name": "Cider Kitchen",
        "scene": "A pitcher of apple cider and homemade doughnuts on a kitchen table"
      },
      {
        "slug": "country-porch",
        "name": "Country Porch",
        "scene": "A weathered porch with one pumpkin and an ordinary pot of mums"
      },
      {
        "slug": "leaf-walk",
        "name": "Leaf Walk",
        "scene": "A quiet woodland path with irregular fallen autumn leaves"
      },
      {
        "slug": "farm-supper",
        "name": "Farm Supper",
        "scene": "A modest outdoor supper table beside a vegetable garden in soft daylight"
      }
    ]
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
    "aliases": "Friendsgiving friends November potluck thanks",
    "designs": [
      {
        "slug": "bring-a-dish",
        "name": "Bring a Dish",
        "scene": "Covered homemade dishes on a lived-in kitchen counter ready for a potluck"
      },
      {
        "slug": "apartment-supper",
        "name": "Apartment Supper",
        "scene": "A small apartment dining table with mismatched chairs and simple autumn flowers"
      },
      {
        "slug": "pie-and-coffee",
        "name": "Pie and Coffee",
        "scene": "Homemade pie slices and mismatched mugs on a wooden table"
      },
      {
        "slug": "long-table",
        "name": "Long Table",
        "scene": "Two ordinary tables pushed together with different chairs for a friendly dinner"
      },
      {
        "slug": "shared-kitchen",
        "name": "Shared Kitchen",
        "scene": "A busy-looking but empty home kitchen with mixing bowls and serving dishes"
      },
      {
        "slug": "autumn-picnic",
        "name": "Autumn Picnic",
        "scene": "A simple fall picnic blanket with homemade dishes and a thermos"
      },
      {
        "slug": "soup-night",
        "name": "Soup Night",
        "scene": "A large pot of soup, bread and plain bowls on a dining table"
      },
      {
        "slug": "cozy-gathering",
        "name": "Cozy Gathering",
        "scene": "A modest living room with snacks on a low table and extra floor cushions"
      },
      {
        "slug": "garden-potluck",
        "name": "Garden Potluck",
        "scene": "Folding tables with everyday dishes in a small autumn garden"
      },
      {
        "slug": "leftover-brunch",
        "name": "Leftover Brunch",
        "scene": "A relaxed brunch table with bread, fruit and coffee in natural daylight"
      }
    ]
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
    "aliases": "summer camps day camp camp registration June July August",
    "designs": [
      {
        "slug": "lakeside-camp",
        "name": "Lakeside Camp",
        "scene": "A few ordinary canoes pulled onto a sandy lakeshore beside a simple camp dock"
      },
      {
        "slug": "nature-explorers",
        "name": "Nature Explorers",
        "scene": "A magnifying glass, pinecones and a plain notebook on a woodland picnic table"
      },
      {
        "slug": "art-camp",
        "name": "Art Camp",
        "scene": "Used paintbrushes, water jars and unfinished paper crafts on an outdoor camp table"
      },
      {
        "slug": "cabin-morning",
        "name": "Cabin Morning",
        "scene": "A modest wooden summer-camp cabin in soft morning daylight"
      },
      {
        "slug": "sports-camp",
        "name": "Sports Camp",
        "scene": "Plain balls, cones and water bottles beside an ordinary grassy playing field"
      },
      {
        "slug": "trail-camp",
        "name": "Trail Camp",
        "scene": "A simple daypack and walking shoes beside a wooded camp trail"
      },
      {
        "slug": "science-camp",
        "name": "Science Camp",
        "scene": "Simple unbranded magnifiers, plant pots and a small safe science activity on a picnic table"
      },
      {
        "slug": "music-camp",
        "name": "Music Camp",
        "scene": "Acoustic guitars and a small hand drum on chairs in a plain camp shelter"
      },
      {
        "slug": "garden-camp",
        "name": "Garden Camp",
        "scene": "Small watering cans and hand tools beside a vegetable garden bed"
      },
      {
        "slug": "campfire-circle",
        "name": "Campfire Circle",
        "scene": "An unlit campfire ring with ordinary logs and simple benches in a wooded clearing"
      }
    ]
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
    "aliases": "back to school classroom fall supplies August September",
    "designs": [
      {
        "slug": "classroom-welcome",
        "name": "Classroom Welcome",
        "scene": "A modest real classroom with empty desks and simple colorful supplies"
      },
      {
        "slug": "supply-table",
        "name": "Supply Table",
        "scene": "Plain notebooks, pencils and glue sticks on a school supply donation table"
      },
      {
        "slug": "new-backpack",
        "name": "New Backpack",
        "scene": "An unbranded backpack and a plain lunch box on a wooden bench"
      },
      {
        "slug": "library-start",
        "name": "Library Start",
        "scene": "A school library table with stacks of books without readable titles"
      },
      {
        "slug": "teacher-desk",
        "name": "Teacher Desk",
        "scene": "A used teacher desk with pencils, blank paper and a small plant"
      },
      {
        "slug": "school-garden",
        "name": "School Garden",
        "scene": "A small school garden bed with hand tools and young plants"
      },
      {
        "slug": "open-house",
        "name": "Open House",
        "scene": "A quiet school hallway with classroom doors and no readable signage"
      },
      {
        "slug": "art-supplies",
        "name": "Art Supplies",
        "scene": "Used crayons, colored pencils and blank paper on a classroom table"
      },
      {
        "slug": "family-welcome",
        "name": "Family Welcome",
        "scene": "A modest school welcome table with blank name tags and pens"
      },
      {
        "slug": "fresh-notebooks",
        "name": "Fresh Notebooks",
        "scene": "A few plain notebooks and sharpened pencils beside a classroom window"
      }
    ]
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
    "aliases": "graduation commencement seniors school May June",
    "designs": [
      {
        "slug": "cap-and-gown",
        "name": "Cap and Gown",
        "scene": "A plain graduation cap and folded gown on a wooden chair by a window"
      },
      {
        "slug": "garden-reception",
        "name": "Garden Reception",
        "scene": "A modest backyard graduation reception table with simple flowers and plain plates"
      },
      {
        "slug": "school-courtyard",
        "name": "School Courtyard",
        "scene": "Empty folding chairs arranged in a small school courtyard"
      },
      {
        "slug": "next-chapter",
        "name": "Next Chapter",
        "scene": "A plain diploma tube and a closed unlettered notebook on a desk"
      },
      {
        "slug": "family-brunch",
        "name": "Family Brunch",
        "scene": "A simple graduation brunch table with a cap resting on a spare chair"
      },
      {
        "slug": "community-hall",
        "name": "Community Hall",
        "scene": "A modest community hall prepared with folding tables and subtle school-color ribbons"
      },
      {
        "slug": "library-steps",
        "name": "Library Steps",
        "scene": "A plain graduation cap resting on stone library steps in daylight"
      },
      {
        "slug": "photo-corner",
        "name": "Photo Corner",
        "scene": "A modest backyard photo corner with a few balloons and a simple chair"
      },
      {
        "slug": "shared-cake",
        "name": "Shared Cake",
        "scene": "A homemade celebration cake with no text beside a plain graduation cap"
      },
      {
        "slug": "summer-sendoff",
        "name": "Summer Sendoff",
        "scene": "A small outdoor table with lemonade, flowers and a folded gown nearby"
      }
    ]
  }
] as const satisfies readonly HolidayCollection[];

export type HolidayCollectionId = (typeof HOLIDAY_COLLECTIONS)[number]["id"];
