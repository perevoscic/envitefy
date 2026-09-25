#!/usr/bin/env python3
"""Curated holiday art directions; builds the typed registry and ImageGen prompt plan.

Does not generate images or overwrite completed generation/review records.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLLECTIONS = []


def fixed(month, day, duration=1):
    return dict(kind="fixed", month=month, day=day, duration=duration)


def weekday(month, day, occurrence):
    return dict(kind="weekday", month=month, weekday=day, occurrence=occurrence)


def calendar(name, month, day, duration=1, eve=False):
    return dict(kind="calendar", calendar=name, month=str(month), day=day, duration=duration, eve=eve)


def window(start, end):
    return dict(kind="window", start=start, end=end)


def collection(id, name, kind, date, palettes, purpose, aliases, scenes):
    designs = []
    for line in scenes.strip().split("\n"):
        title, scene = line.strip().split(" | ", 1)
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        designs.append(dict(slug=slug, name=title, scene=scene))
    assert len(designs) == 10, (id, len(designs))
    COLLECTIONS.append(dict(id=id, name=name, kind=kind, date=date, palettes=palettes.split(),
                            purpose=purpose, aliases=aliases, designs=designs))


collection("new-years-day", "New Year’s Day", "Federal holidays", fixed(1, 1), "sage marine ochre", "celebration", "new year January brunch fresh start", """
Morning Light | A small breakfast table by a winter window, simple coffee mugs and oranges
First Walk | A quiet frosty park path in pale morning daylight
Brunch Together | A family kitchen table with pancakes, berries and mismatched plates
Fresh Chapter | An open blank notebook and a plain ceramic mug on a lived-in desk
Winter Kitchen | A loaf of bread cooling beside a tea towel in an ordinary kitchen
Open Door | A welcoming front porch with a simple evergreen wreath and snow on the steps
Quiet Start | A soft wool blanket, closed book and tea beside a window
Neighborhood Morning | An empty neighborhood cafe with chairs and natural window light
New Growth | Small potted herbs on a slightly weathered windowsill
Around the Table | A modest lunch table with linen napkins and winter greenery
""")
collection("mlk-day", "Martin Luther King Jr. Day", "Federal holidays", weekday(1, 1, 3), "marine ochre sage", "volunteers", "MLK Martin Luther King day of service January", """
Serve Together | A community hall table with reusable bags and donated canned food, no readable labels
Shared Library | A neighborhood little free library filled with well-used books, no readable titles
Helping Hands | Clean work gloves and a few hand tools on a park bench
Community Kitchen | Simple soup bowls and bread arranged for a community meal
Open Circle | A circle of mismatched chairs in a sunlit community room
Growing Hope | A community garden bed with young plants and a watering can
Care Packages | Open cardboard care packages with socks and toiletries without labels
Learning Together | Stacks of children's books and pencils on a classroom table, no legible titles
Neighborhood Care | A folded trash picker, gloves and reusable collection sacks at a park entrance
A Place for Everyone | An accessible community center entrance in ordinary winter daylight, no signage
""")
collection("presidents-day", "Presidents’ Day", "Federal holidays", weekday(2, 1, 3), "cobalt slate ochre", "meeting", "Washington birthday Presidents Day history February", """
History Table | A small arrangement of old unlettered books, reading glasses and a desk lamp
Library Afternoon | A neighborhood library history shelf without readable titles
Civic Hall | An empty small-town civic meeting room with wooden chairs and daylight
Founding Papers | Unmarked aged paper, a simple quill and inkwell on a wooden desk
Museum Visit | A quiet historical museum corridor with distant displays, no readable text
Town Square | A traditional American small-town courthouse square in winter
Civic Garden | A modest flagpole beside a winter garden outside a town hall
Reading Room | A wooden reading table with closed books and winter window light
Archive Desk | A box of archival folders and cotton handling gloves on a table, no labels
Community Forum | A lectern and a few rows of chairs in a modest hall, no campaign material
""")
collection("memorial-day", "Memorial Day", "Federal holidays", weekday(5, 1, -1), "slate marine sage", "volunteers", "Memorial Day remembrance honor fallen May", """
Quiet Reflection | A simple remembrance bench with a small bouquet of white flowers in a park
Poppy Garden | Natural red poppies growing unevenly beside a weathered stone path
Wreath of Remembrance | A modest green remembrance wreath with a narrow red white and blue ribbon on a plain stone wall
Morning Tribute | A small American flag planted beside white daisies in a community memorial garden
Honored Service | A neatly folded triangular American flag on a wooden table beside white flowers
Gather in Remembrance | Rows of empty folding chairs facing a modest wreath in a green park
White Roses | A few white roses laid on an uninscribed stone ledge in soft daylight
Peaceful Path | A leafy path leading toward a simple uninscribed community memorial stone
Remembrance Table | A plain white candle, small flower vase and blank guest book on a modest table
Lasting Gratitude | A weathered park bench beside irises and a small unobtrusive American flag
""")
collection("juneteenth", "Juneteenth", "Federal holidays", fixed(6, 19), "cherry ochre evergreen", "celebration", "Juneteenth freedom emancipation June nineteenth", """
Community Table | A neighborhood picnic table with red drinks, summer fruit and simple place settings
Freedom Garden | Red hibiscus flowers in a community garden in June daylight
Front Porch Gathering | An ordinary welcoming porch with red cushions and a pitcher of iced tea
Neighborhood Picnic | Picnic blankets and baskets under a mature shade tree
Summer Reading | Books with unmarked covers and a pitcher of red hibiscus tea on a library table
Shared Recipes | A homemade summer meal with cornbread and greens on a wooden kitchen table
Music in the Park | A modest outdoor community music stage with an acoustic guitar and empty chairs
Red Velvet | A homemade red velvet cake with uneven frosting on a simple serving plate
Community Market | A small outdoor neighborhood market with crafts and summer produce, no labels
Evening Together | A backyard table with red flowers, watermelon and glasses of iced tea
""")
collection("july-fourth", "July Fourth", "Federal holidays", fixed(7, 4), "cobalt cherry marine", "celebration", "Independence Day 4th July Fourth fourth of July fireworks", """
Porch Picnic | A modest porch picnic with faded red white and blue bunting and a pitcher of lemonade
Lakeside Afternoon | A picnic blanket and simple wicker basket beside an ordinary American lake
Backyard Barbecue | A backyard charcoal grill and outdoor table with corn on the cob and plain plates
Main Street | Small American flags on a quiet small-town main street in summer daylight
Berry Bowl | Strawberries blueberries and a white ceramic serving bowl on a picnic table
Fireworks by the Lake | A few believable distant fireworks above a lake after dusk, restrained exposure
Block Party | Folding tables and chairs being set out on a residential street with understated bunting
Summer Porch | Weathered porch chairs and a small American flag beside potted flowers
Picnic Basket | A close view of a picnic basket with a blue cloth, red apples and lemonade
Riverside Gathering | A riverside picnic shelter with red checked tablecloths and small flags
""")
collection("labor-day", "Labor Day", "Federal holidays", weekday(9, 1, 1), "terracotta marine olive", "celebration", "Labor Day workers September long weekend", """
Community Picnic | A modest late-summer community picnic table in the shade
Workshop Break | Worn work gloves and a plain lunch box on a workshop bench
End of Summer | Empty lawn chairs beside a garden with late-summer flowers
Neighborhood Cookout | A backyard table with grilled vegetables and simple plates
Lakeside Weekend | A small canoe resting beside a calm late-summer lake
Shared Lunch | Lunch containers and mugs on a break-room table without brand labels
Garden Gathering | A table under a backyard tree with pears and simple linen napkins
Local Makers | A modest craft market table with handmade bowls and baskets
Trail Day | A quiet wooded trailhead with a backpack and sturdy walking shoes
Front Porch Rest | A simple porch swing with a folded cotton blanket in afternoon shade
""")
collection("columbus-day", "Columbus Day", "Federal holidays", weekday(10, 1, 2), "marine cocoa slate", "meeting", "Columbus Day October maritime history", """
Maritime Museum | A small wooden sailing ship model on a maritime museum table
Harbor History | An old working harbor with weathered wooden docks under an overcast sky
Nautical Study | An unmarked compass, plain paper and rope on a wooden study table
Sailcloth | Folded natural sailcloth and weathered marine rope in soft light
History Workshop | A classroom table with unlabelled historical books and blank paper
Coastal Archive | A quiet coastal archive room with closed document boxes without labels
Harbor Walk | An ordinary waterfront path with small sailing boats in the distance
Museum Courtyard | A simple brick museum courtyard with wooden benches
Navigation Desk | A traditional brass compass and closed journal beside a window
Community Discussion | A circle of chairs and a few plain books in a local history room
""")
collection("veterans-day", "Veterans Day", "Federal holidays", fixed(11, 11), "slate cobalt evergreen", "volunteers", "Veterans Day November veterans appreciation service", """
With Gratitude | A modest bouquet and small American flag on a community welcome table
Community Breakfast | A simple breakfast table with coffee cups and plain pastries in a community hall
Service Stories | An empty chair, blank notebook and microphone at a local oral-history event
Honor Garden | Autumn flowers and a small flag near an uninscribed park memorial
Welcome Home | A neighborhood porch with a simple American flag and autumn mums
Shared Coffee | Plain coffee mugs and cookies on a veterans community center table, no labels
Quiet Tribute | A wreath of autumn leaves with a narrow patriotic ribbon against brick
Gather to Honor | Rows of chairs in a small-town hall with a single flag at the side
Letters of Thanks | Unmarked envelopes and pencils on a volunteer packing table
November Reflection | A park bench with a small bouquet on a soft overcast November day
""")
collection("thanksgiving", "Thanksgiving", "Federal holidays", weekday(11, 4, 4), "cider olive terracotta", "potluck", "Thanksgiving November gratitude turkey feast", """
Harvest Supper | A modest family table with roast vegetables, bread and autumn flowers
Kitchen Preparations | Homemade pies cooling on a worn kitchen counter
Gather Round | A simple dining table with mismatched chairs and linen napkins
Autumn Pantry | Squash, apples and a loaf of bread in an ordinary kitchen
Passing the Plate | A serving platter of roast turkey and simple side dishes on a table
Grateful Garden | A small arrangement of seasonal leaves and mums in a ceramic jug
Pie Social | Three homemade pies with imperfect crusts on a community table
Country Table | A farmhouse kitchen table with plain plates and a pumpkin centerpiece
Neighborly Feast | Potluck dishes in everyday serving bowls on folding tables
Candlelit Supper | A modest dining room with a few white candles and fall foliage, natural low light
""")
collection("christmas", "Christmas", "Federal holidays", fixed(12, 25), "evergreen cherry cocoa", "celebration", "Christmas Xmas December holiday Christmas Eve", """
Evergreen Kitchen | A little evergreen branch beside homemade cookies in a lived-in kitchen
Front Door Welcome | A simple real evergreen wreath on a weathered front door
Family Table | A modest Christmas meal table with red napkins and pine sprigs
Wrapped with Care | A few gifts wrapped in kraft paper with cotton ribbon on a wooden table
Neighborhood Lights | An ordinary residential porch with a restrained string of warm lights at dusk
Cookie Afternoon | Homemade gingerbread cookies with imperfect icing on a baking tray
Winter Window | A small real Christmas tree by a window with simple handmade ornaments
Community Supper | Folding tables prepared for a community Christmas meal with subtle greenery
Quiet Christmas | A wooden church pew with evergreen decoration and soft daylight
Cozy Gathering | A lived-in sitting room with a small tree, wool blankets and a simple tea tray
""")
collection("new-years-eve", "New Year’s Eve", "Celebrations", fixed(12, 31), "midnight ochre plum", "celebration", "NYE New Years Eve countdown December", """
Small Celebration | A few sparkling cider glasses and simple gold paper streamers on a dining table
City Window | A quiet apartment dinner setting beside a window overlooking ordinary city lights
Midnight Table | A modest evening table with candles, snacks and dark linen
Paper Confetti | A handful of handmade paper confetti and plain party hats on a wooden table
Kitchen Toast | Sparkling cider and citrus slices on a lived-in kitchen counter
Evening Supper | A small dinner gathering setup with plain dishes and winter flowers
Record Night | A turntable, records with blank sleeves and a small snack bowl
Winter Terrace | Two outdoor chairs, wool throws and string lights on a small terrace
Golden Pears | Pears, nuts and simple glassware on a winter supper table
After Dark | A small neighborhood cafe ready for an evening gathering, soft realistic lighting
""")
collection("valentines-day", "Valentine’s Day", "Celebrations", fixed(2, 14), "rose cherry plum", "celebration", "Valentines Galentines February friendship love", """
Paper Hearts | Hand-cut paper hearts, scissors and twine on a classroom craft table
Garden Roses | A few natural pink roses in a chipped ceramic vase by a window
Coffee for Two | Two coffee cups and a small pastry on a neighborhood cafe table
Friendship Table | A modest tea table with berries and mismatched pink plates
Cookie Exchange | Homemade heart-shaped cookies on parchment, slightly uneven icing
Letters and Flowers | Blank envelopes and a small bunch of tulips on a wooden desk
Winter Picnic | A basket with a red checked cloth and simple homemade treats
Sweet Workshop | Bowls of icing and plain cupcakes on a community baking table
Pink Tulips | An informal bunch of pink tulips in a glass jar in daylight
Shared Dessert | A homemade chocolate cake and two forks on a simple kitchen table
""")
collection("st-patricks-day", "St. Patrick’s Day", "Celebrations", fixed(3, 17), "moss evergreen ochre", "celebration", "Saint Patricks Irish March shamrock", """
Green Table | A casual table with a green linen runner and small potted shamrocks
Soda Bread | A homemade loaf of Irish soda bread and butter in an ordinary kitchen
Spring Clover | Close view of real clover growing beside a weathered stone wall
Neighborhood Supper | A modest community supper table with green napkins and plain dishes
Irish Tea | A pot of tea and simple biscuits beside a green wool scarf
Music Evening | An acoustic fiddle and a small wooden flute on a chair in a community room
Garden Gathering | A simple outdoor table beside early spring greenery
Paper Garland | Handmade green paper garlands above a classroom craft table
Pot of Clover | A terracotta pot of shamrocks on a kitchen windowsill
Local Gathering | An ordinary cozy cafe corner with subtle green decorations, no alcohol branding
""")
collection("mardi-gras", "Mardi Gras", "Celebrations", dict(kind="easter", offset=-47), "plum evergreen ochre", "celebration", "Mardi Gras Fat Tuesday carnival", """
King Cake | A homemade ring-shaped king cake with modest purple green and gold sugar
Paper Carnival | Handmade purple green and gold paper garlands on a community table
Brass Afternoon | An unbranded brass trumpet on a worn wooden chair beside a window
Porch Colors | A modest neighborhood porch with a few purple green and gold ribbons
Carnival Table | Plain plates, a simple cake and folded colorful napkins for a small gathering
Handmade Masks | Simple paper carnival masks and craft supplies without faces
Neighborhood Music | A small outdoor music setup with drums and brass instruments, no people
Ribbon Workshop | Spools of colored ribbon and scissors on a craft table
Community Supper | Everyday serving dishes on a table with understated carnival decorations
Courtyard Gathering | A modest brick courtyard with folding chairs and small paper lanterns
""")
collection("easter", "Easter", "Celebrations", dict(kind="easter"), "lavender sage apricot", "celebration", "Easter Sunday spring egg hunt", """
Garden Egg Hunt | A few naturally dyed eggs partly hidden in uneven spring grass
Spring Basket | A wicker basket with softly colored eggs and a simple linen cloth
Easter Brunch | A modest brunch table with daffodils, bread and boiled eggs
Quiet Morning | White lilies beside a plain wooden cross in a softly lit church alcove
Painted Eggs | Hand-painted eggs with imperfect marks drying on a kitchen table
Garden Table | A simple outdoor spring table with tulips and pale napkins
Spring Baking | Homemade hot cross buns on a cooling rack in a kitchen
Daffodil Path | Daffodils growing beside a weathered garden gate
Community Hunt | Small baskets and a few scattered pastel eggs in a neighborhood park
Family Lunch | A modest family lunch setting with spring greenery and plain white plates
""")
collection("mothers-day", "Mother’s Day", "Celebrations", weekday(5, 0, 2), "rose sage lavender", "celebration", "Mothers Day mom mum May brunch", """
Garden Brunch | A small garden table with tea, toast and an informal bouquet
Peony Morning | A few peonies in a glass jar on a kitchen windowsill
Breakfast Tray | A simple breakfast tray with coffee and homemade toast
Tea Together | Mismatched teacups and a homemade cake on a dining table
Handmade Bouquet | An informal bunch of garden flowers tied with plain string
Family Kitchen | A modest kitchen counter with a mixing bowl and a fresh cake
Porch Afternoon | Two porch chairs and a small vase of spring flowers
Garden Walk | A quiet garden path lined with irises and green foliage
Crafted with Love | Blank folded cards, colored pencils and pressed flowers on a table
Sunday Lunch | A simple lunch table with cloth napkins and natural garden cuttings
""")
collection("fathers-day", "Father’s Day", "Celebrations", weekday(6, 0, 3), "marine moss cocoa", "celebration", "Fathers Day dad June", """
Backyard Lunch | A modest backyard table with sandwiches and a pitcher of iced tea
Workshop Morning | A small woodworking bench with worn hand tools and a coffee cup
Trail Together | Walking boots and a daypack beside a wooded trail
Coffee Break | A plain coffee mug and folded newspaper without readable text on a porch
Lakeside Day | A small fishing tackle box and folding chair beside a quiet lake
Family Cookout | An ordinary charcoal grill with vegetables beside a picnic table
Garden Time | Work gloves, pruning shears and a terracotta pot on a garden bench
Sunday Pancakes | Homemade pancakes and berries on a simple kitchen table
Game Afternoon | A worn baseball glove and plain ball on grass beside a picnic basket
Front Porch | Two weathered porch chairs and a small table with lemonade
""")
collection("earth-day", "Earth Day", "Celebrations", fixed(4, 22), "sage moss teal", "volunteers", "Earth Day April environment cleanup planet", """
Seedling Morning | Young seedlings in reused pots on a community greenhouse bench
Park Cleanup | Reusable litter bags and work gloves beside a park path
Garden Tools | Used hand tools and soil on a garden table
River Care | A clean riverbank with a trash picker and reusable sack
Native Flowers | A patch of native wildflowers growing naturally in a neighborhood garden
Compost Corner | A small backyard compost bin beside a vegetable bed
Repair Together | A community repair table with a lamp, basic tools and mending supplies
Plant Swap | A modest table of assorted potted plants at a neighborhood plant swap
Tree Day | A small sapling and a spade beside a freshly dug garden hole
Reuse Workshop | Glass jars and fabric scraps on an ordinary community craft table
""")
collection("cinco-de-mayo", "Cinco de Mayo", "Celebrations", fixed(5, 5), "terracotta cherry teal", "celebration", "Cinco de Mayo May fifth Mexican culture Puebla", """
Community Table | A modest Mexican community meal table with handmade tortillas and colorful cloth napkins
Paper Banners | A few papel picado banners above a simple courtyard gathering
Family Kitchen | Homemade tamales on a ceramic plate in a lived-in kitchen
Puebla Ceramics | A few hand-painted ceramic bowls on a rustic kitchen shelf
Courtyard Lunch | A small courtyard table with flowers, plain plates and fresh lime water
Cooking Together | A bowl of masa, rolling pin and simple cooking utensils on a worktop
Flower Market | A modest market bucket of colorful fresh flowers beside simple woven baskets
Shared Recipes | Everyday serving dishes with beans, rice and tortillas on a table
Music Gathering | An acoustic guitar beside chairs in a modest community room
Neighborhood Celebration | A residential courtyard with a small number of paper banners and folding chairs
""")
collection("halloween", "Halloween", "Celebrations", fixed(10, 31), "terracotta plum midnight", "celebration", "Halloween October spooky costumes trick or treat", """
Pumpkin Porch | Two imperfectly carved pumpkins on an ordinary weathered porch in overcast daylight
Friendly Ghosts | Handmade white paper ghosts hanging above a simple classroom table
Autumn Doorstep | An ordinary front step with one pumpkin and a pot of mums
Cookie Monsters | Homemade Halloween cookies with slightly uneven icing on a kitchen tray
Neighborhood Night | A real residential sidewalk at blue hour with a few modest porch decorations
Paper Bats | Hand-cut black paper bats and scissors on a family craft table
Pumpkin Workshop | Partly carved pumpkins and ordinary carving tools on a covered outdoor table
Harvest Treats | Bowls of wrapped unbranded sweets on a small Halloween welcome table
Cozy Spooky | A small living room with a few paper decorations and orange cushions
Lantern Walk | A couple of simple pumpkin lanterns beside a garden path at dusk
""")
collection("indigenous-peoples-day", "Indigenous Peoples’ Day", "Celebrations", weekday(10, 1, 2), "terracotta moss cocoa", "meeting", "Indigenous Peoples Day October Native community", """
Community Learning | A welcoming community reading table with unlettered books and simple flowers
Land and Water | A natural river bend with native trees in ordinary autumn daylight
Native Garden | A community garden with native plants, no ceremonial objects
Shared Conversation | A circle of chairs in a simple community room with daylight
Local Voices | A microphone and empty chair at a small community storytelling event
Stewardship Day | Gardening gloves and a sapling beside a community planting site
Harvest Table | Locally grown squash and corn in a simple woven basket, no sacred imagery
Neighborhood Gathering | A modest outdoor community table in the shade of mature trees
Living Landscape | A quiet woodland path with natural autumn undergrowth
Learning Circle | Blank paper and pencils on a community workshop table, no invented tribal patterns
""")
collection("day-of-the-dead", "Día de los Muertos", "Celebrations", fixed(11, 1, 2), "ochre plum terracotta", "celebration", "Dia de los Muertos Day of the Dead November remembrance", """
Marigold Morning | Fresh orange marigolds in an ordinary ceramic vase beside a window
Remembrance Table | A small respectful home ofrenda with marigolds and candles, no invented portraits
Pan de Muerto | Homemade pan de muerto on a plain plate with a few marigolds nearby
Paper Flowers | Tissue paper marigolds and simple craft supplies on a table
Courtyard Marigolds | Pots of marigolds in a modest residential courtyard
Shared Memories | A blank photo frame, simple candle and small marigold bouquet on a table
Candle and Petals | A single candle in a plain holder beside scattered marigold petals
Community Workshop | A modest table with paper flower supplies and unpainted craft objects
Family Kitchen | Homemade bread and a pot of hot chocolate in a lived-in Mexican kitchen
Flower Path | A short simple line of marigold petals leading to a modest decorated doorway
""")
collection("lunar-new-year", "Lunar New Year", "Religious & cultural", calendar("chinese", 1, 1, 15), "cherry ochre plum", "celebration", "Lunar Chinese Korean Vietnamese New Year Tet Seollal", """
Red Lanterns | Two simple red paper lanterns above a modest neighborhood courtyard
Mandarin Table | A bowl of mandarins and a few plain red envelopes on a wooden table
Family Dumplings | Handmade dumplings being prepared on a kitchen worktop, no hands visible
Spring Branches | A few flowering plum branches in a simple ceramic vase
Tea and Fruit | A small teapot, everyday cups and citrus fruit on a family table
Paper Workshop | Red paper, scissors and string on a community craft table, no text
Courtyard Welcome | A modest doorway with simple red decorations and potted plants
Shared Supper | A family reunion meal with everyday dishes and red cloth napkins
Lantern Afternoon | Paper lanterns resting on a community hall table before a gathering
New Year Kitchen | A tray of rice cakes and a plain red cloth in a lived-in kitchen
""")
collection("passover", "Passover", "Religious & cultural", calendar("hebrew", "Nisan", 15, 8, True), "marine sage ochre", "potluck", "Passover Pesach seder spring", """
Seder Table | A modest Passover table with matzah, plain plates and a simple wine cup
Matzah and Linen | Matzah on a ceramic plate beside a folded linen cloth
Spring Welcome | A simple vase of spring flowers beside a Passover table setting
Family Kitchen | A bowl of charoset and matzah on an ordinary kitchen counter
Quiet Preparation | Plain dishes, parsley and a small saltwater bowl on a wooden table
Community Seder | Long tables in a modest community room prepared with matzah and simple dishes
Silver Cup | A simple silver kiddush cup beside matzah on a linen cloth
Spring Window | A small bunch of tulips and a matzah plate beside a kitchen window
Gather Together | A home dining table with mismatched chairs, matzah and plain glassware
Shared Traditions | A small covered matzah plate and two plain candles on a sideboard
""")
collection("rosh-hashanah", "Rosh Hashanah", "Religious & cultural", calendar("hebrew", "Tishri", 1, 2, True), "ochre sage terracotta", "celebration", "Rosh Hashanah Jewish New Year apples honey", """
Apples and Honey | A sliced apple and a small honey jar on a simple wooden table
Round Challah | A homemade round challah on a linen cloth in a kitchen
Sweet Beginning | A modest holiday table with apples, honey and ordinary plates
Autumn Orchard | A real apple orchard in soft overcast early-autumn daylight
Pomegranate Table | A few pomegranates and a ceramic bowl on a kitchen table
Family Gathering | A home dining table with round challah and seasonal flowers
Honey Cake | A homemade honey cake with an imperfect crust on a plain plate
Quiet Reflection | A simple bench beside a gentle stream in early autumn
Community Welcome | A community hall table with apples, honey and plain serving dishes
Golden Kitchen | Apples in a basket beside a jar of honey on a lived-in kitchen counter
""")
collection("yom-kippur", "Yom Kippur", "Religious & cultural", calendar("hebrew", "Tishri", 10, 1, True), "slate marine sage", "meeting", "Yom Kippur Day of Atonement reflection", """
Quiet Candle | A single plain white memorial candle on an uncluttered wooden table
Reflection Garden | A quiet garden bench beside white autumn flowers
Open Door | A simple synagogue entrance in soft daylight, no readable signage
Still Water | A calm pond bordered by autumn reeds under an overcast sky
White Linen | A neatly folded white linen cloth beside a plain candle holder
Community Space | A modest quiet room with rows of wooden chairs and natural light
Autumn Light | Soft daylight falling across an empty wooden bench and pale wall
Peaceful Path | A quiet tree-lined path with scattered early autumn leaves
Gather in Reflection | A circle of empty chairs in a calm community room
Evening Candle | One simple white candle glowing beside a window at dusk, realistic exposure
""")
collection("sukkot", "Sukkot", "Religious & cultural", calendar("hebrew", "Tishri", 15, 7, True), "olive cider sage", "potluck", "Sukkot sukkah harvest Jewish fall", """
Garden Sukkah | A modest backyard sukkah with a branch-covered roof and a simple table
Harvest Basket | An etrog citron and seasonal fruit in a plain basket on a table
Under the Branches | A small family table inside a simple sukkah, leafy roof visible
Paper Chains | Handmade paper chains decorating a modest outdoor sukkah
Autumn Welcome | A simple sukkah entrance with potted plants and seasonal fruit
Shared Supper | Everyday dishes and bread on a table beneath a leafy sukkah roof
Garden Gathering | Folding chairs around a modest table inside a backyard sukkah
Harvest Kitchen | Pomegranates, apples and squash on a lived-in kitchen counter
Afternoon Shade | Sunlight filtered through natural branches above a simple outdoor table
Community Sukkah | A modest community sukkah with folding tables and restrained decorations
""")
collection("hanukkah", "Hanukkah", "Religious & cultural", calendar("hebrew", "Kislev", 25, 8, True), "marine cobalt ochre", "celebration", "Hanukkah Chanukah festival lights dreidel", """
Window Lights | A simple nine-branched hanukkiah on a windowsill, eight equal-height candle holders and one elevated central shamash, natural home setting
Latke Kitchen | Homemade latkes and applesauce on plain plates in an ordinary kitchen
Dreidel Afternoon | A few plain wooden dreidels beside chocolate coins on a table, no readable lettering
Family Table | A modest holiday supper table with blue napkins and simple flowers
Sufganiyot | Homemade jelly doughnuts with uneven powdered sugar on a plain serving plate
Blue and Linen | A table setting with blue cloth napkins, ordinary plates and beeswax candles
Community Supper | Folding tables prepared for a community Hanukkah meal with subtle blue decorations
Handmade Stars | Paper star decorations and craft supplies on a family table
Winter Welcome | A modest doorway with blue paper decorations and a small winter plant
Kitchen Gathering | A well-used kitchen counter with dough, jam and a tray of doughnuts
""")
collection("kwanzaa", "Kwanzaa", "Religious & cultural", fixed(12, 26, 7), "evergreen cherry ochre", "celebration", "Kwanzaa December January community harvest", """
Harvest Table | A simple woven mat with corn, fruit and a plain wooden bowl on a family table
Seven Candles | A simple kinara with exactly seven candles, three red on the left, one black in the center and three green on the right, on a modest table
Community Gathering | A modest community table with red green and black cloth napkins
Shared Fruit | A basket of oranges, apples and corn on an ordinary wooden table
Family Meal | A home meal setting with greens, bread and everyday serving dishes
Handmade Gifts | A few small gifts wrapped in plain kraft paper with red and green ribbon
Story Circle | A circle of chairs with a small table of unlettered books in a community room
Woven Textures | A natural woven mat and plain ceramic cup beside seasonal fruit
Neighborhood Supper | Folding tables set for a community supper with restrained red and green decorations
Growing Community | A basket of harvest produce beside potted plants on a simple porch
""")
collection("ramadan", "Ramadan", "Religious & cultural", calendar("islamic-umalqura", 9, 1, 30, True), "teal ochre midnight", "potluck", "Ramadan Ramazan iftar suhoor community", """
Dates and Water | A small bowl of dates and two glasses of water on a modest iftar table
Evening Welcome | A simple metal lantern beside a doorway at realistic dusk
Community Iftar | Long tables in a modest community hall prepared with dates and water
Shared Soup | Plain bowls of soup and bread on a family table after sunset
Quiet Lantern | An ordinary metal lantern on a wooden windowsill in soft daylight
Family Preparation | A kitchen counter with fresh dates, bread and simple serving dishes
Tea After Sunset | A small tea tray beside a window at blue hour
Neighborhood Table | A modest outdoor meal table with dates and pitchers of water
Giving Together | Plain food packages and reusable bags on a community donation table
Evening Courtyard | A small residential courtyard with simple chairs and one lantern at dusk
""")
collection("eid-al-fitr", "Eid al-Fitr", "Religious & cultural", calendar("islamic-umalqura", 10, 1, 3, True), "teal rose ochre", "celebration", "Eid al Fitr Eid ul Fitr celebration end Ramadan", """
Morning Sweets | Homemade Eid pastries and a small teapot on a family table
Open House | A modest welcoming doorway with flowers and simple paper decorations
Family Brunch | A home brunch table with plain dishes, fruit and tea
Gift Envelopes | Plain colored gift envelopes and small wrapped presents on a wooden table
Garden Gathering | A simple garden table with flowers and a tea tray
Community Lunch | Long tables in a community hall with everyday serving dishes
Sweet Exchange | A plate of homemade date-filled cookies wrapped for sharing
Spring Flowers | An informal bouquet and a small dish of sweets beside a window
Tea Together | Ordinary teacups and pastries on a modest living-room table
Neighborhood Welcome | A residential courtyard with folding chairs and subtle festive decorations
""")
collection("eid-al-adha", "Eid al-Adha", "Religious & cultural", calendar("islamic-umalqura", 12, 10, 4, True), "olive ochre marine", "celebration", "Eid al Adha Eid ul Adha community sharing", """
Shared Table | A modest family Eid meal with rice, vegetables and ordinary serving dishes
Giving Day | Plain food parcels and reusable bags on a community distribution table
Garden Lunch | A simple outdoor lunch table with fresh flowers and plain plates
Family Welcome | A modest doorway with a small flower arrangement and simple festive ribbons
Tea and Dates | A small tea tray and dates on a lived-in dining table
Community Meal | Folding tables prepared for a community lunch with understated decoration
Wrapped with Care | A few small gifts in plain paper on a wooden sideboard
Kitchen Preparations | Everyday pots and fresh ingredients in a family kitchen
Neighborly Sharing | Covered food containers ready to share on a plain kitchen counter
Courtyard Together | A modest courtyard with chairs, a simple table and potted greenery
""")
collection("diwali", "Diwali", "Religious & cultural", dict(kind="dates", dates={"2025": "10-20", "2026": "11-08", "2027": "10-29", "2028": "10-17"}, fallback=[10, 11]), "terracotta plum ochre", "celebration", "Diwali Deepavali Deepawali festival lights", """
Clay Lamps | A few ordinary clay diyas on a worn stone doorstep at dusk
Marigold Welcome | A simple marigold garland on a modest home doorway
Sweets to Share | Homemade Indian sweets in a plain steel serving tray
Family Rangoli | A small handmade rangoli with slightly uneven colored powder on a courtyard floor
Evening Table | A modest family table with small diyas and everyday dishes
Lamp Workshop | Unpainted clay diyas and simple craft supplies on a community table
Courtyard Lights | A few diyas along a modest courtyard wall at realistic evening exposure
Gift of Sweets | A small box of homemade sweets wrapped with plain ribbon
Kitchen Gathering | A lived-in kitchen counter with flour, a mixing bowl and prepared sweets
Quiet Glow | Two small clay lamps beside marigold petals on a wooden sideboard
""")
collection("holi", "Holi", "Religious & cultural", dict(kind="dates", dates={"2025": "03-14", "2026": "03-04", "2027": "03-22", "2028": "03-11"}, fallback=[2, 3]), "rose teal ochre", "celebration", "Holi festival colors Rangwali spring", """
Bowls of Color | Small plain bowls of pink yellow and blue Holi powder on a worn outdoor table
Spring Gathering | A modest park picnic setup with a few bowls of Holi colors
Color Workshop | Paper and simple color powder bowls on a community craft table
Sweet Spring | Homemade gujiya on a steel plate beside a small bowl of color
Courtyard Colors | A modest courtyard with a few natural powder stains on the stone floor
Flower Welcome | Bright spring flowers in ordinary jars beside a gathering table
Picnic and Color | A plain picnic blanket with snacks and sealed packets of Holi powder without labels
Handmade Garland | Simple colorful paper garlands above an outdoor community table
Kitchen Treats | A lived-in kitchen with a tray of homemade festival sweets
After the Colors | Folded white cotton cloth with small powder stains beside a bowl of flowers
""")
collection("nowruz", "Nowruz", "Religious & cultural", calendar("persian", 1, 1, 13), "sage teal rose", "celebration", "Nowruz Persian New Year spring equinox", """
Spring Hyacinths | A pot of real hyacinths beside a window in a modest home
Green Shoots | A small dish of wheat sprouts on a family table
Haft Sin Details | Apples, garlic, a dish of sprouts and a simple mirror on a modest Nowruz table, no goldfish
Family Tea | Tea glasses and homemade pastries on a lived-in dining table
Spring Orchard | Blossoming fruit trees in ordinary soft spring daylight
Painted Eggs | Hand-painted eggs with imperfect marks beside fresh sprouts
Open House | A modest doorway with spring flowers and a small welcome table
Shared Meal | A home table with herb rice, plain dishes and fresh greenery
Garden Picnic | A simple picnic blanket and food basket under budding trees
Fresh Beginning | A small bowl of apples, hyacinths and a plain candle beside a window
""")
collection("vaisakhi", "Vaisakhi", "Religious & cultural", window([4, 13], [4, 14]), "ochre terracotta sage", "celebration", "Vaisakhi Baisakhi Sikh Punjabi harvest April", """
Harvest Morning | A real wheat field in ordinary soft morning daylight
Community Kitchen | Large plain serving pots and stacks of plates in a modest community kitchen
Shared Meal | Simple steel plates with dal, rice and roti on a community table
Spring Welcome | A modest doorway decorated with a small marigold garland
Golden Wheat | A few naturally uneven wheat stems in a plain ceramic jug
Helping Together | Clean aprons and serving spoons on a community kitchen counter
Garden Gathering | A simple outdoor table with marigolds and plain water glasses
Harvest Basket | Wheat stems and fresh seasonal produce in a plain basket
Community Hall | An empty modest community hall prepared with simple meal service stations
Spring Courtyard | A quiet courtyard with potted flowers and a few chairs in natural daylight
""")
collection("corn-maze", "Corn Mazes", "Seasonal activities", window([9, 1], [10, 31]), "cider moss olive", "volunteers", "corn maze autumn fall farm maze hayride", """
Farm Trail | Eye-level view down a narrow muddy path through tall drying corn on an overcast autumn afternoon, uneven stalks and modest farm fencing
Barnside Maze | An ordinary corn maze beside a small weathered farm shed under a pale cloudy sky
Morning Dew | A close view of corn leaves with real dew beside a slightly rutted maze path
Field Journal | A worn notebook with blank pages and simple work gloves on a farm gate, cornfield behind
Harvest Entrance | A modest corn-maze entrance with an unlettered wooden sign and one imperfect pumpkin
Country Afternoon | An ordinary rural corn maze seen from a low hillside under soft daylight, no dramatic sky
Pumpkin Stop | A few uneven pumpkins in a simple wooden crate beside a cornfield path
Autumn Footpath | Dry corn husks scattered on an irregular dirt footpath through the maze
Family Farm | A weathered picnic table and a small wagon beside a real-looking cornfield
Last Rows | A quiet opening between uneven rows of drying corn with a simple fence in the distance
""")
collection("trunk-or-treat", "Trunk-or-Treat", "Seasonal activities", window([10, 1], [10, 31]), "terracotta plum ochre", "volunteers", "trunk or treat school church parking lot Halloween", """
Pumpkin Trunk | An ordinary parked hatchback with its trunk open, two pumpkins and a small candy bowl, modest handmade autumn decorations
Paper Monster | A parked car trunk decorated with simple paper monster teeth and a bowl of unbranded sweets
Neighborhood Treats | A small folding table of wrapped sweets beside an open hatchback in a school parking lot
Friendly Ghost Car | An ordinary car trunk decorated with a few handmade white paper ghosts
Fall Tailgate | A pickup tailgate with a plaid blanket and a simple pumpkin candy bowl
Candy Crew | Paper bags, wrapped sweets and plain volunteer supplies on a folding table beside parked cars
Storybook Trunk | A car trunk with modest handmade cardboard castle decorations, visibly handmade and imperfect
Harvest Parking Lot | A small row of ordinary parked cars with subtle pumpkin decorations in overcast daylight
Spooky Little Setup | An open hatchback with paper bats, a plain orange cloth and a small candy basket
Community Candy Stop | A simple church parking-lot treat station with a few pumpkins, folding chairs and an open car trunk
""")
collection("fall-harvest", "Fall Harvest", "Seasonal activities", window([9, 1], [11, 15]), "cider olive terracotta", "celebration", "fall harvest autumn pumpkin patch apple picking hayride festival", """
Apple Orchard | An ordinary apple orchard with a half-filled picking basket under a cloudy sky
Pumpkin Patch | Uneven pumpkins on muddy ground with tangled vines, soft autumn daylight
Harvest Table | A worn farm table with squash, apples and a plain linen cloth
Hayride Afternoon | A simple hay wagon parked beside a farm shed, no decorative staging
Market Morning | A modest farm stand with seasonal produce in wooden crates, no labels
Autumn Garden | A real backyard garden with drying sunflowers and fall vegetables
Cider Kitchen | A pitcher of apple cider and homemade doughnuts on a kitchen table
Country Porch | A weathered porch with one pumpkin and an ordinary pot of mums
Leaf Walk | A quiet woodland path with irregular fallen autumn leaves
Farm Supper | A modest outdoor supper table beside a vegetable garden in soft daylight
""")
collection("friendsgiving", "Friendsgiving", "Seasonal activities", window([11, 1], [11, 30]), "cider plum terracotta", "potluck", "Friendsgiving friends November potluck thanks", """
Bring a Dish | Covered homemade dishes on a lived-in kitchen counter ready for a potluck
Apartment Supper | A small apartment dining table with mismatched chairs and simple autumn flowers
Pie and Coffee | Homemade pie slices and mismatched mugs on a wooden table
Long Table | Two ordinary tables pushed together with different chairs for a friendly dinner
Shared Kitchen | A busy-looking but empty home kitchen with mixing bowls and serving dishes
Autumn Picnic | A simple fall picnic blanket with homemade dishes and a thermos
Soup Night | A large pot of soup, bread and plain bowls on a dining table
Cozy Gathering | A modest living room with snacks on a low table and extra floor cushions
Garden Potluck | Folding tables with everyday dishes in a small autumn garden
Leftover Brunch | A relaxed brunch table with bread, fruit and coffee in natural daylight
""")
collection("summer-camp", "Summer Camps", "Seasonal activities", window([6, 1], [8, 31]), "moss marine ochre", "volunteers", "summer camps day camp camp registration June July August", """
Lakeside Camp | A few ordinary canoes pulled onto a sandy lakeshore beside a simple camp dock
Nature Explorers | A magnifying glass, pinecones and a plain notebook on a woodland picnic table
Art Camp | Used paintbrushes, water jars and unfinished paper crafts on an outdoor camp table
Cabin Morning | A modest wooden summer-camp cabin in soft morning daylight
Sports Camp | Plain balls, cones and water bottles beside an ordinary grassy playing field
Trail Camp | A simple daypack and walking shoes beside a wooded camp trail
Science Camp | Simple unbranded magnifiers, plant pots and a small safe science activity on a picnic table
Music Camp | Acoustic guitars and a small hand drum on chairs in a plain camp shelter
Garden Camp | Small watering cans and hand tools beside a vegetable garden bed
Campfire Circle | An unlit campfire ring with ordinary logs and simple benches in a wooded clearing
""")
collection("back-to-school", "Back to School", "Seasonal activities", window([7, 15], [9, 15]), "cobalt ochre sage", "volunteers", "back to school classroom fall supplies August September", """
Classroom Welcome | A modest real classroom with empty desks and simple colorful supplies
Supply Table | Plain notebooks, pencils and glue sticks on a school supply donation table
New Backpack | An unbranded backpack and a plain lunch box on a wooden bench
Library Start | A school library table with stacks of books without readable titles
Teacher Desk | A used teacher desk with pencils, blank paper and a small plant
School Garden | A small school garden bed with hand tools and young plants
Open House | A quiet school hallway with classroom doors and no readable signage
Art Supplies | Used crayons, colored pencils and blank paper on a classroom table
Family Welcome | A modest school welcome table with blank name tags and pens
Fresh Notebooks | A few plain notebooks and sharpened pencils beside a classroom window
""")
collection("graduation", "Graduation", "Seasonal activities", window([5, 1], [6, 30]), "slate ochre marine", "celebration", "graduation commencement seniors school May June", """
Cap and Gown | A plain graduation cap and folded gown on a wooden chair by a window
Garden Reception | A modest backyard graduation reception table with simple flowers and plain plates
School Courtyard | Empty folding chairs arranged in a small school courtyard
Next Chapter | A plain diploma tube and a closed unlettered notebook on a desk
Family Brunch | A simple graduation brunch table with a cap resting on a spare chair
Community Hall | A modest community hall prepared with folding tables and subtle school-color ribbons
Library Steps | A plain graduation cap resting on stone library steps in daylight
Photo Corner | A modest backyard photo corner with a few balloons and a simple chair
Shared Cake | A homemade celebration cake with no text beside a plain graduation cap
Summer Sendoff | A small outdoor table with lemonade, flowers and a folded gown nearby
""")

def main():
    assert len(COLLECTIONS) == 44
    assert len({c["id"] for c in COLLECTIONS}) == len(COLLECTIONS)
    registry = ROOT / "src/lib/holiday-collections.ts"
    registry.write_text('import type { HolidayCollection } from "./holiday-collection-types";\n\n'
                         '// Curated source: scripts/build-holiday-collections.py. Dates guide discovery only.\n'
                         'export const HOLIDAY_COLLECTIONS = ' + json.dumps(COLLECTIONS, indent=2, ensure_ascii=False)
                         + ' as const satisfies readonly HolidayCollection[];\n\n'
                         'export type HolidayCollectionId = (typeof HOLIDAY_COLLECTIONS)[number]["id"];\n')
    plan_path = ROOT / "docs/holiday-template-artwork.json"
    old = json.loads(plan_path.read_text()) if plan_path.exists() else {}
    previous = {a["id"]: a for a in old.get("assets", [])}
    assets = []
    for c in COLLECTIONS:
        for i, d in enumerate(c["designs"]):
            id = f'holidays--{c["id"]}--{d["slug"]}'
            prompt = (f'Use case: photorealistic-natural. Create one landscape 1536x1024 photograph for a {c["name"]} '
                      f'event template called {d["name"]}. Subject: {d["scene"]}. '
                      'Photographic direction: believable local documentary photography, ordinary real-world setting, '
                      'soft available daylight or the specified practical lighting, restrained natural colors and white balance, '
                      'subtle camera grain, imperfect everyday objects, organic irregular spacing, physically plausible perspective. '
                      'Use a human-scale viewpoint, moderate depth of field, honest textures. Keep it quietly attractive and unstaged. '
                      'No cinematic orange sunset, no HDR, no dramatic sun rays, no glossy hyperreal finish, no excessive bokeh, '
                      'no perfectly symmetrical staging, no fantasy lighting or excessive decorations. '
                      'No people, readable text, lettering, logos, watermark, frame, UI or mockup. '
                      'One single full-bleed scene, never a collage or contact sheet. Do not invent cultural or sacred symbols. '
                      'Preserve the exact holiday context and respect solemn observances.')
            asset = dict(id=id, collection=c["id"], name=d["name"], prompt=prompt,
                         output=f'public/templates/signup/holidays/{c["id"]}/{d["slug"]}.webp',
                         legacyPath=f'/templates/signup/holidays/{c["id"]}/{d["slug"]}.webp', status="pending")
            if id in previous:
                assert previous[id]["prompt"] == prompt, f"Review prompt changes before replacing {id}"
                asset.update(previous[id])
            assets.append(asset)
    plan_path.write_text(json.dumps(dict(provider="OpenAI", initialGeneration="built-in image_gen", approvedFallback="OpenAI API, gpt-image-2, medium quality", direction="Natural documentary photography",
                                        collections=len(COLLECTIONS), designsPerCollection=10, assets=assets), indent=2, ensure_ascii=False) + "\n")
    print(f"Prepared {len(COLLECTIONS)} collections and {len(assets)} distinct artwork prompts")


if __name__ == "__main__":
    main()
