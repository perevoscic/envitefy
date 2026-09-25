// Artwork paths are installed by scripts/process-signup-artwork.py and scripts/publish-holiday-templates.py.
// Canonical paths preserve template IDs and previously saved artwork.
import type { HolidayCollectionId } from "@/lib/holiday-collections";
export type SignupTemplateItem = { name: string; tier: "free" | "premium"; path: string; artworkPath?: string; description?: string; keywords?: string; audience?: string; occasion?: HolidayCollectionId };
export type SignupTemplateManifest = Record<string, SignupTemplateItem[]>;
export const SIGNUP_TEMPLATES: SignupTemplateManifest = {
  "Fall & Seasonal": [
    {
      "name": "Apple Picking",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/apple-picking.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/apple-picking.webp"
    },
    {
      "name": "Fall Scene",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/fall-scene.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-scene.webp"
    },
    {
      "name": "Fall Fun 2",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/fall-fun-2.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-fun-2.webp"
    },
    {
      "name": "Harvest Table",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/harvest-table.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/harvest-table.webp"
    },
    {
      "name": "Pumpkin Patch",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/pumpkin-patch.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/pumpkin-patch.webp"
    },
    {
      "name": "Fall Forest",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/fall-forest.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-forest.webp"
    },
    {
      "name": "Fall Food Drive",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/fall-food-drive.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-food-drive.webp"
    },
    {
      "name": "Fall Gathering",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/fall-gathering.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-gathering.webp"
    },
    {
      "name": "Corn Maze",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/corn-maze.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/corn-maze.webp"
    },
    {
      "name": "Autumn Blessings",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/autumn-blessings.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/autumn-blessings.webp"
    },
    {
      "name": "Thanksgiving Feast",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/thanksgiving-feast.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/thanksgiving-feast.webp"
    },
    {
      "name": "Friendsgiving",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/friendsgiving.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/friendsgiving.webp"
    },
    {
      "name": "Fall Food",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/fall-food.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-food.webp"
    },
    {
      "name": "Fall Leaves",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/fall-leaves.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-leaves.webp"
    },
    {
      "name": "Fall Y’all",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/fall-y-all.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-y-all.webp"
    },
    {
      "name": "Fall Festival",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/fall-festival.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-festival.webp"
    },
    {
      "name": "Fall Pumpkins",
      "tier": "premium",
      "path": "/templates/signup/fall-and-seasonal/fall-pumpkins.webp",
      "artworkPath": "/templates/signup/photographic/fall-and-seasonal/fall-pumpkins.webp"
    },
    {
      "name": "School Trunk-or-Treat",
      "tier": "free",
      "path": "/templates/signup/fall-and-seasonal/school-trunk-or-treat.webp",
      "description": "Organize school trunk-or-treat with signups for decorated trunk space, wrapped candy donation, and helping roles.",
      "keywords": "school halloween trunk or treat fall candy volunteer",
      "audience": "School & Education"
    }
  ],
  "Church & Community": [
    {
      "name": "Service Project",
      "tier": "premium",
      "path": "/templates/signup/church-and-community/service-project.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/service-project.webp"
    },
    {
      "name": "Community Picnic",
      "tier": "free",
      "path": "/templates/signup/church-and-community/community-picnic.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/community-picnic.webp"
    },
    {
      "name": "Bible Study",
      "tier": "free",
      "path": "/templates/signup/church-and-community/bible-study.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/bible-study.webp"
    },
    {
      "name": "Mission Trip",
      "tier": "premium",
      "path": "/templates/signup/church-and-community/mission-trip.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/mission-trip.webp"
    },
    {
      "name": "Church Gathering",
      "tier": "free",
      "path": "/templates/signup/church-and-community/church-gathering.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/church-gathering.webp"
    },
    {
      "name": "Volunteer Sign-Up",
      "tier": "free",
      "path": "/templates/signup/church-and-community/volunteer-sign-up.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/volunteer-sign-up.webp"
    },
    {
      "name": "Worship Team",
      "tier": "premium",
      "path": "/templates/signup/church-and-community/worship-team.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/worship-team.webp"
    },
    {
      "name": "Sunday School",
      "tier": "free",
      "path": "/templates/signup/church-and-community/sunday-school.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/sunday-school.webp"
    },
    {
      "name": "Fundraiser",
      "tier": "free",
      "path": "/templates/signup/church-and-community/fundraiser.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/fundraiser.webp"
    },
    {
      "name": "Food Drive",
      "tier": "free",
      "path": "/templates/signup/church-and-community/food-drive.webp",
      "artworkPath": "/templates/signup/photographic/church-and-community/food-drive.webp"
    },
    {
      "name": "Community Park Cleanup",
      "tier": "free",
      "path": "/templates/signup/church-and-community/community-park-cleanup.webp",
      "description": "Organize community park cleanup with signups for path cleanup team, playground cleanup team, and helping roles.",
      "keywords": "park cleanup litter neighborhood community service",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Community Garden Workday",
      "tier": "free",
      "path": "/templates/signup/church-and-community/community-garden-workday.webp",
      "description": "Organize community garden workday with signups for bed preparation, planting team, and helping roles.",
      "keywords": "community garden workday planting weeding volunteer",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Neighborhood Meal Train",
      "tier": "free",
      "path": "/templates/signup/church-and-community/neighborhood-meal-train.webp",
      "description": "Organize neighborhood meal train with signups for main meal contribution, side dish contribution, and helping roles.",
      "keywords": "meal train care meals neighbor support delivery",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Winter Coat Drive",
      "tier": "free",
      "path": "/templates/signup/church-and-community/winter-coat-drive.webp",
      "description": "Organize winter coat drive with signups for clean child coat, clean adult coat, and helping roles.",
      "keywords": "winter coat jacket warm clothing drive donation",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Community Blood Drive Helpers",
      "tier": "free",
      "path": "/templates/signup/church-and-community/community-blood-drive-helpers.webp",
      "description": "Organize community blood drive helpers with signups for morning welcome helper, afternoon welcome helper, and helping roles.",
      "keywords": "blood drive volunteers donor welcome refreshments community",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Animal Shelter Volunteers",
      "tier": "free",
      "path": "/templates/signup/church-and-community/animal-shelter-volunteers.webp",
      "description": "Organize animal shelter volunteers with signups for laundry helper, donation sorting helper, and helping roles.",
      "keywords": "animal shelter pet rescue volunteer dog cat supplies",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Library Summer Reading",
      "tier": "free",
      "path": "/templates/signup/church-and-community/library-summer-reading.webp",
      "description": "Organize library summer reading with signups for reading session helper, book table helper, and helping roles.",
      "keywords": "library summer reading literacy children books volunteers",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Community Repair Cafe",
      "tier": "free",
      "path": "/templates/signup/church-and-community/community-repair-cafe.webp",
      "description": "Organize community repair cafe with signups for welcome and item check-in, mending helper interest list, and helping roles.",
      "keywords": "repair cafe fix it community sustainability volunteer sewing",
      "audience": "Community & Neighbors"
    },
    {
      "name": "School Backpack Packing",
      "tier": "free",
      "path": "/templates/signup/church-and-community/school-backpack-packing.webp",
      "description": "Organize school backpack packing with signups for new backpack, notebook and pencil pack, and helping roles.",
      "keywords": "backpack packing school supplies back to school donation drive",
      "audience": "School & Education"
    },
    {
      "name": "Community Senior Luncheon",
      "tier": "free",
      "path": "/templates/signup/church-and-community/community-senior-luncheon.webp",
      "description": "Organize community senior luncheon with signups for soup or main dish, bread and salad, and helping roles.",
      "keywords": "senior luncheon community meal volunteer serving neighbors",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Community Egg Hunt",
      "tier": "free",
      "path": "/templates/signup/church-and-community/community-egg-hunt.webp",
      "description": "Organize community egg hunt with signups for egg filling helper, egg hiding helper, and helping roles.",
      "keywords": "community easter spring egg hunt volunteers neighborhood",
      "audience": "Community & Neighbors"
    }
  ],
  "Sports & Recreation": [
    {
      "name": "Swim Team",
      "tier": "premium",
      "path": "/templates/signup/sports-and-recreation/swim-team.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/swim-team.webp"
    },
    {
      "name": "Cheer Squad",
      "tier": "premium",
      "path": "/templates/signup/sports-and-recreation/cheer-squad.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/cheer-squad.webp"
    },
    {
      "name": "Track Meet",
      "tier": "free",
      "path": "/templates/signup/sports-and-recreation/track-meet.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/track-meet.webp"
    },
    {
      "name": "Baseball Team",
      "tier": "free",
      "path": "/templates/signup/sports-and-recreation/baseball-team.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/baseball-team.webp"
    },
    {
      "name": "Sports Banquet",
      "tier": "free",
      "path": "/templates/signup/sports-and-recreation/sports-banquet.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/sports-banquet.webp"
    },
    {
      "name": "Gymnastics",
      "tier": "free",
      "path": "/templates/signup/sports-and-recreation/gymnastics.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/gymnastics.webp"
    },
    {
      "name": "Fitness Class",
      "tier": "free",
      "path": "/templates/signup/sports-and-recreation/fitness-class.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/fitness-class.webp"
    },
    {
      "name": "Soccer Game",
      "tier": "free",
      "path": "/templates/signup/sports-and-recreation/soccer-game.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/soccer-game.webp"
    },
    {
      "name": "Basketball Practice",
      "tier": "free",
      "path": "/templates/signup/sports-and-recreation/basketball-practice.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/basketball-practice.webp"
    },
    {
      "name": "Golf Tournament",
      "tier": "premium",
      "path": "/templates/signup/sports-and-recreation/golf-tournament.webp",
      "artworkPath": "/templates/signup/photographic/sports-and-recreation/golf-tournament.webp"
    }
  ],
  "Fundraising & Food": [
    {
      "name": "Car Wash",
      "tier": "free",
      "path": "/templates/signup/fundraising-and-food/car-wash.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/car-wash.webp"
    },
    {
      "name": "Bake Sale",
      "tier": "free",
      "path": "/templates/signup/fundraising-and-food/bake-sale.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/bake-sale.webp"
    },
    {
      "name": "Charity Gala",
      "tier": "premium",
      "path": "/templates/signup/fundraising-and-food/charity-gala.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/charity-gala.webp"
    },
    {
      "name": "Restaurant Night",
      "tier": "premium",
      "path": "/templates/signup/fundraising-and-food/restaurant-night.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/restaurant-night.webp"
    },
    {
      "name": "Food Pantry",
      "tier": "free",
      "path": "/templates/signup/fundraising-and-food/food-pantry.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/food-pantry.webp"
    },
    {
      "name": "Auction Event",
      "tier": "premium",
      "path": "/templates/signup/fundraising-and-food/auction-event.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/auction-event.webp"
    },
    {
      "name": "Donation Drive",
      "tier": "free",
      "path": "/templates/signup/fundraising-and-food/donation-drive.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/donation-drive.webp"
    },
    {
      "name": "Vendor Fair",
      "tier": "premium",
      "path": "/templates/signup/fundraising-and-food/vendor-fair.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/vendor-fair.webp"
    },
    {
      "name": "Raffle",
      "tier": "premium",
      "path": "/templates/signup/fundraising-and-food/raffle.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/raffle.webp"
    },
    {
      "name": "Potluck Dinner",
      "tier": "free",
      "path": "/templates/signup/fundraising-and-food/potluck-dinner.webp",
      "artworkPath": "/templates/signup/photographic/fundraising-and-food/potluck-dinner.webp"
    }
  ],
  "Family & Personal": [
    {
      "name": "Anniversary Celebration",
      "tier": "premium",
      "path": "/templates/signup/family-and-personal/anniversary-celebration.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/anniversary-celebration.webp"
    },
    {
      "name": "Family Event",
      "tier": "premium",
      "path": "/templates/signup/family-and-personal/family-event.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/family-event.webp"
    },
    {
      "name": "Housewarming",
      "tier": "free",
      "path": "/templates/signup/family-and-personal/housewarming.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/housewarming.webp"
    },
    {
      "name": "Birthday Party",
      "tier": "free",
      "path": "/templates/signup/family-and-personal/birthday-party.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/birthday-party.webp"
    },
    {
      "name": "Block Party",
      "tier": "free",
      "path": "/templates/signup/family-and-personal/block-party.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/block-party.webp"
    },
    {
      "name": "Wedding",
      "tier": "premium",
      "path": "/templates/signup/family-and-personal/wedding.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/wedding.webp"
    },
    {
      "name": "Baby Shower",
      "tier": "premium",
      "path": "/templates/signup/family-and-personal/baby-shower.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/baby-shower.webp"
    },
    {
      "name": "Game Night",
      "tier": "free",
      "path": "/templates/signup/family-and-personal/game-night.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/game-night.webp"
    },
    {
      "name": "Bridal Shower",
      "tier": "premium",
      "path": "/templates/signup/family-and-personal/bridal-shower.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/bridal-shower.webp"
    },
    {
      "name": "Family Holiday",
      "tier": "premium",
      "path": "/templates/signup/family-and-personal/family-holiday.webp",
      "artworkPath": "/templates/signup/photographic/family-and-personal/family-holiday.webp"
    }
  ],
  "Business & Professional": [
    {
      "name": "Conference Schedule",
      "tier": "premium",
      "path": "/templates/signup/business-and-professional/conference-schedule.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/conference-schedule.webp"
    },
    {
      "name": "Client Meeting",
      "tier": "free",
      "path": "/templates/signup/business-and-professional/client-meeting.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/client-meeting.webp"
    },
    {
      "name": "Team Lunch",
      "tier": "free",
      "path": "/templates/signup/business-and-professional/team-lunch.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/team-lunch.webp"
    },
    {
      "name": "Corporate Event",
      "tier": "premium",
      "path": "/templates/signup/business-and-professional/corporate-event.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/corporate-event.webp"
    },
    {
      "name": "Workshop",
      "tier": "free",
      "path": "/templates/signup/business-and-professional/workshop.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/workshop.webp"
    },
    {
      "name": "Networking Night",
      "tier": "premium",
      "path": "/templates/signup/business-and-professional/networking-night.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/networking-night.webp"
    },
    {
      "name": "Professional Gathering",
      "tier": "premium",
      "path": "/templates/signup/business-and-professional/professional-gathering.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/professional-gathering.webp"
    },
    {
      "name": "Office Meeting",
      "tier": "free",
      "path": "/templates/signup/business-and-professional/office-meeting.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/office-meeting.webp"
    },
    {
      "name": "Training Session",
      "tier": "free",
      "path": "/templates/signup/business-and-professional/training-session.webp",
      "artworkPath": "/templates/signup/photographic/business-and-professional/training-session.webp"
    }
  ],
  "Other / Special Interest": [
    {
      "name": "Tech Event",
      "tier": "free",
      "path": "/templates/signup/other-special-interest/tech-event.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/tech-event.webp"
    },
    {
      "name": "Political Campaign",
      "tier": "premium",
      "path": "/templates/signup/other-special-interest/political-campaign.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/political-campaign.webp"
    },
    {
      "name": "Gaming Tournament",
      "tier": "premium",
      "path": "/templates/signup/other-special-interest/gaming-tournament.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/gaming-tournament.webp"
    },
    {
      "name": "Environment & Cleanup",
      "tier": "free",
      "path": "/templates/signup/other-special-interest/environment-and-cleanup.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/environment-and-cleanup.webp"
    },
    {
      "name": "Senior Services",
      "tier": "free",
      "path": "/templates/signup/other-special-interest/senior-services.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/senior-services.webp"
    },
    {
      "name": "Travel Group",
      "tier": "free",
      "path": "/templates/signup/other-special-interest/travel-group.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/travel-group.webp"
    },
    {
      "name": "Real Estate Open House",
      "tier": "premium",
      "path": "/templates/signup/other-special-interest/real-estate-open-house.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/real-estate-open-house.webp"
    },
    {
      "name": "Arts & Culture",
      "tier": "free",
      "path": "/templates/signup/other-special-interest/arts-and-culture.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/arts-and-culture.webp"
    },
    {
      "name": "Pets & Animals",
      "tier": "free",
      "path": "/templates/signup/other-special-interest/pets-and-animals.webp",
      "artworkPath": "/templates/signup/photographic/other-special-interest/pets-and-animals.webp"
    }
  ],
  "General": [
    {
      "name": "HOA Meeting",
      "tier": "free",
      "path": "/templates/signup/general/hoa-meeting.webp",
      "artworkPath": "/templates/signup/photographic/general/hoa-meeting.webp"
    },
    {
      "name": "Ad Hoc Meeting",
      "tier": "premium",
      "path": "/templates/signup/general/ad-hoc-meeting.webp",
      "artworkPath": "/templates/signup/photographic/general/ad-hoc-meeting.webp"
    },
    {
      "name": "Board Meeting",
      "tier": "free",
      "path": "/templates/signup/general/board-meeting.webp",
      "artworkPath": "/templates/signup/photographic/general/board-meeting.webp"
    },
    {
      "name": "Team Planning Session",
      "tier": "free",
      "path": "/templates/signup/general/team-planning-session.webp",
      "artworkPath": "/templates/signup/photographic/general/team-planning-session.webp"
    },
    {
      "name": "Volunteer Orientation",
      "tier": "premium",
      "path": "/templates/signup/general/volunteer-orientation.webp",
      "artworkPath": "/templates/signup/photographic/general/volunteer-orientation.webp"
    },
    {
      "name": "Town Hall Meeting",
      "tier": "free",
      "path": "/templates/signup/general/town-hall-meeting.webp",
      "artworkPath": "/templates/signup/photographic/general/town-hall-meeting.webp"
    },
    {
      "name": "Community Discussion",
      "tier": "free",
      "path": "/templates/signup/general/community-discussion.webp",
      "artworkPath": "/templates/signup/photographic/general/community-discussion.webp"
    },
    {
      "name": "Staff Training",
      "tier": "premium",
      "path": "/templates/signup/general/staff-training.webp",
      "artworkPath": "/templates/signup/photographic/general/staff-training.webp"
    },
    {
      "name": "Committee Meeting",
      "tier": "free",
      "path": "/templates/signup/general/committee-meeting.webp",
      "artworkPath": "/templates/signup/photographic/general/committee-meeting.webp"
    },
    {
      "name": "Monthly Meetup",
      "tier": "free",
      "path": "/templates/signup/general/monthly-meetup.webp",
      "artworkPath": "/templates/signup/photographic/general/monthly-meetup.webp"
    },
    {
      "name": "Project Kickoff",
      "tier": "premium",
      "path": "/templates/signup/general/project-kickoff.webp",
      "artworkPath": "/templates/signup/photographic/general/project-kickoff.webp"
    },
    {
      "name": "Workshop Registration",
      "tier": "free",
      "path": "/templates/signup/general/workshop-registration.webp",
      "artworkPath": "/templates/signup/photographic/general/workshop-registration.webp"
    }
  ],
  "Parties & Events": [
    {
      "name": "Birthday Party",
      "tier": "free",
      "path": "/templates/signup/parties-and-events/birthday-party.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/birthday-party.webp"
    },
    {
      "name": "Wedding",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/wedding.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/wedding.webp"
    },
    {
      "name": "Baby Shower",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/baby-shower.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/baby-shower.webp"
    },
    {
      "name": "Game Night",
      "tier": "free",
      "path": "/templates/signup/parties-and-events/game-night.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/game-night.webp"
    },
    {
      "name": "Bridal Shower",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/bridal-shower.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/bridal-shower.webp"
    },
    {
      "name": "Family Holiday",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/family-holiday.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/family-holiday.webp"
    },
    {
      "name": "Holiday Party",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/holiday-party.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/holiday-party.webp"
    },
    {
      "name": "Graduation Party",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/graduation-party.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/graduation-party.webp"
    },
    {
      "name": "Retirement Party",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/retirement-party.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/retirement-party.webp"
    },
    {
      "name": "Engagement Party",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/engagement-party.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/engagement-party.webp"
    },
    {
      "name": "Baby Shower",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/baby-shower.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/baby-shower.webp"
    },
    {
      "name": "Game Night",
      "tier": "free",
      "path": "/templates/signup/parties-and-events/game-night.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/game-night.webp"
    },
    {
      "name": "Bridal Shower",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/bridal-shower.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/bridal-shower.webp"
    },
    {
      "name": "Family Holiday",
      "tier": "premium",
      "path": "/templates/signup/parties-and-events/family-holiday.webp",
      "artworkPath": "/templates/signup/photographic/parties-and-events/family-holiday.webp"
    }
  ],
  "Health & Fitness": [
    {
      "name": "Fitness Class",
      "tier": "free",
      "path": "/templates/signup/health-and-fitness/fitness-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/fitness-class.webp"
    },
    {
      "name": "Yoga Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/yoga-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/yoga-class.webp"
    },
    {
      "name": "Pilates Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/pilates-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/pilates-class.webp"
    },
    {
      "name": "Spin Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/spin-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/spin-class.webp"
    },
    {
      "name": "Zumba Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/zumba-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/zumba-class.webp"
    },
    {
      "name": "Bootcamp Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/bootcamp-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/bootcamp-class.webp"
    },
    {
      "name": "Dance Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/dance-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/dance-class.webp"
    },
    {
      "name": "Morning Run",
      "tier": "free",
      "path": "/templates/signup/health-and-fitness/morning-run.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/morning-run.webp"
    },
    {
      "name": "Cycling Club",
      "tier": "free",
      "path": "/templates/signup/health-and-fitness/cycling-club.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/cycling-club.webp"
    },
    {
      "name": "CrossFit Session",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/crossfit-session.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/crossfit-session.webp"
    },
    {
      "name": "Martial Arts Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/martial-arts-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/martial-arts-class.webp"
    },
    {
      "name": "Boxing Class",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/boxing-class.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/boxing-class.webp"
    },
    {
      "name": "Swimming Lessons",
      "tier": "free",
      "path": "/templates/signup/health-and-fitness/swimming-lessons.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/swimming-lessons.webp"
    },
    {
      "name": "Tennis Club",
      "tier": "free",
      "path": "/templates/signup/health-and-fitness/tennis-club.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/tennis-club.webp"
    },
    {
      "name": "Basketball League",
      "tier": "free",
      "path": "/templates/signup/health-and-fitness/basketball-league.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/basketball-league.webp"
    },
    {
      "name": "Volleyball League",
      "tier": "free",
      "path": "/templates/signup/health-and-fitness/volleyball-league.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/volleyball-league.webp"
    },
    {
      "name": "Wellness Workshop",
      "tier": "premium",
      "path": "/templates/signup/health-and-fitness/wellness-workshop.webp",
      "artworkPath": "/templates/signup/photographic/health-and-fitness/wellness-workshop.webp"
    }
  ],
  "Clubs & Groups": [
    {
      "name": "Book Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/book-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/book-club.webp"
    },
    {
      "name": "Running Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/running-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/running-club.webp"
    },
    {
      "name": "Bike Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/bike-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/bike-club.webp"
    },
    {
      "name": "Hiking Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/hiking-club.png",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/hiking-club.webp"
    },
    {
      "name": "Rock Climbing Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/rock-climbing-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/rock-climbing-club.webp"
    },
    {
      "name": "Swim Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/swim-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/swim-club.webp"
    },
    {
      "name": "Soccer Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/soccer-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/soccer-club.webp"
    },
    {
      "name": "Baseball Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/baseball-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/baseball-club.webp"
    },
    {
      "name": "Basketball Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/basketball-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/basketball-club.webp"
    },
    {
      "name": "Football Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/football-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/football-club.webp"
    },
    {
      "name": "Tennis Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/tennis-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/tennis-club.webp"
    },
    {
      "name": "Volleyball Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/volleyball-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/volleyball-club.webp"
    },
    {
      "name": "Golf Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/golf-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/golf-club.webp"
    },
    {
      "name": "Cheerleading Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/cheerleading-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/cheerleading-club.webp"
    },
    {
      "name": "Dance Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/dance-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/dance-club.webp"
    },
    {
      "name": "Cheerleading Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/cheerleading-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/cheerleading-club.webp"
    },
    {
      "name": "Dance Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/dance-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/dance-club.webp"
    },
    {
      "name": "Cheerleading Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/cheerleading-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/cheerleading-club.webp"
    },
    {
      "name": "Dance Club",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/dance-club.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/dance-club.webp"
    },
    {
      "name": "Drive Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/drive-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/drive-group.webp"
    },
    {
      "name": "Fisherman Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/fisherman-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/fisherman-group.webp"
    },
    {
      "name": "Horseback Riding Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/horseback-riding-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/horseback-riding-group.webp"
    },
    {
      "name": "Bird Watching Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/bird-watching-group.png",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/bird-watching-group.webp"
    },
    {
      "name": "Gardening Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/gardening-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/gardening-group.webp"
    },
    {
      "name": "Reading Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/reading-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/reading-group.webp"
    },
    {
      "name": "Writing Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/writing-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/writing-group.webp"
    },
    {
      "name": "Cooking Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/cooking-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/cooking-group.webp"
    },
    {
      "name": "Baking Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/baking-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/baking-group.webp"
    },
    {
      "name": "Painting Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/painting-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/painting-group.webp"
    },
    {
      "name": "Pottery Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/pottery-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/pottery-group.webp"
    },
    {
      "name": "Knitting Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/knitting-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/knitting-group.webp"
    },
    {
      "name": "Crocheting Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/crocheting-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/crocheting-group.webp"
    },
    {
      "name": "Sewing Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/sewing-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/sewing-group.webp"
    },
    {
      "name": "Quilting Group",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/quilting-group.webp",
      "artworkPath": "/templates/signup/photographic/clubs-and-groups/quilting-group.webp"
    },
    {
      "name": "Scout Campout Helpers",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/scout-campout-helpers.webp",
      "description": "Organize scout campout helpers with signups for meal preparation helper, equipment check helper, and helping roles.",
      "keywords": "scout scouting troop campout camping helpers meals",
      "audience": "Clubs & Youth Groups"
    },
    {
      "name": "Youth Sports Concessions",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/youth-sports-concessions.webp",
      "description": "Organize youth sports concessions with signups for opening setup crew, early concession shift, and helping roles.",
      "keywords": "youth sports concession stand booster shift snack volunteer",
      "audience": "Clubs & Youth Groups"
    },
    {
      "name": "Youth Club Snack Rotation",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/youth-club-snack-rotation.webp",
      "description": "Organize youth club snack rotation with signups for fresh fruit, individually wrapped snacks, and helping roles.",
      "keywords": "youth club after school snack rotation supplies parents",
      "audience": "Clubs & Youth Groups"
    },
    {
      "name": "Youth Service Day",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/youth-service-day.webp",
      "description": "Organize youth service day with signups for supply packing team, garden helper team, and helping roles.",
      "keywords": "youth student service day volunteer community club",
      "audience": "Clubs & Youth Groups"
    },
    {
      "name": "Booster Club Pancake Breakfast",
      "tier": "free",
      "path": "/templates/signup/clubs-and-groups/booster-club-pancake-breakfast.webp",
      "description": "Organize booster club pancake breakfast with signups for kitchen helper, serving line helper, and helping roles.",
      "keywords": "booster club pancake breakfast school sports fundraising",
      "audience": "Clubs & Youth Groups"
    }
  ],
  "School & Education": [
    {
      "name": "Parent-Teacher Conferences",
      "tier": "free",
      "path": "/templates/signup/school-and-education/parent-teacher-conferences.webp",
      "description": "Organize parent-teacher conferences with signups for early afternoon appointment, mid-afternoon appointment, and helping roles.",
      "keywords": "parent teacher conference appointments meetings",
      "audience": "School & Education"
    },
    {
      "name": "Classroom Reading Volunteers",
      "tier": "free",
      "path": "/templates/signup/school-and-education/classroom-reading-volunteers.webp",
      "description": "Organize classroom reading volunteers with signups for morning read-aloud helper, afternoon reading buddy, and helping roles.",
      "keywords": "reading literacy read aloud mystery reader classroom",
      "audience": "School & Education"
    },
    {
      "name": "School Book Fair",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-book-fair.webp",
      "description": "Organize school book fair with signups for morning checkout helper, afternoon checkout helper, and helping roles.",
      "keywords": "book fair library scholastic pta pto volunteers",
      "audience": "School & Education"
    },
    {
      "name": "School Field Day",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-field-day.webp",
      "description": "Organize school field day with signups for relay station helper, beanbag game helper, and helping roles.",
      "keywords": "field day games relay outdoor school volunteers",
      "audience": "School & Education"
    },
    {
      "name": "Teacher Appreciation Breakfast",
      "tier": "free",
      "path": "/templates/signup/school-and-education/teacher-appreciation-breakfast.webp",
      "description": "Organize teacher appreciation breakfast with signups for bagels and spreads, fresh fruit platter, and helping roles.",
      "keywords": "teacher appreciation breakfast staff pta pto food",
      "audience": "School & Education"
    },
    {
      "name": "Classroom Supply Drive",
      "tier": "free",
      "path": "/templates/signup/school-and-education/classroom-supply-drive.webp",
      "description": "Organize classroom supply drive with signups for pencils, one box, glue sticks, one pack, and helping roles.",
      "keywords": "classroom supplies wish list donations pencils tissues",
      "audience": "School & Education"
    },
    {
      "name": "Field Trip Chaperones",
      "tier": "free",
      "path": "/templates/signup/school-and-education/field-trip-chaperones.webp",
      "description": "Organize field trip chaperones with signups for morning check-in helper, chaperone interest list, and helping roles.",
      "keywords": "field trip school chaperone parent museum excursion",
      "audience": "School & Education"
    },
    {
      "name": "School Science Fair",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-science-fair.webp",
      "description": "Organize school science fair with signups for display setup helper, project welcome desk, and helping roles.",
      "keywords": "science fair stem judges experiments school",
      "audience": "School & Education"
    },
    {
      "name": "School Art Show",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-art-show.webp",
      "description": "Organize school art show with signups for hang artwork, welcome families, and helping roles.",
      "keywords": "school art show gallery exhibition creativity",
      "audience": "School & Education"
    },
    {
      "name": "School Carnival",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-carnival.webp",
      "description": "Organize school carnival with signups for ring toss booth helper, prize table helper, and helping roles.",
      "keywords": "school carnival fun fair pta pto booths games",
      "audience": "School & Education"
    },
    {
      "name": "School Talent Show",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-talent-show.webp",
      "description": "Organize school talent show with signups for performer check-in, backstage helper, and helping roles.",
      "keywords": "school talent show performance stage backstage",
      "audience": "School & Education"
    },
    {
      "name": "School Musical Backstage Crew",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-musical-backstage-crew.webp",
      "description": "Organize school musical backstage crew with signups for costume helper, props table helper, and helping roles.",
      "keywords": "school musical theater theatre backstage costumes props",
      "audience": "School & Education"
    },
    {
      "name": "School Band Concert",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-band-concert.webp",
      "description": "Organize school band concert with signups for chair and stand setup, program table helper, and helping roles.",
      "keywords": "school band concert music booster volunteers",
      "audience": "School & Education"
    },
    {
      "name": "School Robotics Tournament",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-robotics-tournament.webp",
      "description": "Organize school robotics tournament with signups for team check-in, practice area helper, and helping roles.",
      "keywords": "school robotics stem lego tournament judging",
      "audience": "School & Education"
    },
    {
      "name": "School STEM Night",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-stem-night.webp",
      "description": "Organize school stem night with signups for bridge building helper, circuit station helper, and helping roles.",
      "keywords": "school stem steam family science technology engineering",
      "audience": "School & Education"
    },
    {
      "name": "Family Math Night",
      "tier": "free",
      "path": "/templates/signup/school-and-education/family-math-night.webp",
      "description": "Organize family math night with signups for shape puzzle helper, counting game helper, and helping roles.",
      "keywords": "family math night school numeracy games parents",
      "audience": "School & Education"
    },
    {
      "name": "School Multicultural Night",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-multicultural-night.webp",
      "description": "Organize school multicultural night with signups for family dish to share, table display helper, and helping roles.",
      "keywords": "school multicultural cultural international night families potluck",
      "audience": "School & Education"
    },
    {
      "name": "School Picture Day",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-picture-day.webp",
      "description": "Organize school picture day with signups for morning class escort, afternoon class escort, and helping roles.",
      "keywords": "school picture photo day pta volunteers",
      "audience": "School & Education"
    },
    {
      "name": "School Library Helpers",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-library-helpers.webp",
      "description": "Organize school library helpers with signups for morning book shelving, afternoon book shelving, and helping roles.",
      "keywords": "school library shelving books reading volunteers",
      "audience": "School & Education"
    },
    {
      "name": "School Garden Volunteers",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-garden-volunteers.webp",
      "description": "Organize school garden volunteers with signups for planting helper, watering helper, and helping roles.",
      "keywords": "school garden planting watering outdoor classroom",
      "audience": "School & Education"
    },
    {
      "name": "School Lunchroom Volunteers",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-lunchroom-volunteers.webp",
      "description": "Organize school lunchroom volunteers with signups for early lunch helper, late lunch helper, and helping roles.",
      "keywords": "school lunchroom cafeteria lunch duty volunteers",
      "audience": "School & Education"
    },
    {
      "name": "School PTA Meeting",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-pta-meeting.webp",
      "description": "Organize school pta meeting with signups for welcome and check-in, notes volunteer, and helping roles.",
      "keywords": "school pta pto parent teacher association meeting",
      "audience": "School & Education"
    },
    {
      "name": "School Family Bingo Night",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-family-bingo-night.webp",
      "description": "Organize school family bingo night with signups for welcome table helper, game supply helper, and helping roles.",
      "keywords": "school bingo family game night pta pto fundraiser",
      "audience": "School & Education"
    },
    {
      "name": "School Graduation Reception",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-graduation-reception.webp",
      "description": "Organize school graduation reception with signups for dessert tray, drinks and cups, and helping roles.",
      "keywords": "school graduation promotion reception ceremony volunteers",
      "audience": "School & Education"
    },
    {
      "name": "School Uniform Swap",
      "tier": "free",
      "path": "/templates/signup/school-and-education/school-uniform-swap.webp",
      "description": "Organize school uniform swap with signups for sort donated uniforms, welcome families, and helping roles.",
      "keywords": "school uniform swap clothing exchange families",
      "audience": "School & Education"
    }
  ],
  "Winter & Holidays": [
    {
      "name": "Classroom Christmas Party",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/classroom-christmas-party.webp",
      "description": "Organize classroom christmas party with signups for fruit and snack tray, craft supplies, and helping roles.",
      "keywords": "christmas classroom school party room parent holiday treats",
      "audience": "School & Education"
    },
    {
      "name": "School Winter Celebration",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/school-winter-celebration.webp",
      "description": "Organize school winter celebration with signups for winter craft supplies, snack contribution, and helping roles.",
      "keywords": "school winter celebration classroom holiday party inclusive",
      "audience": "School & Education"
    },
    {
      "name": "Community Christmas Dinner",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/community-christmas-dinner.webp",
      "description": "Organize community christmas dinner with signups for main dish to share, vegetable side dish, and helping roles.",
      "keywords": "community christmas dinner holiday potluck church volunteers",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Holiday Cookie Exchange",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/holiday-cookie-exchange.webp",
      "description": "Organize holiday cookie exchange with signups for cookie batch, two dozen, ingredient label supplies, and helping roles.",
      "keywords": "holiday christmas cookie exchange swap baking community",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Christmas Toy Drive",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/christmas-toy-drive.webp",
      "description": "Organize christmas toy drive with signups for new toy for ages 3–5, new toy for ages 6–8, and helping roles.",
      "keywords": "christmas holiday toy drive gifts giving tree donation",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Holiday Gift Wrapping",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/holiday-gift-wrapping.webp",
      "description": "Organize holiday gift wrapping with signups for early wrapping shift, late wrapping shift, and helping roles.",
      "keywords": "holiday christmas gift wrapping fundraiser volunteer shifts",
      "audience": "Community & Neighbors"
    },
    {
      "name": "Hanukkah Community Potluck",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/hanukkah-community-potluck.webp",
      "description": "Organize hanukkah community potluck with signups for main dish to share, side dish to share, and helping roles.",
      "keywords": "hanukkah chanukah community potluck holiday food gathering",
      "audience": "Community & Neighbors"
    },
    {
      "name": "School Valentine Party",
      "tier": "free",
      "path": "/templates/signup/winter-and-holidays/school-valentine-party.webp",
      "description": "Organize school valentine party with signups for paper and craft supplies, class snack contribution, and helping roles.",
      "keywords": "school classroom valentine valentines party friendship craft",
      "audience": "School & Education"
    }
  ],
  "New Year’s Day": [
    {
      "name": "New Year’s Day · Morning Light",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/morning-light.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/morning-light.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Morning Light: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · First Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/first-walk.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/first-walk.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "First Walk: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Brunch Together",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/brunch-together.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/brunch-together.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Brunch Together: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Fresh Chapter",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/fresh-chapter.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/fresh-chapter.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Fresh Chapter: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Winter Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/winter-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/winter-kitchen.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Winter Kitchen: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Open Door",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/open-door.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/open-door.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Open Door: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Quiet Start",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/quiet-start.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/quiet-start.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Quiet Start: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Neighborhood Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/neighborhood-morning.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/neighborhood-morning.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Neighborhood Morning: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · New Growth",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/new-growth.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/new-growth.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "New Growth: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Around the Table",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/around-the-table.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/around-the-table.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Around the Table: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    }
  ],
  "Martin Luther King Jr. Day": [
    {
      "name": "Martin Luther King Jr. Day · Serve Together",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/serve-together.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/serve-together.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Serve Together: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Shared Library",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/shared-library.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/shared-library.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Shared Library: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Helping Hands",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/helping-hands.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/helping-hands.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Helping Hands: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Community Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/community-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/community-kitchen.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Community Kitchen: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Open Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/open-circle.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/open-circle.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Open Circle: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Growing Hope",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/growing-hope.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/growing-hope.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Growing Hope: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Care Packages",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/care-packages.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/care-packages.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Care Packages: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Learning Together",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/learning-together.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/learning-together.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Learning Together: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Neighborhood Care",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/neighborhood-care.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/neighborhood-care.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Neighborhood Care: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · A Place for Everyone",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/a-place-for-everyone.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/a-place-for-everyone.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "A Place for Everyone: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    }
  ],
  "Presidents’ Day": [
    {
      "name": "Presidents’ Day · History Table",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/history-table.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/history-table.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "History Table: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Library Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/library-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/library-afternoon.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Library Afternoon: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-hall.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-hall.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Hall: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Founding Papers",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/founding-papers.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/founding-papers.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Founding Papers: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Museum Visit",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/museum-visit.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/museum-visit.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Museum Visit: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Town Square",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/town-square.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/town-square.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Town Square: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-garden.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-garden.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Garden: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Reading Room",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/reading-room.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/reading-room.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Reading Room: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Archive Desk",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/archive-desk.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/archive-desk.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Archive Desk: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Community Forum",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/community-forum.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/community-forum.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Community Forum: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    }
  ],
  "Memorial Day": [
    {
      "name": "Memorial Day · Quiet Reflection",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/quiet-reflection.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/quiet-reflection.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Quiet Reflection: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Poppy Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/poppy-garden.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/poppy-garden.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Poppy Garden: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Wreath of Remembrance",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/wreath-of-remembrance.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/wreath-of-remembrance.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Wreath of Remembrance: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Morning Tribute",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/morning-tribute.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/morning-tribute.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Morning Tribute: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Honored Service",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/honored-service.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/honored-service.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Honored Service: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Gather in Remembrance",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/gather-in-remembrance.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/gather-in-remembrance.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Gather in Remembrance: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · White Roses",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/white-roses.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/white-roses.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "White Roses: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Peaceful Path",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/peaceful-path.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/peaceful-path.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Peaceful Path: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Remembrance Table",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/remembrance-table.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/remembrance-table.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Remembrance Table: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Lasting Gratitude",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/lasting-gratitude.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/lasting-gratitude.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Lasting Gratitude: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    }
  ],
  "Juneteenth": [
    {
      "name": "Juneteenth · Community Table",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/community-table.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/community-table.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Community Table: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Freedom Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/freedom-garden.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/freedom-garden.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Freedom Garden: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Front Porch Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/front-porch-gathering.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/front-porch-gathering.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Front Porch Gathering: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Neighborhood Picnic",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/neighborhood-picnic.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/neighborhood-picnic.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Neighborhood Picnic: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Summer Reading",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/summer-reading.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/summer-reading.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Summer Reading: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Shared Recipes",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/shared-recipes.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/shared-recipes.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Shared Recipes: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Music in the Park",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/music-in-the-park.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/music-in-the-park.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Music in the Park: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Red Velvet",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/red-velvet.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/red-velvet.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Red Velvet: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Community Market",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/community-market.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/community-market.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Community Market: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Evening Together",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/evening-together.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/evening-together.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Evening Together: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    }
  ],
  "July Fourth": [
    {
      "name": "July Fourth · Porch Picnic",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/porch-picnic.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/porch-picnic.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Porch Picnic: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Lakeside Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/lakeside-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/lakeside-afternoon.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Lakeside Afternoon: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Backyard Barbecue",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/backyard-barbecue.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/backyard-barbecue.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Backyard Barbecue: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Main Street",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/main-street.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/main-street.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Main Street: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Berry Bowl",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/berry-bowl.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/berry-bowl.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Berry Bowl: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Fireworks by the Lake",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/fireworks-by-the-lake.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/fireworks-by-the-lake.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Fireworks by the Lake: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Block Party",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/block-party.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/block-party.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Block Party: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Summer Porch",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/summer-porch.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/summer-porch.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Summer Porch: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Picnic Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/picnic-basket.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/picnic-basket.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Picnic Basket: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Riverside Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/riverside-gathering.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/riverside-gathering.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Riverside Gathering: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    }
  ],
  "Labor Day": [
    {
      "name": "Labor Day · Community Picnic",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/community-picnic.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/community-picnic.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Community Picnic: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Workshop Break",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/workshop-break.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/workshop-break.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Workshop Break: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · End of Summer",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/end-of-summer.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/end-of-summer.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "End of Summer: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Neighborhood Cookout",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/neighborhood-cookout.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/neighborhood-cookout.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Neighborhood Cookout: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Lakeside Weekend",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/lakeside-weekend.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/lakeside-weekend.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Lakeside Weekend: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Shared Lunch",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/shared-lunch.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/shared-lunch.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Shared Lunch: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Garden Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/garden-gathering.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/garden-gathering.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Garden Gathering: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Local Makers",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/local-makers.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/local-makers.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Local Makers: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Trail Day",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/trail-day.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/trail-day.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Trail Day: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Front Porch Rest",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/front-porch-rest.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/front-porch-rest.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Front Porch Rest: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    }
  ],
  "Columbus Day": [
    {
      "name": "Columbus Day · Maritime Museum",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/maritime-museum.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/maritime-museum.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Maritime Museum: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Harbor History",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/harbor-history.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/harbor-history.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Harbor History: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Nautical Study",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/nautical-study.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/nautical-study.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Nautical Study: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Sailcloth",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/sailcloth.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/sailcloth.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Sailcloth: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · History Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/history-workshop.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/history-workshop.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "History Workshop: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Coastal Archive",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/coastal-archive.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/coastal-archive.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Coastal Archive: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Harbor Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/harbor-walk.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/harbor-walk.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Harbor Walk: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Museum Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/museum-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/museum-courtyard.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Museum Courtyard: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Navigation Desk",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/navigation-desk.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/navigation-desk.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Navigation Desk: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Community Discussion",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/community-discussion.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/community-discussion.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Community Discussion: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    }
  ],
  "Veterans Day": [
    {
      "name": "Veterans Day · With Gratitude",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/with-gratitude.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/with-gratitude.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "With Gratitude: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Community Breakfast",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/community-breakfast.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/community-breakfast.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Community Breakfast: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Service Stories",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/service-stories.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/service-stories.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Service Stories: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Honor Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/honor-garden.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/honor-garden.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Honor Garden: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Welcome Home",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/welcome-home.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/welcome-home.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Welcome Home: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Shared Coffee",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/shared-coffee.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/shared-coffee.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Shared Coffee: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Quiet Tribute",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/quiet-tribute.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/quiet-tribute.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Quiet Tribute: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Gather to Honor",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/gather-to-honor.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/gather-to-honor.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Gather to Honor: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Letters of Thanks",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/letters-of-thanks.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/letters-of-thanks.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Letters of Thanks: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · November Reflection",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/november-reflection.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/november-reflection.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "November Reflection: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    }
  ],
  "Thanksgiving": [
    {
      "name": "Thanksgiving · Harvest Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/harvest-supper.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/harvest-supper.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Harvest Supper: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Kitchen Preparations",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/kitchen-preparations.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/kitchen-preparations.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Kitchen Preparations: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Gather Round",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/gather-round.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/gather-round.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Gather Round: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Autumn Pantry",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/autumn-pantry.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/autumn-pantry.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Autumn Pantry: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Passing the Plate",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/passing-the-plate.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/passing-the-plate.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Passing the Plate: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Grateful Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/grateful-garden.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/grateful-garden.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Grateful Garden: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Pie Social",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/pie-social.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/pie-social.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Pie Social: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Country Table",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/country-table.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/country-table.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Country Table: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Neighborly Feast",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/neighborly-feast.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/neighborly-feast.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Neighborly Feast: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Candlelit Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/candlelit-supper.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/candlelit-supper.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Candlelit Supper: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    }
  ],
  "Christmas": [
    {
      "name": "Christmas · Evergreen Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/evergreen-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/christmas/evergreen-kitchen.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Evergreen Kitchen: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Front Door Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/front-door-welcome.webp",
      "artworkPath": "/templates/signup/holidays/christmas/front-door-welcome.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Front Door Welcome: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Family Table",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/family-table.webp",
      "artworkPath": "/templates/signup/holidays/christmas/family-table.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Family Table: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Wrapped with Care",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/wrapped-with-care.webp",
      "artworkPath": "/templates/signup/holidays/christmas/wrapped-with-care.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Wrapped with Care: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Neighborhood Lights",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/neighborhood-lights.webp",
      "artworkPath": "/templates/signup/holidays/christmas/neighborhood-lights.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Neighborhood Lights: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Cookie Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/cookie-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/christmas/cookie-afternoon.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Cookie Afternoon: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Winter Window",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/winter-window.webp",
      "artworkPath": "/templates/signup/holidays/christmas/winter-window.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Winter Window: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Community Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/community-supper.webp",
      "artworkPath": "/templates/signup/holidays/christmas/community-supper.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Community Supper: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Quiet Christmas",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/quiet-christmas.webp",
      "artworkPath": "/templates/signup/holidays/christmas/quiet-christmas.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Quiet Christmas: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Cozy Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/cozy-gathering.webp",
      "artworkPath": "/templates/signup/holidays/christmas/cozy-gathering.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Cozy Gathering: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    }
  ],
  "New Year’s Eve": [
    {
      "name": "New Year’s Eve · Small Celebration",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/small-celebration.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/small-celebration.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Small Celebration: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · City Window",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/city-window.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/city-window.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "City Window: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Midnight Table",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/midnight-table.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/midnight-table.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Midnight Table: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Paper Confetti",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/paper-confetti.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/paper-confetti.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Paper Confetti: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Kitchen Toast",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/kitchen-toast.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/kitchen-toast.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Kitchen Toast: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Evening Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/evening-supper.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/evening-supper.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Evening Supper: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Record Night",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/record-night.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/record-night.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Record Night: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Winter Terrace",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/winter-terrace.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/winter-terrace.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Winter Terrace: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Golden Pears",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/golden-pears.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/golden-pears.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Golden Pears: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · After Dark",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/after-dark.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/after-dark.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "After Dark: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    }
  ],
  "Valentine’s Day": [
    {
      "name": "Valentine’s Day · Paper Hearts",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/paper-hearts.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/paper-hearts.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Paper Hearts: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Garden Roses",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/garden-roses.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/garden-roses.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Garden Roses: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Coffee for Two",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/coffee-for-two.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/coffee-for-two.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Coffee for Two: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Friendship Table",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/friendship-table.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/friendship-table.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Friendship Table: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Cookie Exchange",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/cookie-exchange.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/cookie-exchange.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Cookie Exchange: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Letters and Flowers",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/letters-and-flowers.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/letters-and-flowers.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Letters and Flowers: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Winter Picnic",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/winter-picnic.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/winter-picnic.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Winter Picnic: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Sweet Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/sweet-workshop.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/sweet-workshop.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Sweet Workshop: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Pink Tulips",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/pink-tulips.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/pink-tulips.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Pink Tulips: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Shared Dessert",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/shared-dessert.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/shared-dessert.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Shared Dessert: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    }
  ],
  "St. Patrick’s Day": [
    {
      "name": "St. Patrick’s Day · Green Table",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/green-table.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/green-table.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Green Table: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Soda Bread",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/soda-bread.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/soda-bread.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Soda Bread: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Spring Clover",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/spring-clover.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/spring-clover.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Spring Clover: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Neighborhood Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/neighborhood-supper.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/neighborhood-supper.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Neighborhood Supper: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Irish Tea",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/irish-tea.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/irish-tea.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Irish Tea: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Music Evening",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/music-evening.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/music-evening.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Music Evening: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Garden Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/garden-gathering.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/garden-gathering.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Garden Gathering: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Paper Garland",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/paper-garland.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/paper-garland.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Paper Garland: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Pot of Clover",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/pot-of-clover.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/pot-of-clover.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Pot of Clover: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Local Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/local-gathering.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/local-gathering.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Local Gathering: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    }
  ],
  "Mardi Gras": [
    {
      "name": "Mardi Gras · King Cake",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/king-cake.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/king-cake.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "King Cake: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Paper Carnival",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/paper-carnival.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/paper-carnival.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Paper Carnival: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Brass Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/brass-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/brass-afternoon.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Brass Afternoon: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Porch Colors",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/porch-colors.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/porch-colors.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Porch Colors: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Carnival Table",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/carnival-table.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/carnival-table.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Carnival Table: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Handmade Masks",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/handmade-masks.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/handmade-masks.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Handmade Masks: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Neighborhood Music",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/neighborhood-music.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/neighborhood-music.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Neighborhood Music: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Ribbon Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/ribbon-workshop.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/ribbon-workshop.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Ribbon Workshop: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Community Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/community-supper.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/community-supper.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Community Supper: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    },
    {
      "name": "Mardi Gras · Courtyard Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/mardi-gras/courtyard-gathering.webp",
      "artworkPath": "/templates/signup/holidays/mardi-gras/courtyard-gathering.webp",
      "occasion": "mardi-gras",
      "audience": "Community & Family",
      "description": "Courtyard Gathering: a Mardi Gras design for your own event details and signup sections.",
      "keywords": "Mardi Gras Fat Tuesday carnival"
    }
  ],
  "Easter": [
    {
      "name": "Easter · Garden Egg Hunt",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/garden-egg-hunt.webp",
      "artworkPath": "/templates/signup/holidays/easter/garden-egg-hunt.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Garden Egg Hunt: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Spring Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/spring-basket.webp",
      "artworkPath": "/templates/signup/holidays/easter/spring-basket.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Spring Basket: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Easter Brunch",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/easter-brunch.webp",
      "artworkPath": "/templates/signup/holidays/easter/easter-brunch.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Easter Brunch: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Quiet Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/quiet-morning.webp",
      "artworkPath": "/templates/signup/holidays/easter/quiet-morning.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Quiet Morning: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Painted Eggs",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/painted-eggs.webp",
      "artworkPath": "/templates/signup/holidays/easter/painted-eggs.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Painted Eggs: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Garden Table",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/garden-table.webp",
      "artworkPath": "/templates/signup/holidays/easter/garden-table.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Garden Table: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Spring Baking",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/spring-baking.webp",
      "artworkPath": "/templates/signup/holidays/easter/spring-baking.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Spring Baking: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Daffodil Path",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/daffodil-path.webp",
      "artworkPath": "/templates/signup/holidays/easter/daffodil-path.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Daffodil Path: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Community Hunt",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/community-hunt.webp",
      "artworkPath": "/templates/signup/holidays/easter/community-hunt.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Community Hunt: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    },
    {
      "name": "Easter · Family Lunch",
      "tier": "free",
      "path": "/templates/signup/holidays/easter/family-lunch.webp",
      "artworkPath": "/templates/signup/holidays/easter/family-lunch.webp",
      "occasion": "easter",
      "audience": "Community & Family",
      "description": "Family Lunch: a Easter design for your own event details and signup sections.",
      "keywords": "Easter Sunday spring egg hunt"
    }
  ],
  "Mother’s Day": [
    {
      "name": "Mother’s Day · Garden Brunch",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/garden-brunch.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/garden-brunch.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Garden Brunch: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Peony Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/peony-morning.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/peony-morning.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Peony Morning: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Breakfast Tray",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/breakfast-tray.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/breakfast-tray.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Breakfast Tray: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Tea Together",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/tea-together.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/tea-together.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Tea Together: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Handmade Bouquet",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/handmade-bouquet.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/handmade-bouquet.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Handmade Bouquet: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Family Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/family-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/family-kitchen.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Family Kitchen: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Porch Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/porch-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/porch-afternoon.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Porch Afternoon: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Garden Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/garden-walk.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/garden-walk.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Garden Walk: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Crafted with Love",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/crafted-with-love.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/crafted-with-love.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Crafted with Love: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    },
    {
      "name": "Mother’s Day · Sunday Lunch",
      "tier": "free",
      "path": "/templates/signup/holidays/mothers-day/sunday-lunch.webp",
      "artworkPath": "/templates/signup/holidays/mothers-day/sunday-lunch.webp",
      "occasion": "mothers-day",
      "audience": "Community & Family",
      "description": "Sunday Lunch: a Mother’s Day design for your own event details and signup sections.",
      "keywords": "Mothers Day mom mum May brunch"
    }
  ],
  "Father’s Day": [
    {
      "name": "Father’s Day · Backyard Lunch",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/backyard-lunch.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/backyard-lunch.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Backyard Lunch: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Workshop Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/workshop-morning.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/workshop-morning.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Workshop Morning: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Trail Together",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/trail-together.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/trail-together.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Trail Together: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Coffee Break",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/coffee-break.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/coffee-break.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Coffee Break: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Lakeside Day",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/lakeside-day.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/lakeside-day.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Lakeside Day: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Family Cookout",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/family-cookout.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/family-cookout.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Family Cookout: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Garden Time",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/garden-time.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/garden-time.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Garden Time: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Sunday Pancakes",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/sunday-pancakes.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/sunday-pancakes.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Sunday Pancakes: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Game Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/game-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/game-afternoon.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Game Afternoon: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    },
    {
      "name": "Father’s Day · Front Porch",
      "tier": "free",
      "path": "/templates/signup/holidays/fathers-day/front-porch.webp",
      "artworkPath": "/templates/signup/holidays/fathers-day/front-porch.webp",
      "occasion": "fathers-day",
      "audience": "Community & Family",
      "description": "Front Porch: a Father’s Day design for your own event details and signup sections.",
      "keywords": "Fathers Day dad June"
    }
  ],
  "Earth Day": [
    {
      "name": "Earth Day · Seedling Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/seedling-morning.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/seedling-morning.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Seedling Morning: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Park Cleanup",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/park-cleanup.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/park-cleanup.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Park Cleanup: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Garden Tools",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/garden-tools.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/garden-tools.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Garden Tools: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · River Care",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/river-care.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/river-care.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "River Care: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Native Flowers",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/native-flowers.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/native-flowers.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Native Flowers: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Compost Corner",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/compost-corner.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/compost-corner.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Compost Corner: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Repair Together",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/repair-together.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/repair-together.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Repair Together: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Plant Swap",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/plant-swap.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/plant-swap.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Plant Swap: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Tree Day",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/tree-day.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/tree-day.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Tree Day: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    },
    {
      "name": "Earth Day · Reuse Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/earth-day/reuse-workshop.webp",
      "artworkPath": "/templates/signup/holidays/earth-day/reuse-workshop.webp",
      "occasion": "earth-day",
      "audience": "Community & Family",
      "description": "Reuse Workshop: a Earth Day design for your own event details and signup sections.",
      "keywords": "Earth Day April environment cleanup planet"
    }
  ],
  "Cinco de Mayo": [
    {
      "name": "Cinco de Mayo · Community Table",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/community-table.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/community-table.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Community Table: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Paper Banners",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/paper-banners.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/paper-banners.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Paper Banners: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Family Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/family-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/family-kitchen.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Family Kitchen: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Puebla Ceramics",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/puebla-ceramics.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/puebla-ceramics.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Puebla Ceramics: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Courtyard Lunch",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/courtyard-lunch.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/courtyard-lunch.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Courtyard Lunch: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Cooking Together",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/cooking-together.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/cooking-together.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Cooking Together: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Flower Market",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/flower-market.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/flower-market.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Flower Market: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Shared Recipes",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/shared-recipes.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/shared-recipes.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Shared Recipes: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Music Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/music-gathering.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/music-gathering.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Music Gathering: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    },
    {
      "name": "Cinco de Mayo · Neighborhood Celebration",
      "tier": "free",
      "path": "/templates/signup/holidays/cinco-de-mayo/neighborhood-celebration.webp",
      "artworkPath": "/templates/signup/holidays/cinco-de-mayo/neighborhood-celebration.webp",
      "occasion": "cinco-de-mayo",
      "audience": "Community & Family",
      "description": "Neighborhood Celebration: a Cinco de Mayo design for your own event details and signup sections.",
      "keywords": "Cinco de Mayo May fifth Mexican culture Puebla"
    }
  ],
  "Halloween": [
    {
      "name": "Halloween · Pumpkin Porch",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/pumpkin-porch.webp",
      "artworkPath": "/templates/signup/holidays/halloween/pumpkin-porch.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Pumpkin Porch: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Friendly Ghosts",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/friendly-ghosts.webp",
      "artworkPath": "/templates/signup/holidays/halloween/friendly-ghosts.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Friendly Ghosts: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Autumn Doorstep",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/autumn-doorstep.webp",
      "artworkPath": "/templates/signup/holidays/halloween/autumn-doorstep.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Autumn Doorstep: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Cookie Monsters",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/cookie-monsters.webp",
      "artworkPath": "/templates/signup/holidays/halloween/cookie-monsters.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Cookie Monsters: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Neighborhood Night",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/neighborhood-night.webp",
      "artworkPath": "/templates/signup/holidays/halloween/neighborhood-night.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Neighborhood Night: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Paper Bats",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/paper-bats.webp",
      "artworkPath": "/templates/signup/holidays/halloween/paper-bats.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Paper Bats: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Pumpkin Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/pumpkin-workshop.webp",
      "artworkPath": "/templates/signup/holidays/halloween/pumpkin-workshop.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Pumpkin Workshop: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Harvest Treats",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/harvest-treats.webp",
      "artworkPath": "/templates/signup/holidays/halloween/harvest-treats.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Harvest Treats: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Cozy Spooky",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/cozy-spooky.webp",
      "artworkPath": "/templates/signup/holidays/halloween/cozy-spooky.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Cozy Spooky: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Lantern Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/lantern-walk.webp",
      "artworkPath": "/templates/signup/holidays/halloween/lantern-walk.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Lantern Walk: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    }
  ],
  "Indigenous Peoples’ Day": [
    {
      "name": "Indigenous Peoples’ Day · Community Learning",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/community-learning.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/community-learning.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Community Learning: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Land and Water",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/land-and-water.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/land-and-water.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Land and Water: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Native Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/native-garden.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/native-garden.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Native Garden: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Shared Conversation",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/shared-conversation.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/shared-conversation.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Shared Conversation: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Local Voices",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/local-voices.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/local-voices.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Local Voices: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Stewardship Day",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/stewardship-day.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/stewardship-day.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Stewardship Day: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Harvest Table",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/harvest-table.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/harvest-table.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Harvest Table: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Neighborhood Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/neighborhood-gathering.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/neighborhood-gathering.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Neighborhood Gathering: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Living Landscape",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/living-landscape.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/living-landscape.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Living Landscape: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    },
    {
      "name": "Indigenous Peoples’ Day · Learning Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/indigenous-peoples-day/learning-circle.webp",
      "artworkPath": "/templates/signup/holidays/indigenous-peoples-day/learning-circle.webp",
      "occasion": "indigenous-peoples-day",
      "audience": "Community & Family",
      "description": "Learning Circle: a Indigenous Peoples’ Day design for your own event details and signup sections.",
      "keywords": "Indigenous Peoples Day October Native community"
    }
  ],
  "Día de los Muertos": [
    {
      "name": "Día de los Muertos · Marigold Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/marigold-morning.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/marigold-morning.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Marigold Morning: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Remembrance Table",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/remembrance-table.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/remembrance-table.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Remembrance Table: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Pan de Muerto",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/pan-de-muerto.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/pan-de-muerto.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Pan de Muerto: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Paper Flowers",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/paper-flowers.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/paper-flowers.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Paper Flowers: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Courtyard Marigolds",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/courtyard-marigolds.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/courtyard-marigolds.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Courtyard Marigolds: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Shared Memories",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/shared-memories.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/shared-memories.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Shared Memories: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Candle and Petals",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/candle-and-petals.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/candle-and-petals.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Candle and Petals: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Community Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/community-workshop.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/community-workshop.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Community Workshop: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Family Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/family-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/family-kitchen.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Family Kitchen: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    },
    {
      "name": "Día de los Muertos · Flower Path",
      "tier": "free",
      "path": "/templates/signup/holidays/day-of-the-dead/flower-path.webp",
      "artworkPath": "/templates/signup/holidays/day-of-the-dead/flower-path.webp",
      "occasion": "day-of-the-dead",
      "audience": "Community & Family",
      "description": "Flower Path: a Día de los Muertos design for your own event details and signup sections.",
      "keywords": "Dia de los Muertos Day of the Dead November remembrance"
    }
  ],
  "Lunar New Year": [
    {
      "name": "Lunar New Year · Red Lanterns",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/red-lanterns.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/red-lanterns.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Red Lanterns: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Mandarin Table",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/mandarin-table.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/mandarin-table.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Mandarin Table: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Family Dumplings",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/family-dumplings.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/family-dumplings.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Family Dumplings: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Spring Branches",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/spring-branches.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/spring-branches.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Spring Branches: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Tea and Fruit",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/tea-and-fruit.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/tea-and-fruit.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Tea and Fruit: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Paper Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/paper-workshop.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/paper-workshop.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Paper Workshop: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Courtyard Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/courtyard-welcome.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/courtyard-welcome.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Courtyard Welcome: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Shared Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/shared-supper.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/shared-supper.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Shared Supper: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · Lantern Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/lantern-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/lantern-afternoon.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "Lantern Afternoon: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    },
    {
      "name": "Lunar New Year · New Year Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/lunar-new-year/new-year-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/lunar-new-year/new-year-kitchen.webp",
      "occasion": "lunar-new-year",
      "audience": "Community & Family",
      "description": "New Year Kitchen: a Lunar New Year design for your own event details and signup sections.",
      "keywords": "Lunar Chinese Korean Vietnamese New Year Tet Seollal"
    }
  ],
  "Passover": [
    {
      "name": "Passover · Seder Table",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/seder-table.webp",
      "artworkPath": "/templates/signup/holidays/passover/seder-table.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Seder Table: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Matzah and Linen",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/matzah-and-linen.webp",
      "artworkPath": "/templates/signup/holidays/passover/matzah-and-linen.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Matzah and Linen: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Spring Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/spring-welcome.webp",
      "artworkPath": "/templates/signup/holidays/passover/spring-welcome.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Spring Welcome: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Family Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/family-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/passover/family-kitchen.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Family Kitchen: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Quiet Preparation",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/quiet-preparation.webp",
      "artworkPath": "/templates/signup/holidays/passover/quiet-preparation.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Quiet Preparation: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Community Seder",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/community-seder.webp",
      "artworkPath": "/templates/signup/holidays/passover/community-seder.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Community Seder: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Silver Cup",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/silver-cup.webp",
      "artworkPath": "/templates/signup/holidays/passover/silver-cup.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Silver Cup: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Spring Window",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/spring-window.webp",
      "artworkPath": "/templates/signup/holidays/passover/spring-window.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Spring Window: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Gather Together",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/gather-together.webp",
      "artworkPath": "/templates/signup/holidays/passover/gather-together.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Gather Together: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    },
    {
      "name": "Passover · Shared Traditions",
      "tier": "free",
      "path": "/templates/signup/holidays/passover/shared-traditions.webp",
      "artworkPath": "/templates/signup/holidays/passover/shared-traditions.webp",
      "occasion": "passover",
      "audience": "Community & Family",
      "description": "Shared Traditions: a Passover design for your own event details and signup sections.",
      "keywords": "Passover Pesach seder spring"
    }
  ],
  "Rosh Hashanah": [
    {
      "name": "Rosh Hashanah · Apples and Honey",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/apples-and-honey.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/apples-and-honey.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Apples and Honey: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Round Challah",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/round-challah.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/round-challah.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Round Challah: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Sweet Beginning",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/sweet-beginning.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/sweet-beginning.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Sweet Beginning: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Autumn Orchard",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/autumn-orchard.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/autumn-orchard.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Autumn Orchard: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Pomegranate Table",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/pomegranate-table.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/pomegranate-table.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Pomegranate Table: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Family Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/family-gathering.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/family-gathering.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Family Gathering: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Honey Cake",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/honey-cake.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/honey-cake.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Honey Cake: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Quiet Reflection",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/quiet-reflection.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/quiet-reflection.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Quiet Reflection: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Community Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/community-welcome.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/community-welcome.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Community Welcome: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    },
    {
      "name": "Rosh Hashanah · Golden Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/rosh-hashanah/golden-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/rosh-hashanah/golden-kitchen.webp",
      "occasion": "rosh-hashanah",
      "audience": "Community & Family",
      "description": "Golden Kitchen: a Rosh Hashanah design for your own event details and signup sections.",
      "keywords": "Rosh Hashanah Jewish New Year apples honey"
    }
  ],
  "Yom Kippur": [
    {
      "name": "Yom Kippur · Quiet Candle",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/quiet-candle.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/quiet-candle.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Quiet Candle: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Reflection Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/reflection-garden.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/reflection-garden.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Reflection Garden: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Open Door",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/open-door.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/open-door.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Open Door: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Still Water",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/still-water.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/still-water.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Still Water: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · White Linen",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/white-linen.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/white-linen.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "White Linen: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Community Space",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/community-space.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/community-space.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Community Space: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Autumn Light",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/autumn-light.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/autumn-light.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Autumn Light: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Peaceful Path",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/peaceful-path.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/peaceful-path.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Peaceful Path: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Gather in Reflection",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/gather-in-reflection.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/gather-in-reflection.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Gather in Reflection: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    },
    {
      "name": "Yom Kippur · Evening Candle",
      "tier": "free",
      "path": "/templates/signup/holidays/yom-kippur/evening-candle.webp",
      "artworkPath": "/templates/signup/holidays/yom-kippur/evening-candle.webp",
      "occasion": "yom-kippur",
      "audience": "Community & Family",
      "description": "Evening Candle: a Yom Kippur design for your own event details and signup sections.",
      "keywords": "Yom Kippur Day of Atonement reflection"
    }
  ],
  "Sukkot": [
    {
      "name": "Sukkot · Garden Sukkah",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/garden-sukkah.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/garden-sukkah.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Garden Sukkah: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Harvest Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/harvest-basket.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/harvest-basket.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Harvest Basket: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Under the Branches",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/under-the-branches.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/under-the-branches.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Under the Branches: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Paper Chains",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/paper-chains.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/paper-chains.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Paper Chains: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Autumn Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/autumn-welcome.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/autumn-welcome.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Autumn Welcome: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Shared Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/shared-supper.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/shared-supper.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Shared Supper: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Garden Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/garden-gathering.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/garden-gathering.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Garden Gathering: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Harvest Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/harvest-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/harvest-kitchen.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Harvest Kitchen: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Afternoon Shade",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/afternoon-shade.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/afternoon-shade.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Afternoon Shade: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    },
    {
      "name": "Sukkot · Community Sukkah",
      "tier": "free",
      "path": "/templates/signup/holidays/sukkot/community-sukkah.webp",
      "artworkPath": "/templates/signup/holidays/sukkot/community-sukkah.webp",
      "occasion": "sukkot",
      "audience": "Community & Family",
      "description": "Community Sukkah: a Sukkot design for your own event details and signup sections.",
      "keywords": "Sukkot sukkah harvest Jewish fall"
    }
  ],
  "Hanukkah": [
    {
      "name": "Hanukkah · Window Lights",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/window-lights.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/window-lights.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Window Lights: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Latke Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/latke-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/latke-kitchen.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Latke Kitchen: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Dreidel Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/dreidel-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/dreidel-afternoon.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Dreidel Afternoon: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Family Table",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/family-table.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/family-table.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Family Table: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Sufganiyot",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/sufganiyot.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/sufganiyot.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Sufganiyot: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Blue and Linen",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/blue-and-linen.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/blue-and-linen.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Blue and Linen: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Community Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/community-supper.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/community-supper.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Community Supper: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Handmade Stars",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/handmade-stars.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/handmade-stars.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Handmade Stars: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Winter Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/winter-welcome.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/winter-welcome.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Winter Welcome: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    },
    {
      "name": "Hanukkah · Kitchen Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/kitchen-gathering.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/kitchen-gathering.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "Kitchen Gathering: a Hanukkah design for your own event details and signup sections.",
      "keywords": "Hanukkah Chanukah festival lights dreidel"
    }
  ],
  "Kwanzaa": [
    {
      "name": "Kwanzaa · Harvest Table",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/harvest-table.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/harvest-table.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Harvest Table: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Seven Candles",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/seven-candles.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/seven-candles.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Seven Candles: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Community Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/community-gathering.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/community-gathering.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Community Gathering: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Shared Fruit",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/shared-fruit.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/shared-fruit.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Shared Fruit: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Family Meal",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/family-meal.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/family-meal.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Family Meal: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Handmade Gifts",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/handmade-gifts.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/handmade-gifts.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Handmade Gifts: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Story Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/story-circle.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/story-circle.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Story Circle: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Woven Textures",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/woven-textures.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/woven-textures.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Woven Textures: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Neighborhood Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/neighborhood-supper.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/neighborhood-supper.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Neighborhood Supper: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    },
    {
      "name": "Kwanzaa · Growing Community",
      "tier": "free",
      "path": "/templates/signup/holidays/kwanzaa/growing-community.webp",
      "artworkPath": "/templates/signup/holidays/kwanzaa/growing-community.webp",
      "occasion": "kwanzaa",
      "audience": "Community & Family",
      "description": "Growing Community: a Kwanzaa design for your own event details and signup sections.",
      "keywords": "Kwanzaa December January community harvest"
    }
  ],
  "Ramadan": [
    {
      "name": "Ramadan · Dates and Water",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/dates-and-water.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/dates-and-water.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Dates and Water: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Evening Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/evening-welcome.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/evening-welcome.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Evening Welcome: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Community Iftar",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/community-iftar.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/community-iftar.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Community Iftar: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Shared Soup",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/shared-soup.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/shared-soup.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Shared Soup: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Quiet Lantern",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/quiet-lantern.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/quiet-lantern.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Quiet Lantern: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Family Preparation",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/family-preparation.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/family-preparation.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Family Preparation: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Tea After Sunset",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/tea-after-sunset.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/tea-after-sunset.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Tea After Sunset: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Neighborhood Table",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/neighborhood-table.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/neighborhood-table.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Neighborhood Table: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Giving Together",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/giving-together.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/giving-together.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Giving Together: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    },
    {
      "name": "Ramadan · Evening Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/ramadan/evening-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/ramadan/evening-courtyard.webp",
      "occasion": "ramadan",
      "audience": "Community & Family",
      "description": "Evening Courtyard: a Ramadan design for your own event details and signup sections.",
      "keywords": "Ramadan Ramazan iftar suhoor community"
    }
  ],
  "Eid al-Fitr": [
    {
      "name": "Eid al-Fitr · Morning Sweets",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/morning-sweets.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/morning-sweets.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Morning Sweets: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Open House",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/open-house.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/open-house.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Open House: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Family Brunch",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/family-brunch.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/family-brunch.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Family Brunch: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Gift Envelopes",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/gift-envelopes.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/gift-envelopes.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Gift Envelopes: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Garden Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/garden-gathering.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/garden-gathering.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Garden Gathering: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Community Lunch",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/community-lunch.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/community-lunch.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Community Lunch: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Sweet Exchange",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/sweet-exchange.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/sweet-exchange.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Sweet Exchange: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Spring Flowers",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/spring-flowers.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/spring-flowers.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Spring Flowers: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Tea Together",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/tea-together.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/tea-together.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Tea Together: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Neighborhood Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/neighborhood-welcome.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/neighborhood-welcome.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Neighborhood Welcome: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    }
  ],
  "Eid al-Adha": [
    {
      "name": "Eid al-Adha · Shared Table",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/shared-table.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/shared-table.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Shared Table: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Giving Day",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/giving-day.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/giving-day.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Giving Day: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Garden Lunch",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/garden-lunch.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/garden-lunch.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Garden Lunch: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Family Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/family-welcome.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/family-welcome.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Family Welcome: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Tea and Dates",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/tea-and-dates.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/tea-and-dates.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Tea and Dates: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Community Meal",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/community-meal.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/community-meal.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Community Meal: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Wrapped with Care",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/wrapped-with-care.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/wrapped-with-care.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Wrapped with Care: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Kitchen Preparations",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/kitchen-preparations.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/kitchen-preparations.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Kitchen Preparations: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Neighborly Sharing",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/neighborly-sharing.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/neighborly-sharing.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Neighborly Sharing: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Courtyard Together",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/courtyard-together.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/courtyard-together.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Courtyard Together: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    }
  ],
  "Diwali": [
    {
      "name": "Diwali · Clay Lamps",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/clay-lamps.webp",
      "artworkPath": "/templates/signup/holidays/diwali/clay-lamps.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Clay Lamps: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Marigold Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/marigold-welcome.webp",
      "artworkPath": "/templates/signup/holidays/diwali/marigold-welcome.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Marigold Welcome: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Sweets to Share",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/sweets-to-share.webp",
      "artworkPath": "/templates/signup/holidays/diwali/sweets-to-share.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Sweets to Share: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Family Rangoli",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/family-rangoli.webp",
      "artworkPath": "/templates/signup/holidays/diwali/family-rangoli.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Family Rangoli: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Evening Table",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/evening-table.webp",
      "artworkPath": "/templates/signup/holidays/diwali/evening-table.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Evening Table: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Lamp Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/lamp-workshop.webp",
      "artworkPath": "/templates/signup/holidays/diwali/lamp-workshop.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Lamp Workshop: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Courtyard Lights",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/courtyard-lights.webp",
      "artworkPath": "/templates/signup/holidays/diwali/courtyard-lights.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Courtyard Lights: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Gift of Sweets",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/gift-of-sweets.webp",
      "artworkPath": "/templates/signup/holidays/diwali/gift-of-sweets.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Gift of Sweets: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Kitchen Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/kitchen-gathering.webp",
      "artworkPath": "/templates/signup/holidays/diwali/kitchen-gathering.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Kitchen Gathering: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Quiet Glow",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/quiet-glow.webp",
      "artworkPath": "/templates/signup/holidays/diwali/quiet-glow.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Quiet Glow: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    }
  ],
  "Holi": [
    {
      "name": "Holi · Bowls of Color",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/bowls-of-color.webp",
      "artworkPath": "/templates/signup/holidays/holi/bowls-of-color.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Bowls of Color: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Spring Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/spring-gathering.webp",
      "artworkPath": "/templates/signup/holidays/holi/spring-gathering.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Spring Gathering: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Color Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/color-workshop.webp",
      "artworkPath": "/templates/signup/holidays/holi/color-workshop.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Color Workshop: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Sweet Spring",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/sweet-spring.webp",
      "artworkPath": "/templates/signup/holidays/holi/sweet-spring.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Sweet Spring: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Courtyard Colors",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/courtyard-colors.webp",
      "artworkPath": "/templates/signup/holidays/holi/courtyard-colors.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Courtyard Colors: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Flower Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/flower-welcome.webp",
      "artworkPath": "/templates/signup/holidays/holi/flower-welcome.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Flower Welcome: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Picnic and Color",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/picnic-and-color.webp",
      "artworkPath": "/templates/signup/holidays/holi/picnic-and-color.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Picnic and Color: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Handmade Garland",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/handmade-garland.webp",
      "artworkPath": "/templates/signup/holidays/holi/handmade-garland.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Handmade Garland: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Kitchen Treats",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/kitchen-treats.webp",
      "artworkPath": "/templates/signup/holidays/holi/kitchen-treats.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Kitchen Treats: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · After the Colors",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/after-the-colors.webp",
      "artworkPath": "/templates/signup/holidays/holi/after-the-colors.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "After the Colors: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    }
  ],
  "Nowruz": [
    {
      "name": "Nowruz · Spring Hyacinths",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/spring-hyacinths.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/spring-hyacinths.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Spring Hyacinths: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Green Shoots",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/green-shoots.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/green-shoots.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Green Shoots: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Haft Sin Details",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/haft-sin-details.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/haft-sin-details.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Haft Sin Details: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Family Tea",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/family-tea.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/family-tea.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Family Tea: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Spring Orchard",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/spring-orchard.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/spring-orchard.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Spring Orchard: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Painted Eggs",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/painted-eggs.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/painted-eggs.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Painted Eggs: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Open House",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/open-house.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/open-house.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Open House: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Shared Meal",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/shared-meal.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/shared-meal.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Shared Meal: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Garden Picnic",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/garden-picnic.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/garden-picnic.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Garden Picnic: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Fresh Beginning",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/fresh-beginning.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/fresh-beginning.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Fresh Beginning: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    }
  ],
  "Vaisakhi": [
    {
      "name": "Vaisakhi · Harvest Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/harvest-morning.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/harvest-morning.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Harvest Morning: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Community Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/community-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/community-kitchen.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Community Kitchen: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Shared Meal",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/shared-meal.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/shared-meal.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Shared Meal: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Spring Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/spring-welcome.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/spring-welcome.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Spring Welcome: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Golden Wheat",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/golden-wheat.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/golden-wheat.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Golden Wheat: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Helping Together",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/helping-together.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/helping-together.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Helping Together: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Garden Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/garden-gathering.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/garden-gathering.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Garden Gathering: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Harvest Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/harvest-basket.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/harvest-basket.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Harvest Basket: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Community Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/community-hall.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/community-hall.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Community Hall: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Spring Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/spring-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/spring-courtyard.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Spring Courtyard: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    }
  ],
  "Corn Mazes": [
    {
      "name": "Corn Mazes · Farm Trail",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/farm-trail.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/farm-trail.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Farm Trail: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Barnside Maze",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/barnside-maze.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/barnside-maze.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Barnside Maze: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Morning Dew",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/morning-dew.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/morning-dew.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Morning Dew: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Field Journal",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/field-journal.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/field-journal.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Field Journal: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Harvest Entrance",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/harvest-entrance.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/harvest-entrance.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Harvest Entrance: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Country Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/country-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/country-afternoon.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Country Afternoon: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Pumpkin Stop",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/pumpkin-stop.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/pumpkin-stop.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Pumpkin Stop: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Autumn Footpath",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/autumn-footpath.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/autumn-footpath.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Autumn Footpath: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Family Farm",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/family-farm.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/family-farm.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Family Farm: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Last Rows",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/last-rows.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/last-rows.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Last Rows: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    }
  ],
  "Trunk-or-Treat": [
    {
      "name": "Trunk-or-Treat · Pumpkin Trunk",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/pumpkin-trunk.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/pumpkin-trunk.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Pumpkin Trunk: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Paper Monster",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/paper-monster.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/paper-monster.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Paper Monster: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Neighborhood Treats",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/neighborhood-treats.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/neighborhood-treats.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Neighborhood Treats: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Friendly Ghost Car",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/friendly-ghost-car.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/friendly-ghost-car.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Friendly Ghost Car: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Fall Tailgate",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/fall-tailgate.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/fall-tailgate.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Fall Tailgate: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Candy Crew",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/candy-crew.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/candy-crew.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Candy Crew: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Storybook Trunk",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/storybook-trunk.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/storybook-trunk.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Storybook Trunk: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Harvest Parking Lot",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/harvest-parking-lot.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/harvest-parking-lot.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Harvest Parking Lot: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Spooky Little Setup",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/spooky-little-setup.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/spooky-little-setup.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Spooky Little Setup: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Community Candy Stop",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/community-candy-stop.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/community-candy-stop.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Community Candy Stop: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    }
  ],
  "Fall Harvest": [
    {
      "name": "Fall Harvest · Apple Orchard",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/apple-orchard.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/apple-orchard.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Apple Orchard: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Pumpkin Patch",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/pumpkin-patch.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/pumpkin-patch.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Pumpkin Patch: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Harvest Table",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/harvest-table.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/harvest-table.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Harvest Table: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Hayride Afternoon",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/hayride-afternoon.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/hayride-afternoon.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Hayride Afternoon: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Market Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/market-morning.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/market-morning.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Market Morning: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Autumn Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/autumn-garden.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/autumn-garden.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Autumn Garden: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Cider Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/cider-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/cider-kitchen.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Cider Kitchen: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Country Porch",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/country-porch.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/country-porch.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Country Porch: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Leaf Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/leaf-walk.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/leaf-walk.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Leaf Walk: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Farm Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/farm-supper.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/farm-supper.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Farm Supper: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    }
  ],
  "Friendsgiving": [
    {
      "name": "Friendsgiving · Bring a Dish",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/bring-a-dish.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/bring-a-dish.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Bring a Dish: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Apartment Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/apartment-supper.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/apartment-supper.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Apartment Supper: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Pie and Coffee",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/pie-and-coffee.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/pie-and-coffee.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Pie and Coffee: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Long Table",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/long-table.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/long-table.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Long Table: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Shared Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/shared-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/shared-kitchen.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Shared Kitchen: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Autumn Picnic",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/autumn-picnic.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/autumn-picnic.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Autumn Picnic: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Soup Night",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/soup-night.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/soup-night.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Soup Night: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Cozy Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/cozy-gathering.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/cozy-gathering.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Cozy Gathering: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Garden Potluck",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/garden-potluck.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/garden-potluck.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Garden Potluck: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    },
    {
      "name": "Friendsgiving · Leftover Brunch",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/leftover-brunch.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/leftover-brunch.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "Leftover Brunch: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
    }
  ],
  "Summer Camps": [
    {
      "name": "Summer Camps · Lakeside Camp",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/lakeside-camp.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/lakeside-camp.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Lakeside Camp: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Nature Explorers",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/nature-explorers.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/nature-explorers.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Nature Explorers: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Art Camp",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/art-camp.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/art-camp.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Art Camp: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Cabin Morning",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/cabin-morning.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/cabin-morning.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Cabin Morning: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Sports Camp",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/sports-camp.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/sports-camp.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Sports Camp: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Trail Camp",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/trail-camp.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/trail-camp.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Trail Camp: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Science Camp",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/science-camp.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/science-camp.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Science Camp: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Music Camp",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/music-camp.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/music-camp.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Music Camp: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Garden Camp",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/garden-camp.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/garden-camp.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Garden Camp: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    },
    {
      "name": "Summer Camps · Campfire Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/summer-camp/campfire-circle.webp",
      "artworkPath": "/templates/signup/holidays/summer-camp/campfire-circle.webp",
      "occasion": "summer-camp",
      "audience": "Community & Family",
      "description": "Campfire Circle: a Summer Camps design for your own event details and signup sections.",
      "keywords": "summer camps day camp camp registration June July August"
    }
  ],
  "Back to School": [
    {
      "name": "Back to School · Classroom Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/classroom-welcome.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/classroom-welcome.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Classroom Welcome: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · Supply Table",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/supply-table.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/supply-table.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Supply Table: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · New Backpack",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/new-backpack.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/new-backpack.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "New Backpack: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · Library Start",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/library-start.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/library-start.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Library Start: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · Teacher Desk",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/teacher-desk.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/teacher-desk.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Teacher Desk: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · School Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/school-garden.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/school-garden.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "School Garden: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · Open House",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/open-house.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/open-house.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Open House: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · Art Supplies",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/art-supplies.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/art-supplies.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Art Supplies: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · Family Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/family-welcome.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/family-welcome.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Family Welcome: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    },
    {
      "name": "Back to School · Fresh Notebooks",
      "tier": "free",
      "path": "/templates/signup/holidays/back-to-school/fresh-notebooks.webp",
      "artworkPath": "/templates/signup/holidays/back-to-school/fresh-notebooks.webp",
      "occasion": "back-to-school",
      "audience": "Community & Family",
      "description": "Fresh Notebooks: a Back to School design for your own event details and signup sections.",
      "keywords": "back to school classroom fall supplies August September"
    }
  ],
  "Graduation": [
    {
      "name": "Graduation · Cap and Gown",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/cap-and-gown.webp",
      "artworkPath": "/templates/signup/holidays/graduation/cap-and-gown.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Cap and Gown: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Garden Reception",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/garden-reception.webp",
      "artworkPath": "/templates/signup/holidays/graduation/garden-reception.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Garden Reception: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · School Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/school-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/graduation/school-courtyard.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "School Courtyard: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Next Chapter",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/next-chapter.webp",
      "artworkPath": "/templates/signup/holidays/graduation/next-chapter.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Next Chapter: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Family Brunch",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/family-brunch.webp",
      "artworkPath": "/templates/signup/holidays/graduation/family-brunch.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Family Brunch: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Community Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/community-hall.webp",
      "artworkPath": "/templates/signup/holidays/graduation/community-hall.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Community Hall: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Library Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/library-steps.webp",
      "artworkPath": "/templates/signup/holidays/graduation/library-steps.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Library Steps: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Photo Corner",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/photo-corner.webp",
      "artworkPath": "/templates/signup/holidays/graduation/photo-corner.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Photo Corner: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Shared Cake",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/shared-cake.webp",
      "artworkPath": "/templates/signup/holidays/graduation/shared-cake.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Shared Cake: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    },
    {
      "name": "Graduation · Summer Sendoff",
      "tier": "free",
      "path": "/templates/signup/holidays/graduation/summer-sendoff.webp",
      "artworkPath": "/templates/signup/holidays/graduation/summer-sendoff.webp",
      "occasion": "graduation",
      "audience": "Community & Family",
      "description": "Summer Sendoff: a Graduation design for your own event details and signup sections.",
      "keywords": "graduation commencement seniors school May June"
    }
  ]
};
