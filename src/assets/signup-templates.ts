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
    },
    {
      "name": "New Year’s Day · Frosted Footbridge",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/frosted-footbridge.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/frosted-footbridge.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Frosted Footbridge: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · January Seed Sort",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/january-seed-sort.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/january-seed-sort.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "January Seed Sort: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Crocus Promise",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/crocus-promise.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/crocus-promise.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Crocus Promise: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Marmalade Peel",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/marmalade-peel.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/marmalade-peel.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Marmalade Peel: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Open Community Room",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/open-community-room.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/open-community-room.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Open Community Room: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Quiet Harbor Year",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/quiet-harbor-year.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/quiet-harbor-year.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Quiet Harbor Year: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Rooftop Winter Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/rooftop-winter-garden.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/rooftop-winter-garden.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Rooftop Winter Garden: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Bicycle Ready",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/bicycle-ready.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/bicycle-ready.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Bicycle Ready: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Bare Orchard Branches",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/bare-orchard-branches.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/bare-orchard-branches.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Bare Orchard Branches: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Doorstep Milk",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/doorstep-milk.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/doorstep-milk.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Doorstep Milk: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · First Evening Windows",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/first-evening-windows.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/first-evening-windows.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "First Evening Windows: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · New Year Swim Bench",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/new-year-swim-bench.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/new-year-swim-bench.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "New Year Swim Bench: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Winter Allotment",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/winter-allotment.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/winter-allotment.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Winter Allotment: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Fresh Year Puzzle",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/fresh-year-puzzle.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/fresh-year-puzzle.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Fresh Year Puzzle: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Rain Boot Row",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/rain-boot-row.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/rain-boot-row.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Rain Boot Row: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · New Leaf Unfurling",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/new-leaf-unfurling.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/new-leaf-unfurling.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "New Leaf Unfurling: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Bakery Opening",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/bakery-opening.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/bakery-opening.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Bakery Opening: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Seaside First Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/seaside-first-walk.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/seaside-first-walk.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Seaside First Walk: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Courtyard After Rain",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/courtyard-after-rain.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/courtyard-after-rain.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Courtyard After Rain: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Repaired Sled",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/repaired-sled.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/repaired-sled.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Repaired Sled: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Winter Conservatory",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/winter-conservatory.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/winter-conservatory.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Winter Conservatory: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Trail Thermos",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/trail-thermos.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/trail-thermos.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Trail Thermos: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Morning Laundry",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/morning-laundry.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/morning-laundry.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Morning Laundry: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Citrus Breakfast Bowl",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/citrus-breakfast-bowl.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/citrus-breakfast-bowl.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Citrus Breakfast Bowl: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · New Walking Path",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/new-walking-path.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/new-walking-path.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "New Walking Path: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Mended Wool",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/mended-wool.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/mended-wool.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Mended Wool: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Garden Gate Reset",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/garden-gate-reset.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/garden-gate-reset.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Garden Gate Reset: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Lake Reflections",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/lake-reflections.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/lake-reflections.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Lake Reflections: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Stairwell Plant Exchange",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/stairwell-plant-exchange.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/stairwell-plant-exchange.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Stairwell Plant Exchange: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Bread Cooling Rack",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/bread-cooling-rack.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/bread-cooling-rack.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Bread Cooling Rack: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Winter Chimes",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/winter-chimes.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/winter-chimes.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Winter Chimes: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · January Doormat",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/january-doormat.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/january-doormat.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "January Doormat: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Community Yoga Space",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/community-yoga-space.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/community-yoga-space.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Community Yoga Space: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Repair Resolutions",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/repair-resolutions.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/repair-resolutions.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Repair Resolutions: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Icy Birdbath",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/icy-birdbath.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/icy-birdbath.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Icy Birdbath: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Garden Bulb Roots",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/garden-bulb-roots.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/garden-bulb-roots.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Garden Bulb Roots: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Open Reading Nook",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/open-reading-nook.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/open-reading-nook.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Open Reading Nook: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Winter Canal",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/winter-canal.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/winter-canal.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Winter Canal: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Snow Melt Geometry",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/snow-melt-geometry.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/snow-melt-geometry.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Snow Melt Geometry: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Fresh Curtain Breeze",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/fresh-curtain-breeze.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/fresh-curtain-breeze.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Fresh Curtain Breeze: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Greenhouse Rafters",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/greenhouse-rafters.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/greenhouse-rafters.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Greenhouse Rafters: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Library Return Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/library-return-basket.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/library-return-basket.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Library Return Basket: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Neighborhood Lantern",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/neighborhood-lantern.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/neighborhood-lantern.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Neighborhood Lantern: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · First Batch Soup",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/first-batch-soup.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/first-batch-soup.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "First Batch Soup: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Indoor Garden Start",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/indoor-garden-start.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/indoor-garden-start.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Indoor Garden Start: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Blank Year Notebook",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/blank-year-notebook.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/blank-year-notebook.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Blank Year Notebook: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Beach Pebbles",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/beach-pebbles.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/beach-pebbles.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Beach Pebbles: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Tea Steam",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/tea-steam.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/tea-steam.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Tea Steam: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · Workshop Reopening",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/workshop-reopening.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/workshop-reopening.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "Workshop Reopening: a New Year’s Day design for your own event details and signup sections.",
      "keywords": "new year January brunch fresh start"
    },
    {
      "name": "New Year’s Day · First Light Meadow",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-day/first-light-meadow.webp",
      "artworkPath": "/templates/signup/holidays/new-years-day/first-light-meadow.webp",
      "occasion": "new-years-day",
      "audience": "Community & Family",
      "description": "First Light Meadow: a New Year’s Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Martin Luther King Jr. Day · Community Mural Prep",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/community-mural-prep.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/community-mural-prep.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Community Mural Prep: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Winter Care Sorting",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/winter-care-sorting.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/winter-care-sorting.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Winter Care Sorting: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Accessible Ramp Care",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/accessible-ramp-care.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/accessible-ramp-care.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Accessible Ramp Care: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Repaired Book Spine",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/repaired-book-spine.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/repaired-book-spine.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Repaired Book Spine: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Food Pantry Ready",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/food-pantry-ready.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/food-pantry-ready.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Food Pantry Ready: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Riverbank Cleanup",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/riverbank-cleanup.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/riverbank-cleanup.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Riverbank Cleanup: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Shared Courtyard Service",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/shared-courtyard-service.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/shared-courtyard-service.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Shared Courtyard Service: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Bicycle Repair Stand",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/bicycle-repair-stand.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/bicycle-repair-stand.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Bicycle Repair Stand: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Community Hall Lights",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/community-hall-lights.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/community-hall-lights.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Community Hall Lights: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · New Native Sapling",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/new-native-sapling.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/new-native-sapling.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "New Native Sapling: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Community Fridge",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/community-fridge.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/community-fridge.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Community Fridge: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · School Kit Assembly",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/school-kit-assembly.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/school-kit-assembly.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "School Kit Assembly: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Fresh Park Bench",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/fresh-park-bench.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/fresh-park-bench.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Fresh Park Bench: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Mended Backpack",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/mended-backpack.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/mended-backpack.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Mended Backpack: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Warming Center Entrance",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/warming-center-entrance.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/warming-center-entrance.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Warming Center Entrance: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Community Orchard Care",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/community-orchard-care.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/community-orchard-care.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Community Orchard Care: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Library Donation Landing",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/library-donation-landing.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/library-donation-landing.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Library Donation Landing: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Wheelchair Maintenance",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/wheelchair-maintenance.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/wheelchair-maintenance.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Wheelchair Maintenance: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · New Porch Handrail",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/new-porch-handrail.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/new-porch-handrail.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "New Porch Handrail: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Park Path Clearing",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/park-path-clearing.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/park-path-clearing.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Park Path Clearing: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Community Sewing Room",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/community-sewing-room.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/community-sewing-room.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Community Sewing Room: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Pantry Portions",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/pantry-portions.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/pantry-portions.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Pantry Portions: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Clean Playground Edge",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/clean-playground-edge.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/clean-playground-edge.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Clean Playground Edge: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Patched Winter Coat",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/patched-winter-coat.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/patched-winter-coat.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Patched Winter Coat: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Neighborhood Meal Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/neighborhood-meal-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/neighborhood-meal-kitchen.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Neighborhood Meal Kitchen: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Restored Walking Trail",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/restored-walking-trail.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/restored-walking-trail.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Restored Walking Trail: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · School Garden Renewal",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/school-garden-renewal.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/school-garden-renewal.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "School Garden Renewal: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Donation Cart",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/donation-cart.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/donation-cart.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Donation Cart: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Shelter Repair Rafters",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/shelter-repair-rafters.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/shelter-repair-rafters.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Shelter Repair Rafters: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Community Chalk Supplies",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/community-chalk-supplies.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/community-chalk-supplies.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Community Chalk Supplies: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Volunteer Storage Room",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/volunteer-storage-room.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/volunteer-storage-room.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Volunteer Storage Room: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Mending Circle Materials",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/mending-circle-materials.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/mending-circle-materials.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Mending Circle Materials: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · New Rain Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/new-rain-garden.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/new-rain-garden.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "New Rain Garden: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Accessible Door Hardware",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/accessible-door-hardware.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/accessible-door-hardware.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Accessible Door Hardware: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Book Exchange Shed",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/book-exchange-shed.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/book-exchange-shed.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Book Exchange Shed: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Neighbors Garden Rows",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/neighbors-garden-rows.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/neighbors-garden-rows.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Neighbors Garden Rows: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Hall Coat Collection",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/hall-coat-collection.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/hall-coat-collection.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Hall Coat Collection: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Pantry Packing Shelf",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/pantry-packing-shelf.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/pantry-packing-shelf.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Pantry Packing Shelf: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Repaired Greenhouse Glass",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/repaired-greenhouse-glass.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/repaired-greenhouse-glass.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Repaired Greenhouse Glass: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Service Water Station",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/service-water-station.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/service-water-station.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Service Water Station: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Shared Computer Lab",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/shared-computer-lab.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/shared-computer-lab.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Shared Computer Lab: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Seed Library Refill",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/seed-library-refill.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/seed-library-refill.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Seed Library Refill: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Crossing Planters",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/crossing-planters.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/crossing-planters.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Crossing Planters: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Restored Chair Joint",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/restored-chair-joint.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/restored-chair-joint.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Restored Chair Joint: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Listening Room",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/listening-room.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/listening-room.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Listening Room: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Canal Towpath Care",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/canal-towpath-care.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/canal-towpath-care.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Canal Towpath Care: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Courtyard Accessibility",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/courtyard-accessibility.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/courtyard-accessibility.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Courtyard Accessibility: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Blanket Folding",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/blanket-folding.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/blanket-folding.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Blanket Folding: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Service Welcome Awning",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/service-welcome-awning.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/service-welcome-awning.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Service Welcome Awning: a Martin Luther King Jr. Day design for your own event details and signup sections.",
      "keywords": "MLK Martin Luther King day of service January"
    },
    {
      "name": "Martin Luther King Jr. Day · Giving Shelf",
      "tier": "free",
      "path": "/templates/signup/holidays/mlk-day/giving-shelf.webp",
      "artworkPath": "/templates/signup/holidays/mlk-day/giving-shelf.webp",
      "occasion": "mlk-day",
      "audience": "Community & Family",
      "description": "Giving Shelf: a Martin Luther King Jr. Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Presidents’ Day · Courthouse Colonnade",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/courthouse-colonnade.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/courthouse-colonnade.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Courthouse Colonnade: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Archive Folder Repair",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/archive-folder-repair.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/archive-folder-repair.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Archive Folder Repair: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Town Hall Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/town-hall-steps.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/town-hall-steps.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Town Hall Steps: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Brass Door Handle",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/brass-door-handle.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/brass-door-handle.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Brass Door Handle: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Public Meeting Chamber",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/public-meeting-chamber.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/public-meeting-chamber.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Public Meeting Chamber: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Winter Civic Square",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/winter-civic-square.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/winter-civic-square.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Winter Civic Square: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Reading Room Windows",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/reading-room-windows.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/reading-room-windows.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Reading Room Windows: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Printing Press Study",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/printing-press-study.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/printing-press-study.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Printing Press Study: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Clock Tower",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-clock-tower.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-clock-tower.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Clock Tower: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Archive Gloves",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/archive-gloves.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/archive-gloves.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Archive Gloves: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Historical Schoolroom",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/historical-schoolroom.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/historical-schoolroom.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Historical Schoolroom: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Bookbinding Materials",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/bookbinding-materials.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/bookbinding-materials.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Bookbinding Materials: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Garden Gate",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-garden-gate.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-garden-gate.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Garden Gate: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Quill Nib",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/quill-nib.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/quill-nib.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Quill Nib: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Municipal Library",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/municipal-library.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/municipal-library.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Municipal Library: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Riverfront Civic Buildings",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/riverfront-civic-buildings.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/riverfront-civic-buildings.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Riverfront Civic Buildings: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Atrium",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-atrium.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-atrium.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Atrium: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Wooden Ballot Box",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/wooden-ballot-box.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/wooden-ballot-box.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Wooden Ballot Box: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Library Ceiling Beams",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/library-ceiling-beams.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/library-ceiling-beams.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Library Ceiling Beams: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Weathered Civic Lantern",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/weathered-civic-lantern.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/weathered-civic-lantern.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Weathered Civic Lantern: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · History Exhibit Room",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/history-exhibit-room.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/history-exhibit-room.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "History Exhibit Room: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Blank Wax Seals",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/blank-wax-seals.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/blank-wax-seals.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Blank Wax Seals: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Museum Courtyard Paving",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/museum-courtyard-paving.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/museum-courtyard-paving.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Museum Courtyard Paving: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Archive Box Corners",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/archive-box-corners.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/archive-box-corners.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Archive Box Corners: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-workshop.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-workshop.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Workshop: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Winter Bandstand",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/winter-bandstand.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/winter-bandstand.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Winter Bandstand: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Old Town Corner",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/old-town-corner.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/old-town-corner.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Old Town Corner: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Typesetting Tray",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/typesetting-tray.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/typesetting-tray.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Typesetting Tray: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Bell",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-bell.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-bell.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Bell: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Museum Sketch Stool",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/museum-sketch-stool.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/museum-sketch-stool.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Museum Sketch Stool: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Archive Aisle",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/archive-aisle.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/archive-aisle.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Archive Aisle: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Mapmaking Instruments",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/mapmaking-instruments.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/mapmaking-instruments.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Mapmaking Instruments: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Winter Civic Fountain",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/winter-civic-fountain.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/winter-civic-fountain.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Winter Civic Fountain: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Gavel Grain",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/gavel-grain.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/gavel-grain.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Gavel Grain: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · History Reading Alcove",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/history-reading-alcove.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/history-reading-alcove.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "History Reading Alcove: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Brick Municipal Facades",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/brick-municipal-facades.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/brick-municipal-facades.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Brick Municipal Facades: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Museum Stairwell",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/museum-stairwell.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/museum-stairwell.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Museum Stairwell: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Globe Restoration",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/globe-restoration.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/globe-restoration.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Globe Restoration: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Skylight",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-skylight.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-skylight.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Skylight: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Flag Halyard",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/flag-halyard.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/flag-halyard.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Flag Halyard: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Public Records Counter",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/public-records-counter.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/public-records-counter.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Public Records Counter: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Paper Conservation",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/paper-conservation.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/paper-conservation.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Paper Conservation: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Rail Shadows",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-rail-shadows.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-rail-shadows.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Rail Shadows: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Library Card Drawer",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/library-card-drawer.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/library-card-drawer.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Library Card Drawer: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Heritage Tool Shed",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/heritage-tool-shed.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/heritage-tool-shed.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Heritage Tool Shed: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Modest City Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/modest-city-hall.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/modest-city-hall.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Modest City Hall: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Community Forum Seating",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/community-forum-seating.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/community-forum-seating.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Community Forum Seating: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Brass Reading Lamp",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/brass-reading-lamp.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/brass-reading-lamp.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Brass Reading Lamp: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Portico Detail",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/portico-detail.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/portico-detail.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Portico Detail: a Presidents’ Day design for your own event details and signup sections.",
      "keywords": "Washington birthday Presidents Day history February"
    },
    {
      "name": "Presidents’ Day · Civic Winter Bicycle",
      "tier": "free",
      "path": "/templates/signup/holidays/presidents-day/civic-winter-bicycle.webp",
      "artworkPath": "/templates/signup/holidays/presidents-day/civic-winter-bicycle.webp",
      "occasion": "presidents-day",
      "audience": "Community & Family",
      "description": "Civic Winter Bicycle: a Presidents’ Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Memorial Day · Empty Memorial Clearing",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/empty-memorial-clearing.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/empty-memorial-clearing.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Empty Memorial Clearing: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · White Camellia Offering",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/white-camellia-offering.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/white-camellia-offering.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "White Camellia Offering: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Poppy Seedlings",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/poppy-seedlings.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/poppy-seedlings.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Poppy Seedlings: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Weathered Bronze Edge",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/weathered-bronze-edge.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/weathered-bronze-edge.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Weathered Bronze Edge: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Reflection Chapel Door",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/reflection-chapel-door.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/reflection-chapel-door.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Reflection Chapel Door: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Flags Across Meadow",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/flags-across-meadow.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/flags-across-meadow.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Flags Across Meadow: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Remembrance Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/remembrance-circle.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/remembrance-circle.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Remembrance Circle: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Empty Ceremony Bench",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/empty-ceremony-bench.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/empty-ceremony-bench.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Empty Ceremony Bench: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Memorial Oak Canopy",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/memorial-oak-canopy.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/memorial-oak-canopy.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Memorial Oak Canopy: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · White Lily Path",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/white-lily-path.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/white-lily-path.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "White Lily Path: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Cemetery Edge",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/cemetery-edge.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/cemetery-edge.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Cemetery Edge: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Laurel Ribbon",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/laurel-ribbon.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/laurel-ribbon.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Laurel Ribbon: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Rain On Memorial Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/rain-on-memorial-steps.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/rain-on-memorial-steps.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Rain On Memorial Steps: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · White Rose Bud",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/white-rose-bud.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/white-rose-bud.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "White Rose Bud: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Remembrance Gate",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/remembrance-gate.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/remembrance-gate.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Remembrance Gate: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Morning Half Staff",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/morning-half-staff.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/morning-half-staff.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Morning Half Staff: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Courtyard Tribute",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/courtyard-tribute.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/courtyard-tribute.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Courtyard Tribute: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Candle Shelter",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/candle-shelter.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/candle-shelter.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Candle Shelter: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Wreath And Sky",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/wreath-and-sky.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/wreath-and-sky.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Wreath And Sky: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Stone Basin Petals",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/stone-basin-petals.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/stone-basin-petals.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Stone Basin Petals: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Riverside Tribute",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/riverside-tribute.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/riverside-tribute.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Riverside Tribute: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Rosemary Bundle",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/rosemary-bundle.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/rosemary-bundle.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Rosemary Bundle: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Grass And Ribbon",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/grass-and-ribbon.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/grass-and-ribbon.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Grass And Ribbon: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Iris Petal",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/iris-petal.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/iris-petal.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Iris Petal: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Civic Hall Silence",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/civic-hall-silence.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/civic-hall-silence.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Civic Hall Silence: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Memorial Avenue",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/memorial-avenue.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/memorial-avenue.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Memorial Avenue: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · White Flower Beds",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/white-flower-beds.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/white-flower-beds.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "White Flower Beds: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Folded Flag Case",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/folded-flag-case.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/folded-flag-case.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Folded Flag Case: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Spring Elm Shade",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/spring-elm-shade.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/spring-elm-shade.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Spring Elm Shade: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Unopened Guest Book",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/unopened-guest-book.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/unopened-guest-book.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Unopened Guest Book: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Reflection Pond",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/reflection-pond.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/reflection-pond.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Reflection Pond: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Camellia Petals",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/camellia-petals.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/camellia-petals.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Camellia Petals: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Swept Tribute Paving",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/swept-tribute-paving.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/swept-tribute-paving.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Swept Tribute Paving: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Plain Ribbon Knot",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/plain-ribbon-knot.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/plain-ribbon-knot.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Plain Ribbon Knot: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Stone Alcove",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/stone-alcove.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/stone-alcove.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Stone Alcove: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Community Flag Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/community-flag-walk.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/community-flag-walk.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Community Flag Walk: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Empty Garden Benches",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/empty-garden-benches.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/empty-garden-benches.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Empty Garden Benches: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Tribute Flower Care",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/tribute-flower-care.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/tribute-flower-care.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Tribute Flower Care: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Dappled Memorial Shade",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/dappled-memorial-shade.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/dappled-memorial-shade.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Dappled Memorial Shade: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Magnolia On Stone",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/magnolia-on-stone.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/magnolia-on-stone.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Magnolia On Stone: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Quiet Honor Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/quiet-honor-hall.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/quiet-honor-hall.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Quiet Honor Hall: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Cotton And Laurel",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/cotton-and-laurel.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/cotton-and-laurel.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Cotton And Laurel: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Brick Reflection Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/brick-reflection-walk.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/brick-reflection-walk.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Brick Reflection Walk: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Rain On Flag Glass",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/rain-on-flag-glass.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/rain-on-flag-glass.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Rain On Flag Glass: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Remembrance Greenhouse",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/remembrance-greenhouse.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/remembrance-greenhouse.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Remembrance Greenhouse: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Memorial Shore",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/memorial-shore.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/memorial-shore.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Memorial Shore: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Courtyard Laurel Pots",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/courtyard-laurel-pots.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/courtyard-laurel-pots.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Courtyard Laurel Pots: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Single Carnation",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/single-carnation.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/single-carnation.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Single Carnation: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Shelter Rafters",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/shelter-rafters.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/shelter-rafters.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Shelter Rafters: a Memorial Day design for your own event details and signup sections.",
      "keywords": "Memorial Day remembrance honor fallen May"
    },
    {
      "name": "Memorial Day · Garden Tool Pause",
      "tier": "free",
      "path": "/templates/signup/holidays/memorial-day/garden-tool-pause.webp",
      "artworkPath": "/templates/signup/holidays/memorial-day/garden-tool-pause.webp",
      "occasion": "memorial-day",
      "audience": "Community & Family",
      "description": "Garden Tool Pause: a Memorial Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Juneteenth · Neighborhood Pavilion",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/neighborhood-pavilion.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/neighborhood-pavilion.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Neighborhood Pavilion: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Hibiscus Tea Leaves",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/hibiscus-tea-leaves.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/hibiscus-tea-leaves.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Hibiscus Tea Leaves: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Community Garden Rows",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/community-garden-rows.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/community-garden-rows.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Community Garden Rows: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Quilt Stitch",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/quilt-stitch.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/quilt-stitch.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Quilt Stitch: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Open History Library",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/open-history-library.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/open-history-library.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Open History Library: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Summer Neighborhood Street",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/summer-neighborhood-street.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/summer-neighborhood-street.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Summer Neighborhood Street: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Community Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/community-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/community-courtyard.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Community Courtyard: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Acoustic Music Corner",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/acoustic-music-corner.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/acoustic-music-corner.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Acoustic Music Corner: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Red Hibiscus Branch",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/red-hibiscus-branch.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/red-hibiscus-branch.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Red Hibiscus Branch: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Watermelon Stand",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/watermelon-stand.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/watermelon-stand.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Watermelon Stand: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Oral History Booth",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/oral-history-booth.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/oral-history-booth.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Oral History Booth: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Strawberry Preserves",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/strawberry-preserves.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/strawberry-preserves.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Strawberry Preserves: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Sidewalk Chalk Colors",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/sidewalk-chalk-colors.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/sidewalk-chalk-colors.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Sidewalk Chalk Colors: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Cornbread Crust",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/cornbread-crust.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/cornbread-crust.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Cornbread Crust: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Community Kitchen Door",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/community-kitchen-door.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/community-kitchen-door.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Community Kitchen Door: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Park Music Shelter",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/park-music-shelter.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/park-music-shelter.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Park Music Shelter: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Porch Potluck Setup",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/porch-potluck-setup.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/porch-potluck-setup.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Porch Potluck Setup: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Freedom Reading Shelf",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/freedom-reading-shelf.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/freedom-reading-shelf.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Freedom Reading Shelf: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Summer Ribbon Beams",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/summer-ribbon-beams.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/summer-ribbon-beams.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Summer Ribbon Beams: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Okra Harvest Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/okra-harvest-basket.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/okra-harvest-basket.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Okra Harvest Basket: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Neighborhood Craft Market",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/neighborhood-craft-market.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/neighborhood-craft-market.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Neighborhood Craft Market: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Red Bean Ingredients",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/red-bean-ingredients.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/red-bean-ingredients.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Red Bean Ingredients: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Garden Footpath Blooms",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/garden-footpath-blooms.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/garden-footpath-blooms.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Garden Footpath Blooms: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Handmade Drum Skin",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/handmade-drum-skin.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/handmade-drum-skin.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Handmade Drum Skin: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Bakery Window",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/bakery-window.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/bakery-window.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Bakery Window: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Lakeside Gathering Space",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/lakeside-gathering-space.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/lakeside-gathering-space.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Lakeside Gathering Space: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Community Art Yard",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/community-art-yard.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/community-art-yard.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Community Art Yard: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Heirloom Seed Shelf",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/heirloom-seed-shelf.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/heirloom-seed-shelf.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Heirloom Seed Shelf: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Pecan Shade",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/pecan-shade.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/pecan-shade.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Pecan Shade: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Red Velvet Slice",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/red-velvet-slice.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/red-velvet-slice.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Red Velvet Slice: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Basketball Court Break",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/basketball-court-break.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/basketball-court-break.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Basketball Court Break: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Recipe Blank Cards",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/recipe-blank-cards.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/recipe-blank-cards.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Recipe Blank Cards: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Porch Flower Pots",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/porch-flower-pots.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/porch-flower-pots.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Porch Flower Pots: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Peach Skin",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/peach-skin.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/peach-skin.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Peach Skin: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Community Dance Room",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/community-dance-room.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/community-dance-room.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Community Dance Room: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Shared Orchard Summer",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/shared-orchard-summer.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/shared-orchard-summer.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Shared Orchard Summer: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Garden Tables Below",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/garden-tables-below.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/garden-tables-below.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Garden Tables Below: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Wooden Chess Break",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/wooden-chess-break.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/wooden-chess-break.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Wooden Chess Break: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Redbud Leaves",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/redbud-leaves.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/redbud-leaves.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Redbud Leaves: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Garden Harvest Tote",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/garden-harvest-tote.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/garden-harvest-tote.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Garden Harvest Tote: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Family Sewing Room",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/family-sewing-room.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/family-sewing-room.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Family Sewing Room: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Hibiscus Ice",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/hibiscus-ice.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/hibiscus-ice.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Hibiscus Ice: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Summer Picnic Blanket",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/summer-picnic-blanket.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/summer-picnic-blanket.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Summer Picnic Blanket: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Pottery Sharing Bowl",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/pottery-sharing-bowl.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/pottery-sharing-bowl.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Pottery Sharing Bowl: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Welcoming Front Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/welcoming-front-hall.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/welcoming-front-hall.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Welcoming Front Hall: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Juneteenth Riverwalk",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/juneteenth-riverwalk.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/juneteenth-riverwalk.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Juneteenth Riverwalk: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Reading Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/reading-garden.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/reading-garden.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Reading Garden: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Sweet Potato Baking",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/sweet-potato-baking.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/sweet-potato-baking.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Sweet Potato Baking: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Music Shelter Beams",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/music-shelter-beams.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/music-shelter-beams.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Music Shelter Beams: a Juneteenth design for your own event details and signup sections.",
      "keywords": "Juneteenth freedom emancipation June nineteenth"
    },
    {
      "name": "Juneteenth · Neighborhood Bread Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/juneteenth/neighborhood-bread-basket.webp",
      "artworkPath": "/templates/signup/holidays/juneteenth/neighborhood-bread-basket.webp",
      "occasion": "juneteenth",
      "audience": "Community & Family",
      "description": "Neighborhood Bread Basket: a Juneteenth design for your own event details and signup sections.",
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
    },
    {
      "name": "July Fourth · Riverside Bandstand",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/riverside-bandstand.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/riverside-bandstand.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Riverside Bandstand: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Berry Ice Pops",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/berry-ice-pops.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/berry-ice-pops.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Berry Ice Pops: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Parade Street Quiet",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/parade-street-quiet.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/parade-street-quiet.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Parade Street Quiet: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Pinwheel Paper",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/pinwheel-paper.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/pinwheel-paper.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Pinwheel Paper: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Community Cookout Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/community-cookout-hall.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/community-cookout-hall.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Community Cookout Hall: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Lake Firework Reflections",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/lake-firework-reflections.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/lake-firework-reflections.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Lake Firework Reflections: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Block Picnic Setup",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/block-picnic-setup.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/block-picnic-setup.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Block Picnic Setup: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Rowboat Rest",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/rowboat-rest.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/rowboat-rest.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Rowboat Rest: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Porch Bunting",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/porch-bunting.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/porch-bunting.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Porch Bunting: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Watermelon Cooler",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/watermelon-cooler.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/watermelon-cooler.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Watermelon Cooler: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Town Park Gazebo",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/town-park-gazebo.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/town-park-gazebo.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Town Park Gazebo: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Cherry Pie Stars",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/cherry-pie-stars.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/cherry-pie-stars.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Cherry Pie Stars: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Lawn Ring Toss",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/lawn-ring-toss.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/lawn-ring-toss.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Lawn Ring Toss: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Lemonade Condensation",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/lemonade-condensation.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/lemonade-condensation.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Lemonade Condensation: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Lakeside Cabin Door",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/lakeside-cabin-door.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/lakeside-cabin-door.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Lakeside Cabin Door: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Harbor Sailboats",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/harbor-sailboats.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/harbor-sailboats.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Harbor Sailboats: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Pool Picnic Deck",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/pool-picnic-deck.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/pool-picnic-deck.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Pool Picnic Deck: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Wooden Croquet Set",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/wooden-croquet-set.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/wooden-croquet-set.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Wooden Croquet Set: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Summer Flagpole",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/summer-flagpole.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/summer-flagpole.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Summer Flagpole: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Berry Shortcake Serving",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/berry-shortcake-serving.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/berry-shortcake-serving.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Berry Shortcake Serving: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Backyard Grill Corner",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/backyard-grill-corner.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/backyard-grill-corner.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Backyard Grill Corner: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Paper Fan Craft",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/paper-fan-craft.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/paper-fan-craft.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Paper Fan Craft: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Basket In Grass",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/basket-in-grass.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/basket-in-grass.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Basket In Grass: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Corn Silk",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/corn-silk.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/corn-silk.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Corn Silk: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Open Barn Picnic",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/open-barn-picnic.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/open-barn-picnic.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Open Barn Picnic: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Town Water Tower",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/town-water-tower.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/town-water-tower.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Town Water Tower: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Garden Potluck Corner",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/garden-potluck-corner.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/garden-potluck-corner.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Garden Potluck Corner: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Fishing Dock Chairs",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/fishing-dock-chairs.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/fishing-dock-chairs.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Fishing Dock Chairs: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Porch String Lights",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/porch-string-lights.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/porch-string-lights.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Porch String Lights: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Tomato Salad Bowl",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/tomato-salad-bowl.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/tomato-salad-bowl.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Tomato Salad Bowl: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Beach Picnic Shelter",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/beach-picnic-shelter.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/beach-picnic-shelter.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Beach Picnic Shelter: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Ice Cream Sandwiches",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/ice-cream-sandwiches.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/ice-cream-sandwiches.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Ice Cream Sandwiches: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Sidewalk Flags",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/sidewalk-flags.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/sidewalk-flags.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Sidewalk Flags: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Red Cotton Stitching",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/red-cotton-stitching.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/red-cotton-stitching.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Red Cotton Stitching: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Firehouse Picnic Bay",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/firehouse-picnic-bay.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/firehouse-picnic-bay.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Firehouse Picnic Bay: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · River Bridge Evening",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/river-bridge-evening.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/river-bridge-evening.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "River Bridge Evening: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Cabin Yard Games",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/cabin-yard-games.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/cabin-yard-games.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Cabin Yard Games: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Garden Hose Break",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/garden-hose-break.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/garden-hose-break.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Garden Hose Break: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Maple Picnic Canopy",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/maple-picnic-canopy.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/maple-picnic-canopy.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Maple Picnic Canopy: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Peach Cobbler Spoon",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/peach-cobbler-spoon.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/peach-cobbler-spoon.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Peach Cobbler Spoon: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Distant Celebration Light",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/distant-celebration-light.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/distant-celebration-light.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Distant Celebration Light: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Fabric Bunting Mending",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/fabric-bunting-mending.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/fabric-bunting-mending.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Fabric Bunting Mending: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Empty Canoe Landing",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/empty-canoe-landing.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/empty-canoe-landing.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Empty Canoe Landing: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Pickle Jar",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/pickle-jar.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/pickle-jar.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Pickle Jar: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Community Garden Feast",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/community-garden-feast.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/community-garden-feast.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Community Garden Feast: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Field Fireworks",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/field-fireworks.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/field-fireworks.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Field Fireworks: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Neighborhood Porch View",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/neighborhood-porch-view.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/neighborhood-porch-view.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Neighborhood Porch View: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Hand Crank Ice Cream",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/hand-crank-ice-cream.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/hand-crank-ice-cream.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Hand Crank Ice Cream: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · American Elm Avenue",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/american-elm-avenue.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/american-elm-avenue.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "American Elm Avenue: a July Fourth design for your own event details and signup sections.",
      "keywords": "Independence Day 4th July Fourth fourth of July fireworks"
    },
    {
      "name": "July Fourth · Summer Berry Picking",
      "tier": "free",
      "path": "/templates/signup/holidays/july-fourth/summer-berry-picking.webp",
      "artworkPath": "/templates/signup/holidays/july-fourth/summer-berry-picking.webp",
      "occasion": "july-fourth",
      "audience": "Community & Family",
      "description": "Summer Berry Picking: a July Fourth design for your own event details and signup sections.",
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
    },
    {
      "name": "Labor Day · Empty Makers Yard",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/empty-makers-yard.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/empty-makers-yard.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Empty Makers Yard: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Cobbler Repair Kit",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/cobbler-repair-kit.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/cobbler-repair-kit.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Cobbler Repair Kit: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Canal Towpath Rest",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/canal-towpath-rest.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/canal-towpath-rest.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Canal Towpath Rest: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Pottery Impressions",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/pottery-impressions.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/pottery-impressions.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Pottery Impressions: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Workshop Open Door",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/workshop-open-door.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/workshop-open-door.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Workshop Open Door: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Orchard Packing Shed",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/orchard-packing-shed.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/orchard-packing-shed.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Orchard Packing Shed: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Shared Garden Harvest",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/shared-garden-harvest.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/shared-garden-harvest.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Shared Garden Harvest: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Carpentry Bench",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/carpentry-bench.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/carpentry-bench.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Carpentry Bench: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Workshop Rooflight",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/workshop-rooflight.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/workshop-rooflight.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Workshop Rooflight: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Resting Tool Belt",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/resting-tool-belt.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/resting-tool-belt.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Resting Tool Belt: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Pool Closing Season",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/pool-closing-season.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/pool-closing-season.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Pool Closing Season: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Weaver Loom Details",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/weaver-loom-details.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/weaver-loom-details.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Weaver Loom Details: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Work Gloves On Dock",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/work-gloves-on-dock.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/work-gloves-on-dock.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Work Gloves On Dock: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Seam Repair",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/seam-repair.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/seam-repair.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Seam Repair: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Neighborhood Repair Cafe",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/neighborhood-repair-cafe.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/neighborhood-repair-cafe.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Neighborhood Repair Cafe: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Farm Market Break",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/farm-market-break.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/farm-market-break.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Farm Market Break: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Courtyard Holiday Supper",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/courtyard-holiday-supper.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/courtyard-holiday-supper.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Courtyard Holiday Supper: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Metalworker Apron",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/metalworker-apron.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/metalworker-apron.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Metalworker Apron: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Work Shirt Laundry",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/work-shirt-laundry.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/work-shirt-laundry.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Work Shirt Laundry: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Homemade Lunchbox",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/homemade-lunchbox.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/homemade-lunchbox.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Homemade Lunchbox: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Neighborhood Tool Library",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/neighborhood-tool-library.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/neighborhood-tool-library.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Neighborhood Tool Library: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Basket Making",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/basket-making.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/basket-making.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Basket Making: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Trailhead Boots",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/trailhead-boots.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/trailhead-boots.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Trailhead Boots: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Sawdust Curl",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/sawdust-curl.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/sawdust-curl.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Sawdust Curl: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Pottery Kiln Room",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/pottery-kiln-room.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/pottery-kiln-room.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Pottery Kiln Room: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Lakeside Picnic End",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/lakeside-picnic-end.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/lakeside-picnic-end.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Lakeside Picnic End: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Cooperative Apron Laundry",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/cooperative-apron-laundry.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/cooperative-apron-laundry.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Cooperative Apron Laundry: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Florist Bucket",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/florist-bucket.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/florist-bucket.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Florist Bucket: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Restored Porch Beams",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/restored-porch-beams.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/restored-porch-beams.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Restored Porch Beams: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Tomato Harvest Tote",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/tomato-harvest-tote.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/tomato-harvest-tote.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Tomato Harvest Tote: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Clean Community Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/clean-community-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/clean-community-kitchen.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Clean Community Kitchen: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Sewing Machine Care",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/sewing-machine-care.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/sewing-machine-care.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Sewing Machine Care: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Camp Chair Shade",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/camp-chair-shade.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/camp-chair-shade.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Camp Chair Shade: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Handmade Mug",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/handmade-mug.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/handmade-mug.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Handmade Mug: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Bakery Rest Door",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/bakery-rest-door.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/bakery-rest-door.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Bakery Rest Door: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Quiet Working Harbor",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/quiet-working-harbor.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/quiet-working-harbor.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Quiet Working Harbor: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Garden Hammock",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/garden-hammock.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/garden-hammock.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Garden Hammock: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Pannier Repair",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/pannier-repair.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/pannier-repair.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Pannier Repair: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Late Summer Sunflower",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/late-summer-sunflower.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/late-summer-sunflower.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Late Summer Sunflower: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Break Room Mug",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/break-room-mug.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/break-room-mug.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Break Room Mug: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Rural Picnic Pavilion",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/rural-picnic-pavilion.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/rural-picnic-pavilion.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Rural Picnic Pavilion: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Leather Patch Work",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/leather-patch-work.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/leather-patch-work.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Leather Patch Work: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Harvest Crate Rest",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/harvest-crate-rest.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/harvest-crate-rest.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Harvest Crate Rest: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Paintbrush Cleaning",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/paintbrush-cleaning.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/paintbrush-cleaning.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Paintbrush Cleaning: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Community Boathouse",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/community-boathouse.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/community-boathouse.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Community Boathouse: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Late Summer Hay Meadow",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/late-summer-hay-meadow.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/late-summer-hay-meadow.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Late Summer Hay Meadow: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Shared Roof Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/shared-roof-garden.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/shared-roof-garden.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Shared Roof Garden: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Lunch Break Stools",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/lunch-break-stools.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/lunch-break-stools.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Lunch Break Stools: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Quiet Harbor Rigging",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/quiet-harbor-rigging.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/quiet-harbor-rigging.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Quiet Harbor Rigging: a Labor Day design for your own event details and signup sections.",
      "keywords": "Labor Day workers September long weekend"
    },
    {
      "name": "Labor Day · Mending Basket Rest",
      "tier": "free",
      "path": "/templates/signup/holidays/labor-day/mending-basket-rest.webp",
      "artworkPath": "/templates/signup/holidays/labor-day/mending-basket-rest.webp",
      "occasion": "labor-day",
      "audience": "Community & Family",
      "description": "Mending Basket Rest: a Labor Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Columbus Day · Boatbuilding Shed",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/boatbuilding-shed.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/boatbuilding-shed.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Boatbuilding Shed: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Blank Navigation Chart",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/blank-navigation-chart.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/blank-navigation-chart.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Blank Navigation Chart: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Harbor Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/harbor-steps.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/harbor-steps.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Harbor Steps: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Sail Stitch",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/sail-stitch.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/sail-stitch.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Sail Stitch: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Maritime Archive Door",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/maritime-archive-door.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/maritime-archive-door.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Maritime Archive Door: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Working Coastal Harbor",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/working-coastal-harbor.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/working-coastal-harbor.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Working Coastal Harbor: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Small Dry Dock",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/small-dry-dock.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/small-dry-dock.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Small Dry Dock: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Wooden Pulley",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/wooden-pulley.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/wooden-pulley.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Wooden Pulley: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Sail Loft Rafters",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/sail-loft-rafters.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/sail-loft-rafters.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Sail Loft Rafters: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Tide Pool Study",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/tide-pool-study.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/tide-pool-study.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Tide Pool Study: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Coastal Education Room",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/coastal-education-room.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/coastal-education-room.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Coastal Education Room: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Rope Knot Study",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/rope-knot-study.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/rope-knot-study.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Rope Knot Study: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Pebble Harbor Beach",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/pebble-harbor-beach.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/pebble-harbor-beach.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Pebble Harbor Beach: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Brass Compass Wear",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/brass-compass-wear.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/brass-compass-wear.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Brass Compass Wear: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Boatyard Gate",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/boatyard-gate.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/boatyard-gate.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Boatyard Gate: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Low Tide Moorings",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/low-tide-moorings.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/low-tide-moorings.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Low Tide Moorings: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Museum Model Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/museum-model-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/museum-model-courtyard.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Museum Model Courtyard: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Sail Repair Bench",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/sail-repair-bench.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/sail-repair-bench.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Sail Repair Bench: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Harbor Bell Shelter",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/harbor-bell-shelter.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/harbor-bell-shelter.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Harbor Bell Shelter: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Driftwood History Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/driftwood-history-walk.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/driftwood-history-walk.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Driftwood History Walk: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Community History Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/community-history-circle.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/community-history-circle.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Community History Circle: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Ship Model Parts",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/ship-model-parts.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/ship-model-parts.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Ship Model Parts: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Old Dock Planks",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/old-dock-planks.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/old-dock-planks.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Old Dock Planks: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Parchment Fiber",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/parchment-fiber.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/parchment-fiber.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Parchment Fiber: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Coastal Workshop Door",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/coastal-workshop-door.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/coastal-workshop-door.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Coastal Workshop Door: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Harbor Breakwater",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/harbor-breakwater.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/harbor-breakwater.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Harbor Breakwater: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Fishing Net Loft",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/fishing-net-loft.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/fishing-net-loft.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Fishing Net Loft: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Rowing Oar Rack",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/rowing-oar-rack.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/rowing-oar-rack.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Rowing Oar Rack: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Lighthouse Stairwell",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/lighthouse-stairwell.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/lighthouse-stairwell.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Lighthouse Stairwell: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Archive Handling Gloves",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/archive-handling-gloves.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/archive-handling-gloves.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Archive Handling Gloves: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Small Harbor Library",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/small-harbor-library.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/small-harbor-library.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Small Harbor Library: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Boat Timber Rings",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/boat-timber-rings.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/boat-timber-rings.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Boat Timber Rings: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Coastal Path Fence",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/coastal-path-fence.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/coastal-path-fence.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Coastal Path Fence: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Rope Fibers",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/rope-fibers.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/rope-fibers.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Rope Fibers: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Museum Boathouse Door",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/museum-boathouse-door.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/museum-boathouse-door.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Museum Boathouse Door: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Estuary Autumn",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/estuary-autumn.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/estuary-autumn.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Estuary Autumn: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Harborside Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/harborside-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/harborside-courtyard.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Harborside Courtyard: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Compass Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/compass-workshop.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/compass-workshop.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Compass Workshop: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Sail Mast Rigging",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/sail-mast-rigging.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/sail-mast-rigging.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Sail Mast Rigging: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Blank Sea Journal",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/blank-sea-journal.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/blank-sea-journal.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Blank Sea Journal: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · School Maritime Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/school-maritime-workshop.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/school-maritime-workshop.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "School Maritime Workshop: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Shell Sorting Tray",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/shell-sorting-tray.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/shell-sorting-tray.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Shell Sorting Tray: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Boat Ramp Puddles",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/boat-ramp-puddles.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/boat-ramp-puddles.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Boat Ramp Puddles: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Wooden Hull Pegs",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/wooden-hull-pegs.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/wooden-hull-pegs.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Wooden Hull Pegs: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Coastal Archive Window",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/coastal-archive-window.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/coastal-archive-window.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Coastal Archive Window: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Harbor Rain",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/harbor-rain.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/harbor-rain.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Harbor Rain: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Boat Yard Shadows",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/boat-yard-shadows.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/boat-yard-shadows.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Boat Yard Shadows: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Canvas Sea Bag",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/canvas-sea-bag.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/canvas-sea-bag.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Canvas Sea Bag: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · Museum Lantern",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/museum-lantern.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/museum-lantern.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "Museum Lantern: a Columbus Day design for your own event details and signup sections.",
      "keywords": "Columbus Day October maritime history"
    },
    {
      "name": "Columbus Day · History Notebook",
      "tier": "free",
      "path": "/templates/signup/holidays/columbus-day/history-notebook.webp",
      "artworkPath": "/templates/signup/holidays/columbus-day/history-notebook.webp",
      "occasion": "columbus-day",
      "audience": "Community & Family",
      "description": "History Notebook: a Columbus Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Veterans Day · Veterans Garden Entrance",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/veterans-garden-entrance.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/veterans-garden-entrance.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Veterans Garden Entrance: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Thank You Materials",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/thank-you-materials.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/thank-you-materials.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Thank You Materials: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Autumn Flag Path",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/autumn-flag-path.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/autumn-flag-path.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Autumn Flag Path: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Service Quilt Patch",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/service-quilt-patch.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/service-quilt-patch.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Service Quilt Patch: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Veterans Lounge Door",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/veterans-lounge-door.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/veterans-lounge-door.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Veterans Lounge Door: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · November Civic Flag",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/november-civic-flag.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/november-civic-flag.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "November Civic Flag: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Community Breakfast Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/community-breakfast-hall.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/community-breakfast-hall.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Community Breakfast Hall: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Oral History Microphone",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/oral-history-microphone.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/oral-history-microphone.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Oral History Microphone: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Porch Flag Bracket",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/porch-flag-bracket.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/porch-flag-bracket.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Porch Flag Bracket: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Care Parcel Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/care-parcel-basket.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/care-parcel-basket.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Care Parcel Basket: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Accessible Garden Beds",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/accessible-garden-beds.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/accessible-garden-beds.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Accessible Garden Beds: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Coffee Biscuit Sharing",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/coffee-biscuit-sharing.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/coffee-biscuit-sharing.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Coffee Biscuit Sharing: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Honor Bench Leaves",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/honor-bench-leaves.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/honor-bench-leaves.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Honor Bench Leaves: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Handmade Card Edges",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/handmade-card-edges.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/handmade-card-edges.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Handmade Card Edges: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Workshop Access",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/workshop-access.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/workshop-access.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Workshop Access: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Autumn Honor Grove",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/autumn-honor-grove.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/autumn-honor-grove.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Autumn Honor Grove: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Hall Conversation Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/hall-conversation-circle.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/hall-conversation-circle.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Hall Conversation Circle: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Plain Service Cloth",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/plain-service-cloth.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/plain-service-cloth.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Plain Service Cloth: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · November Maple",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/november-maple.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/november-maple.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "November Maple: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Donated Books",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/donated-books.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/donated-books.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Donated Books: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Veterans Meal Kitchen",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/veterans-meal-kitchen.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/veterans-meal-kitchen.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Veterans Meal Kitchen: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Plain Ribbon Pins",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/plain-ribbon-pins.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/plain-ribbon-pins.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Plain Ribbon Pins: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Wooden Cane Handle",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/wooden-cane-handle.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/wooden-cane-handle.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Wooden Cane Handle: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Oral History Library",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/oral-history-library.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/oral-history-library.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Oral History Library: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Care Package Sorting",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/care-package-sorting.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/care-package-sorting.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Care Package Sorting: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Coffee Trolley",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/coffee-trolley.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/coffee-trolley.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Coffee Trolley: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Garden Chrysanthemum",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/garden-chrysanthemum.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/garden-chrysanthemum.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Garden Chrysanthemum: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Community Repair Circle",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/community-repair-circle.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/community-repair-circle.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Community Repair Circle: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Tribute Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/tribute-steps.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/tribute-steps.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Tribute Steps: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Flag Case Joinery",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/flag-case-joinery.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/flag-case-joinery.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Flag Case Joinery: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Library Honor Window",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/library-honor-window.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/library-honor-window.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Library Honor Window: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Bare Birch Honor Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/bare-birch-honor-garden.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/bare-birch-honor-garden.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Bare Birch Honor Garden: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Coat Repair",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/coat-repair.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/coat-repair.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Coat Repair: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Shared Reading Nook",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/shared-reading-nook.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/shared-reading-nook.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Shared Reading Nook: a Veterans Day design for your own event details and signup sections.",
      "keywords": "Veterans Day November veterans appreciation service"
    },
    {
      "name": "Veterans Day · Recording Headphones",
      "tier": "free",
      "path": "/templates/signup/holidays/veterans-day/recording-headphones.webp",
      "artworkPath": "/templates/signup/holidays/veterans-day/recording-headphones.webp",
      "occasion": "veterans-day",
      "audience": "Community & Family",
      "description": "Recording Headphones: a Veterans Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Thanksgiving · Orchard Harvest Wagon",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/orchard-harvest-wagon.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/orchard-harvest-wagon.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Orchard Harvest Wagon: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Cranberry Preparation",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/cranberry-preparation.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/cranberry-preparation.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Cranberry Preparation: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Family Kitchen Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/family-kitchen-welcome.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/family-kitchen-welcome.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Family Kitchen Welcome: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Dinner Dough Rising",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/dinner-dough-rising.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/dinner-dough-rising.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Dinner Dough Rising: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Community Food Pantry",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/community-food-pantry.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/community-food-pantry.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Community Food Pantry: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Cranberry Steam",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/cranberry-steam.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/cranberry-steam.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Cranberry Steam: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Apartment Potluck Arrival",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/apartment-potluck-arrival.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/apartment-potluck-arrival.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Apartment Potluck Arrival: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Sage Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/sage-gathering.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/sage-gathering.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Sage Gathering: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Chestnut Walk",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/chestnut-walk.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/chestnut-walk.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Chestnut Walk: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · November Riverbank",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/november-riverbank.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/november-riverbank.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "November Riverbank: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Gourd Garland",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/gourd-garland.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/gourd-garland.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Gourd Garland: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Homemade Butter",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/homemade-butter.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/homemade-butter.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Homemade Butter: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Open Pantry",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/open-pantry.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/open-pantry.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Open Pantry: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Cornbread Skillet",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/cornbread-skillet.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/cornbread-skillet.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Cornbread Skillet: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Bread Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/bread-workshop.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/bread-workshop.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Bread Workshop: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Honey Baked Pear",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/honey-baked-pear.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/honey-baked-pear.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Honey Baked Pear: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Back Porch Potluck",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/back-porch-potluck.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/back-porch-potluck.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Back Porch Potluck: a Thanksgiving design for your own event details and signup sections.",
      "keywords": "Thanksgiving November gratitude turkey feast"
    },
    {
      "name": "Thanksgiving · Neighbor Bread Gift",
      "tier": "free",
      "path": "/templates/signup/holidays/thanksgiving/neighbor-bread-gift.webp",
      "artworkPath": "/templates/signup/holidays/thanksgiving/neighbor-bread-gift.webp",
      "occasion": "thanksgiving",
      "audience": "Community & Family",
      "description": "Neighbor Bread Gift: a Thanksgiving design for your own event details and signup sections.",
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
    },
    {
      "name": "Christmas · Neighborhood Fir Lot",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/neighborhood-fir-lot.webp",
      "artworkPath": "/templates/signup/holidays/christmas/neighborhood-fir-lot.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Neighborhood Fir Lot: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Wooden Ornament Grain",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/wooden-ornament-grain.webp",
      "artworkPath": "/templates/signup/holidays/christmas/wooden-ornament-grain.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Wooden Ornament Grain: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Courtyard Christmas Tree",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/courtyard-christmas-tree.webp",
      "artworkPath": "/templates/signup/holidays/christmas/courtyard-christmas-tree.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Courtyard Christmas Tree: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Cookie Delivery Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/cookie-delivery-basket.webp",
      "artworkPath": "/templates/signup/holidays/christmas/cookie-delivery-basket.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Cookie Delivery Basket: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Fir Needles On Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/fir-needles-on-steps.webp",
      "artworkPath": "/templates/signup/holidays/christmas/fir-needles-on-steps.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Fir Needles On Steps: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Winter Rooftops",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/winter-rooftops.webp",
      "artworkPath": "/templates/signup/holidays/christmas/winter-rooftops.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Winter Rooftops: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Chapel Timber",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/chapel-timber.webp",
      "artworkPath": "/templates/signup/holidays/christmas/chapel-timber.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Chapel Timber: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Homemade Mince Pies",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/homemade-mince-pies.webp",
      "artworkPath": "/templates/signup/holidays/christmas/homemade-mince-pies.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Homemade Mince Pies: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Winter Pottery Studio",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/winter-pottery-studio.webp",
      "artworkPath": "/templates/signup/holidays/christmas/winter-pottery-studio.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Winter Pottery Studio: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Fruit Bread Cooling",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/fruit-bread-cooling.webp",
      "artworkPath": "/templates/signup/holidays/christmas/fruit-bread-cooling.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Fruit Bread Cooling: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Simple Nativity Shelf",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/simple-nativity-shelf.webp",
      "artworkPath": "/templates/signup/holidays/christmas/simple-nativity-shelf.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Simple Nativity Shelf: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Gingerbread Texture",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/gingerbread-texture.webp",
      "artworkPath": "/templates/signup/holidays/christmas/gingerbread-texture.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Gingerbread Texture: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Porch Gift Collection",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/porch-gift-collection.webp",
      "artworkPath": "/templates/signup/holidays/christmas/porch-gift-collection.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Porch Gift Collection: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Orange Pomander Bowl",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/orange-pomander-bowl.webp",
      "artworkPath": "/templates/signup/holidays/christmas/orange-pomander-bowl.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Orange Pomander Bowl: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Practical Tree Stand",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/practical-tree-stand.webp",
      "artworkPath": "/templates/signup/holidays/christmas/practical-tree-stand.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Practical Tree Stand: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Winter Station Wreath",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/winter-station-wreath.webp",
      "artworkPath": "/templates/signup/holidays/christmas/winter-station-wreath.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Winter Station Wreath: a Christmas design for your own event details and signup sections.",
      "keywords": "Christmas Xmas December holiday Christmas Eve"
    },
    {
      "name": "Christmas · Snowy Garden Lantern",
      "tier": "free",
      "path": "/templates/signup/holidays/christmas/snowy-garden-lantern.webp",
      "artworkPath": "/templates/signup/holidays/christmas/snowy-garden-lantern.webp",
      "occasion": "christmas",
      "audience": "Community & Family",
      "description": "Snowy Garden Lantern: a Christmas design for your own event details and signup sections.",
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
    },
    {
      "name": "New Year’s Eve · Citrus Ice Cubes",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/citrus-ice-cubes.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/citrus-ice-cubes.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Citrus Ice Cubes: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Community Game Room",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/community-game-room.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/community-game-room.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Community Game Room: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Sparkling Cider Bottle",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/sparkling-cider-bottle.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/sparkling-cider-bottle.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Sparkling Cider Bottle: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Music Rehearsal Room",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/music-rehearsal-room.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/music-rehearsal-room.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Music Rehearsal Room: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Winter Window Condensation",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/winter-window-condensation.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/winter-window-condensation.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Winter Window Condensation: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Living Room Games",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/living-room-games.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/living-room-games.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Living Room Games: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Winter Coat Pegs",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/winter-coat-pegs.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/winter-coat-pegs.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Winter Coat Pegs: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Garden Path Evening",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/garden-path-evening.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/garden-path-evening.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Garden Path Evening: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Last Train Platform",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/last-train-platform.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/last-train-platform.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Last Train Platform: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Bare Branch Night",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/bare-branch-night.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/bare-branch-night.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Bare Branch Night: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Soft Pretzel Baking",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/soft-pretzel-baking.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/soft-pretzel-baking.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Soft Pretzel Baking: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Kitchen Toast Preparation",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/kitchen-toast-preparation.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/kitchen-toast-preparation.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Kitchen Toast Preparation: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Blank Wishes",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/blank-wishes.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/blank-wishes.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Blank Wishes: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Porch Lantern Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/porch-lantern-gathering.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/porch-lantern-gathering.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Porch Lantern Gathering: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Sparkling Water Bubbles",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/sparkling-water-bubbles.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/sparkling-water-bubbles.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Sparkling Water Bubbles: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · Apartment Neighbor Gifts",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/apartment-neighbor-gifts.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/apartment-neighbor-gifts.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "Apartment Neighbor Gifts: a New Year’s Eve design for your own event details and signup sections.",
      "keywords": "NYE New Years Eve countdown December"
    },
    {
      "name": "New Year’s Eve · First Morning Shoes",
      "tier": "free",
      "path": "/templates/signup/holidays/new-years-eve/first-morning-shoes.webp",
      "artworkPath": "/templates/signup/holidays/new-years-eve/first-morning-shoes.webp",
      "occasion": "new-years-eve",
      "audience": "Community & Family",
      "description": "First Morning Shoes: a New Year’s Eve design for your own event details and signup sections.",
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
    },
    {
      "name": "Valentine’s Day · Heart Leaf Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/heart-leaf-garden.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/heart-leaf-garden.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Heart Leaf Garden: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Winter Seaside Pair",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/winter-seaside-pair.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/winter-seaside-pair.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Winter Seaside Pair: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Paper Heart Window",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/paper-heart-window.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/paper-heart-window.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Paper Heart Window: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Chocolate Strawberries",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/chocolate-strawberries.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/chocolate-strawberries.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Chocolate Strawberries: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Sweet Bakery Window",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/sweet-bakery-window.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/sweet-bakery-window.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Sweet Bakery Window: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Ribbon Gift Sewing",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/ribbon-gift-sewing.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/ribbon-gift-sewing.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Ribbon Gift Sewing: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Community Flower Room",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/community-flower-room.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/community-flower-room.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Community Flower Room: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Homemade Truffles",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/homemade-truffles.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/homemade-truffles.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Homemade Truffles: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Home Baking Racks",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/home-baking-racks.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/home-baking-racks.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Home Baking Racks: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Blank Postcards",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/blank-postcards.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/blank-postcards.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Blank Postcards: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Front Step Posy",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/front-step-posy.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/front-step-posy.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Front Step Posy: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Winter Orchard Gate",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/winter-orchard-gate.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/winter-orchard-gate.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Winter Orchard Gate: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Pink Window Curtain",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/pink-window-curtain.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/pink-window-curtain.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Pink Window Curtain: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Petal Paper Making",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/petal-paper-making.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/petal-paper-making.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Petal Paper Making: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Music Room Duet",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/music-room-duet.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/music-room-duet.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Music Room Duet: a Valentine’s Day design for your own event details and signup sections.",
      "keywords": "Valentines Galentines February friendship love"
    },
    {
      "name": "Valentine’s Day · Knotted Cotton Bracelet",
      "tier": "free",
      "path": "/templates/signup/holidays/valentines-day/knotted-cotton-bracelet.webp",
      "artworkPath": "/templates/signup/holidays/valentines-day/knotted-cotton-bracelet.webp",
      "occasion": "valentines-day",
      "audience": "Community & Family",
      "description": "Knotted Cotton Bracelet: a Valentine’s Day design for your own event details and signup sections.",
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
    },
    {
      "name": "St. Patrick’s Day · Community Music Hall",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/community-music-hall.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/community-music-hall.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Community Music Hall: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Green Wool Stitch",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/green-wool-stitch.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/green-wool-stitch.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Green Wool Stitch: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Courtyard Shamrock Pots",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/courtyard-shamrock-pots.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/courtyard-shamrock-pots.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Courtyard Shamrock Pots: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Oatcake Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/oatcake-basket.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/oatcake-basket.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Oatcake Basket: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Rain Boot Clover",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/rain-boot-clover.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/rain-boot-clover.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Rain Boot Clover: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Village Stone Bridge",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/village-stone-bridge.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/village-stone-bridge.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Village Stone Bridge: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Green Paper Fans",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/green-paper-fans.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/green-paper-fans.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Green Paper Fans: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Green Cotton Mending",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/green-cotton-mending.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/green-cotton-mending.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Green Cotton Mending: a St. Patrick’s Day design for your own event details and signup sections.",
      "keywords": "Saint Patricks Irish March shamrock"
    },
    {
      "name": "St. Patrick’s Day · Community Dance Room",
      "tier": "free",
      "path": "/templates/signup/holidays/st-patricks-day/community-dance-room.webp",
      "artworkPath": "/templates/signup/holidays/st-patricks-day/community-dance-room.webp",
      "occasion": "st-patricks-day",
      "audience": "Community & Family",
      "description": "Community Dance Room: a St. Patrick’s Day design for your own event details and signup sections.",
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
    },
    {
      "name": "Halloween · Lantern Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/lantern-workshop.webp",
      "artworkPath": "/templates/signup/holidays/halloween/lantern-workshop.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Lantern Workshop: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Library After Dark",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/library-after-dark.webp",
      "artworkPath": "/templates/signup/holidays/halloween/library-after-dark.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Library After Dark: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Costume Repair Table",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/costume-repair-table.webp",
      "artworkPath": "/templates/signup/holidays/halloween/costume-repair-table.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Costume Repair Table: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Spiderweb Biscuits",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/spiderweb-biscuits.webp",
      "artworkPath": "/templates/signup/holidays/halloween/spiderweb-biscuits.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Spiderweb Biscuits: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Porch Treat Shelf",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/porch-treat-shelf.webp",
      "artworkPath": "/templates/signup/holidays/halloween/porch-treat-shelf.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Porch Treat Shelf: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Owl Mask Making — Window Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/owl-mask-making-window-workshop.webp",
      "artworkPath": "/templates/signup/holidays/halloween/owl-mask-making-window-workshop.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Owl Mask Making — Window Workshop: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Apple Cider Donuts — Window Workshop",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/apple-cider-donuts-window-workshop.webp",
      "artworkPath": "/templates/signup/holidays/halloween/apple-cider-donuts-window-workshop.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Apple Cider Donuts — Window Workshop: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Rainy Trick-or-Treat Lane",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/rainy-trick-or-treat-lane.webp",
      "artworkPath": "/templates/signup/holidays/halloween/rainy-trick-or-treat-lane.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Rainy Trick-or-Treat Lane: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Raven Weather Vane",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/raven-weather-vane.webp",
      "artworkPath": "/templates/signup/holidays/halloween/raven-weather-vane.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Raven Weather Vane: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Cornfield at Blue Hour",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/cornfield-at-blue-hour.webp",
      "artworkPath": "/templates/signup/holidays/halloween/cornfield-at-blue-hour.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Cornfield at Blue Hour: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Vintage Costume Rail",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/vintage-costume-rail.webp",
      "artworkPath": "/templates/signup/holidays/halloween/vintage-costume-rail.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Vintage Costume Rail: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Candy Color Wheel",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/candy-color-wheel.webp",
      "artworkPath": "/templates/signup/holidays/halloween/candy-color-wheel.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Candy Color Wheel: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Library Spiral Stair",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/library-spiral-stair.webp",
      "artworkPath": "/templates/signup/holidays/halloween/library-spiral-stair.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Library Spiral Stair: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Little Woodland Door",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/little-woodland-door.webp",
      "artworkPath": "/templates/signup/holidays/halloween/little-woodland-door.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Little Woodland Door: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Window Silhouette",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/window-silhouette.webp",
      "artworkPath": "/templates/signup/holidays/halloween/window-silhouette.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Window Silhouette: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Cat Among Leaves",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/cat-among-leaves.webp",
      "artworkPath": "/templates/signup/holidays/halloween/cat-among-leaves.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Cat Among Leaves: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Skate Park Lanterns",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/skate-park-lanterns.webp",
      "artworkPath": "/templates/signup/holidays/halloween/skate-park-lanterns.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Skate Park Lanterns: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Railway Arch Lights",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/railway-arch-lights.webp",
      "artworkPath": "/templates/signup/holidays/halloween/railway-arch-lights.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Railway Arch Lights: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Bobbing Apple Basin",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/bobbing-apple-basin.webp",
      "artworkPath": "/templates/signup/holidays/halloween/bobbing-apple-basin.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Bobbing Apple Basin: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Toadstool Trail",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/toadstool-trail.webp",
      "artworkPath": "/templates/signup/holidays/halloween/toadstool-trail.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Toadstool Trail: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Autumn Observatory",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/autumn-observatory.webp",
      "artworkPath": "/templates/signup/holidays/halloween/autumn-observatory.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Autumn Observatory: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Felt Monster Mobile",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/felt-monster-mobile.webp",
      "artworkPath": "/templates/signup/holidays/halloween/felt-monster-mobile.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Felt Monster Mobile: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Creek Footbridge",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/creek-footbridge.webp",
      "artworkPath": "/templates/signup/holidays/halloween/creek-footbridge.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Creek Footbridge: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Neighborhood Cinema",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/neighborhood-cinema.webp",
      "artworkPath": "/templates/signup/holidays/halloween/neighborhood-cinema.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Neighborhood Cinema: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Greenhouse Nightfall",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/greenhouse-nightfall.webp",
      "artworkPath": "/templates/signup/holidays/halloween/greenhouse-nightfall.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Greenhouse Nightfall: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Bicycle Treat Delivery",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/bicycle-treat-delivery.webp",
      "artworkPath": "/templates/signup/holidays/halloween/bicycle-treat-delivery.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Bicycle Treat Delivery: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Patchwork Ghost Quilt",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/patchwork-ghost-quilt.webp",
      "artworkPath": "/templates/signup/holidays/halloween/patchwork-ghost-quilt.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Patchwork Ghost Quilt: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Crooked Garden Gate",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/crooked-garden-gate.webp",
      "artworkPath": "/templates/signup/holidays/halloween/crooked-garden-gate.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Crooked Garden Gate: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Cider Mill Wheel",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/cider-mill-wheel.webp",
      "artworkPath": "/templates/signup/holidays/halloween/cider-mill-wheel.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Cider Mill Wheel: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Coastal Halloween",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/coastal-halloween.webp",
      "artworkPath": "/templates/signup/holidays/halloween/coastal-halloween.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Coastal Halloween: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Ceramic Ghost Study",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/ceramic-ghost-study.webp",
      "artworkPath": "/templates/signup/holidays/halloween/ceramic-ghost-study.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Ceramic Ghost Study: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Orange Vinyl Evening",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/orange-vinyl-evening.webp",
      "artworkPath": "/templates/signup/holidays/halloween/orange-vinyl-evening.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Orange Vinyl Evening: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Shadow Puppet Screen",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/shadow-puppet-screen.webp",
      "artworkPath": "/templates/signup/holidays/halloween/shadow-puppet-screen.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Shadow Puppet Screen: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Halloween Bowling Night",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/halloween-bowling-night.webp",
      "artworkPath": "/templates/signup/holidays/halloween/halloween-bowling-night.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Halloween Bowling Night: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Chocolate Bark Fractures",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/chocolate-bark-fractures.webp",
      "artworkPath": "/templates/signup/holidays/halloween/chocolate-bark-fractures.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Chocolate Bark Fractures: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Black Ribbon Wreath",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/black-ribbon-wreath.webp",
      "artworkPath": "/templates/signup/holidays/halloween/black-ribbon-wreath.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Black Ribbon Wreath: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Rooftop Broom Rest",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/rooftop-broom-rest.webp",
      "artworkPath": "/templates/signup/holidays/halloween/rooftop-broom-rest.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Rooftop Broom Rest: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Miniature Haunted Village",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/miniature-haunted-village.webp",
      "artworkPath": "/templates/signup/holidays/halloween/miniature-haunted-village.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Miniature Haunted Village: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Hay Bale Passage",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/hay-bale-passage.webp",
      "artworkPath": "/templates/signup/holidays/halloween/hay-bale-passage.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Hay Bale Passage: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Foggy Orchard Lane",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/foggy-orchard-lane.webp",
      "artworkPath": "/templates/signup/holidays/halloween/foggy-orchard-lane.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Foggy Orchard Lane: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Orange Umbrella Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/orange-umbrella-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/halloween/orange-umbrella-courtyard.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Orange Umbrella Courtyard: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Pumpkin Peel Ribbons",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/pumpkin-peel-ribbons.webp",
      "artworkPath": "/templates/signup/holidays/halloween/pumpkin-peel-ribbons.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Pumpkin Peel Ribbons: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Midnight Bookbinding",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/midnight-bookbinding.webp",
      "artworkPath": "/templates/signup/holidays/halloween/midnight-bookbinding.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Midnight Bookbinding: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Corn Husk Dragon",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/corn-husk-dragon.webp",
      "artworkPath": "/templates/signup/holidays/halloween/corn-husk-dragon.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Corn Husk Dragon: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Empty Fairground Wheel",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/empty-fairground-wheel.webp",
      "artworkPath": "/templates/signup/holidays/halloween/empty-fairground-wheel.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Empty Fairground Wheel: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Porch Hammock October",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/porch-hammock-october.webp",
      "artworkPath": "/templates/signup/holidays/halloween/porch-hammock-october.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Porch Hammock October: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Mossy Stone Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/mossy-stone-steps.webp",
      "artworkPath": "/templates/signup/holidays/halloween/mossy-stone-steps.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Mossy Stone Steps: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Candy Wrapper in the Wind",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/candy-wrapper-in-the-wind.webp",
      "artworkPath": "/templates/signup/holidays/halloween/candy-wrapper-in-the-wind.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Candy Wrapper in the Wind: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Harvest Corn Detail",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/harvest-corn-detail.webp",
      "artworkPath": "/templates/signup/holidays/halloween/harvest-corn-detail.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Harvest Corn Detail: a Halloween design for your own event details and signup sections.",
      "keywords": "Halloween October spooky costumes trick or treat"
    },
    {
      "name": "Halloween · Halloween Chessboard",
      "tier": "free",
      "path": "/templates/signup/holidays/halloween/halloween-chessboard.webp",
      "artworkPath": "/templates/signup/holidays/halloween/halloween-chessboard.webp",
      "occasion": "halloween",
      "audience": "Community & Family",
      "description": "Halloween Chessboard: a Halloween design for your own event details and signup sections.",
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
    },
    {
      "name": "Corn Mazes · The Maze from Above",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-maze-from-above.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-maze-from-above.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Maze from Above: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · A Fork in the Rows",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/a-fork-in-the-rows.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/a-fork-in-the-rows.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "A Fork in the Rows: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Morning Spiderweb",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/morning-spiderweb.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/morning-spiderweb.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Morning Spiderweb: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The Muddy Boots Rack",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-muddy-boots-rack.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-muddy-boots-rack.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Muddy Boots Rack: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The Corn Tassel",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-corn-tassel.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-corn-tassel.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Corn Tassel: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · Aerial Maze Crossroads",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/aerial-maze-crossroads.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/aerial-maze-crossroads.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "Aerial Maze Crossroads: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The Covered Picnic Barn",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-covered-picnic-barn.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-covered-picnic-barn.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Covered Picnic Barn: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The Rustic Water Pump",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-rustic-water-pump.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-rustic-water-pump.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Rustic Water Pump: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · An Orchard Boundary",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/an-orchard-boundary.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/an-orchard-boundary.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "An Orchard Boundary: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The Farmyard Handcart",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-farmyard-handcart.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-farmyard-handcart.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Farmyard Handcart: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The Gourd Display",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-gourd-display.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-gourd-display.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Gourd Display: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · A Corn Leaf in Rain",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/a-corn-leaf-in-rain.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/a-corn-leaf-in-rain.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "A Corn Leaf in Rain: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The Petting-Pen Neighbor",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-petting-pen-neighbor.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-petting-pen-neighbor.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The Petting-Pen Neighbor: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · A Shelter from Drizzle",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/a-shelter-from-drizzle.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/a-shelter-from-drizzle.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "A Shelter from Drizzle: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · A Cornfield Culvert",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/a-cornfield-culvert.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/a-cornfield-culvert.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "A Cornfield Culvert: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · An Autumn Creek Crossing",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/an-autumn-creek-crossing.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/an-autumn-creek-crossing.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "An Autumn Creek Crossing: a Corn Mazes design for your own event details and signup sections.",
      "keywords": "corn maze autumn fall farm maze hayride"
    },
    {
      "name": "Corn Mazes · The End-of-Maze Clearing",
      "tier": "free",
      "path": "/templates/signup/holidays/corn-maze/the-end-of-maze-clearing.webp",
      "artworkPath": "/templates/signup/holidays/corn-maze/the-end-of-maze-clearing.webp",
      "occasion": "corn-maze",
      "audience": "Community & Family",
      "description": "The End-of-Maze Clearing: a Corn Mazes design for your own event details and signup sections.",
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
    },
    {
      "name": "Trunk-or-Treat · The Submarine Hatchback",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-submarine-hatchback.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-submarine-hatchback.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Submarine Hatchback: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Tiny Spaceport",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-tiny-spaceport.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-tiny-spaceport.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Tiny Spaceport: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Candy Checkpoint",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-candy-checkpoint.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-candy-checkpoint.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Candy Checkpoint: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Undersea Coral Stop",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/undersea-coral-stop.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/undersea-coral-stop.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Undersea Coral Stop: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Ice Cream Wagon",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-ice-cream-wagon.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-ice-cream-wagon.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Ice Cream Wagon: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · Camping Under the Hatch",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/camping-under-the-hatch.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/camping-under-the-hatch.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "Camping Under the Hatch: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Garden Gnome Truck",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-garden-gnome-truck.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-garden-gnome-truck.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Garden Gnome Truck: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · A Hot-Air Balloon Car",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/a-hot-air-balloon-car.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/a-hot-air-balloon-car.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "A Hot-Air Balloon Car: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · A Beehive on Wheels",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/a-beehive-on-wheels.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/a-beehive-on-wheels.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "A Beehive on Wheels: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Lighthouse Hatch",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-lighthouse-hatch.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-lighthouse-hatch.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Lighthouse Hatch: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Dragon's Cave",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-dragon-s-cave.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-dragon-s-cave.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Dragon's Cave: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · A Weathered Western Wagon",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/a-weathered-western-wagon.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/a-weathered-western-wagon.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "A Weathered Western Wagon: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Robot Repair Bay",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-robot-repair-bay.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-robot-repair-bay.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Robot Repair Bay: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Secret Agent Car",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-secret-agent-car.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-secret-agent-car.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Secret Agent Car: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Miniature Carnival",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-miniature-carnival.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-miniature-carnival.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Miniature Carnival: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · A Car Wash of Color",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/a-car-wash-of-color.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/a-car-wash-of-color.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "A Car Wash of Color: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
    },
    {
      "name": "Trunk-or-Treat · The Space Rover Station",
      "tier": "free",
      "path": "/templates/signup/holidays/trunk-or-treat/the-space-rover-station.webp",
      "artworkPath": "/templates/signup/holidays/trunk-or-treat/the-space-rover-station.webp",
      "occasion": "trunk-or-treat",
      "audience": "Community & Family",
      "description": "The Space Rover Station: a Trunk-or-Treat design for your own event details and signup sections.",
      "keywords": "trunk or treat school church parking lot Halloween"
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
    },
    {
      "name": "Hanukkah · The Window Hanukkiah",
      "tier": "free",
      "path": "/templates/signup/holidays/hanukkah/the-window-hanukkiah.webp",
      "artworkPath": "/templates/signup/holidays/hanukkah/the-window-hanukkiah.webp",
      "occasion": "hanukkah",
      "audience": "Community & Family",
      "description": "The Window Hanukkiah: a Hanukkah design for your own event details and signup sections.",
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
    },
    {
      "name": "Eid al-Fitr · The Visiting Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/the-visiting-basket.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/the-visiting-basket.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "The Visiting Basket: a Eid al-Fitr design for your own event details and signup sections.",
      "keywords": "Eid al Fitr Eid ul Fitr celebration end Ramadan"
    },
    {
      "name": "Eid al-Fitr · Eid Under the Stars",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-fitr/eid-under-the-stars.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-fitr/eid-under-the-stars.webp",
      "occasion": "eid-al-fitr",
      "audience": "Community & Family",
      "description": "Eid Under the Stars: a Eid al-Fitr design for your own event details and signup sections.",
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
    },
    {
      "name": "Eid al-Adha · Eid Prayer Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/eid-prayer-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/eid-prayer-courtyard.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Eid Prayer Courtyard: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Community Serving Line",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/community-serving-line.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/community-serving-line.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Community Serving Line: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · The Volunteer Van",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/the-volunteer-van.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/the-volunteer-van.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "The Volunteer Van: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · A Shared Rice Platter",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/a-shared-rice-platter.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/a-shared-rice-platter.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "A Shared Rice Platter: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Children's Gift Parcels",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/children-s-gift-parcels.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/children-s-gift-parcels.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Children's Gift Parcels: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · The Goat on the Hill",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/the-goat-on-the-hill.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/the-goat-on-the-hill.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "The Goat on the Hill: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · The Courtyard Rug",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/the-courtyard-rug.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/the-courtyard-rug.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "The Courtyard Rug: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Clean Hands Station",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/clean-hands-station.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/clean-hands-station.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Clean Hands Station: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Quiet Mosque Arcade",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/quiet-mosque-arcade.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/quiet-mosque-arcade.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Quiet Mosque Arcade: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Eid Gift Bracelet",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/eid-gift-bracelet.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/eid-gift-bracelet.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Eid Gift Bracelet: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · Shelves of Welcome",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/shelves-of-welcome.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/shelves-of-welcome.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "Shelves of Welcome: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · A Peaceful Flock",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/a-peaceful-flock.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/a-peaceful-flock.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "A Peaceful Flock: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · A Cooling Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/a-cooling-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/a-cooling-courtyard.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "A Cooling Courtyard: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · The Garden Games",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/the-garden-games.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/the-garden-games.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "The Garden Games: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · The Country Footbridge",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/the-country-footbridge.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/the-country-footbridge.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "The Country Footbridge: a Eid al-Adha design for your own event details and signup sections.",
      "keywords": "Eid al Adha Eid ul Adha community sharing"
    },
    {
      "name": "Eid al-Adha · A Ribbon on the Bicycle",
      "tier": "free",
      "path": "/templates/signup/holidays/eid-al-adha/a-ribbon-on-the-bicycle.webp",
      "artworkPath": "/templates/signup/holidays/eid-al-adha/a-ribbon-on-the-bicycle.webp",
      "occasion": "eid-al-adha",
      "audience": "Community & Family",
      "description": "A Ribbon on the Bicycle: a Eid al-Adha design for your own event details and signup sections.",
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
    },
    {
      "name": "Diwali · Lamps Along the Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/lamps-along-the-steps.webp",
      "artworkPath": "/templates/signup/holidays/diwali/lamps-along-the-steps.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Lamps Along the Steps: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · The Marigold Market",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/the-marigold-market.webp",
      "artworkPath": "/templates/signup/holidays/diwali/the-marigold-market.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "The Marigold Market: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · A Brass Bell",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/a-brass-bell.webp",
      "artworkPath": "/templates/signup/holidays/diwali/a-brass-bell.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "A Brass Bell: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Riverbank Reflection",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/riverbank-reflection.webp",
      "artworkPath": "/templates/signup/holidays/diwali/riverbank-reflection.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Riverbank Reflection: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Courtyard Sparklers",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/courtyard-sparklers.webp",
      "artworkPath": "/templates/signup/holidays/diwali/courtyard-sparklers.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Courtyard Sparklers: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Coconut Sweet Squares",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/coconut-sweet-squares.webp",
      "artworkPath": "/templates/signup/holidays/diwali/coconut-sweet-squares.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Coconut Sweet Squares: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Garden Diwali Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/garden-diwali-gathering.webp",
      "artworkPath": "/templates/signup/holidays/diwali/garden-diwali-gathering.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Garden Diwali Gathering: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Diwali Tram Stop",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/diwali-tram-stop.webp",
      "artworkPath": "/templates/signup/holidays/diwali/diwali-tram-stop.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Diwali Tram Stop: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Distant Fireworks",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/distant-fireworks.webp",
      "artworkPath": "/templates/signup/holidays/diwali/distant-fireworks.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Distant Fireworks: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · The Festival Ferry",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/the-festival-ferry.webp",
      "artworkPath": "/templates/signup/holidays/diwali/the-festival-ferry.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "The Festival Ferry: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Jasmine Strings",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/jasmine-strings.webp",
      "artworkPath": "/templates/signup/holidays/diwali/jasmine-strings.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Jasmine Strings: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Pistachio Barfi Layers",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/pistachio-barfi-layers.webp",
      "artworkPath": "/templates/signup/holidays/diwali/pistachio-barfi-layers.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Pistachio Barfi Layers: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Diwali at the Lake",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/diwali-at-the-lake.webp",
      "artworkPath": "/templates/signup/holidays/diwali/diwali-at-the-lake.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Diwali at the Lake: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · The Flower Cart",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/the-flower-cart.webp",
      "artworkPath": "/templates/signup/holidays/diwali/the-flower-cart.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "The Flower Cart: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Lanterns in the Rain",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/lanterns-in-the-rain.webp",
      "artworkPath": "/templates/signup/holidays/diwali/lanterns-in-the-rain.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Lanterns in the Rain: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Color Above the Roofs",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/color-above-the-roofs.webp",
      "artworkPath": "/templates/signup/holidays/diwali/color-above-the-roofs.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Color Above the Roofs: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · A Single Flame",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/a-single-flame.webp",
      "artworkPath": "/templates/signup/holidays/diwali/a-single-flame.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "A Single Flame: a Diwali design for your own event details and signup sections.",
      "keywords": "Diwali Deepavali Deepawali festival lights"
    },
    {
      "name": "Diwali · Morning After the Lights",
      "tier": "free",
      "path": "/templates/signup/holidays/diwali/morning-after-the-lights.webp",
      "artworkPath": "/templates/signup/holidays/diwali/morning-after-the-lights.webp",
      "occasion": "diwali",
      "audience": "Community & Family",
      "description": "Morning After the Lights: a Diwali design for your own event details and signup sections.",
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
    },
    {
      "name": "Holi · Palash in Bloom",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/palash-in-bloom.webp",
      "artworkPath": "/templates/signup/holidays/holi/palash-in-bloom.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Palash in Bloom: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Festival Drum Corner",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/festival-drum-corner.webp",
      "artworkPath": "/templates/signup/holidays/holi/festival-drum-corner.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Festival Drum Corner: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Spring Picnic Field",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/spring-picnic-field.webp",
      "artworkPath": "/templates/signup/holidays/holi/spring-picnic-field.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Spring Picnic Field: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · The Color Merchant",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/the-color-merchant.webp",
      "artworkPath": "/templates/signup/holidays/holi/the-color-merchant.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "The Color Merchant: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Community Welcome Gate",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/community-welcome-gate.webp",
      "artworkPath": "/templates/signup/holidays/holi/community-welcome-gate.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Community Welcome Gate: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Clothesline Rainbow",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/clothesline-rainbow.webp",
      "artworkPath": "/templates/signup/holidays/holi/clothesline-rainbow.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Clothesline Rainbow: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Colorful Footprints",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/colorful-footprints.webp",
      "artworkPath": "/templates/signup/holidays/holi/colorful-footprints.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Colorful Footprints: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Courtyard Water Tap",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/courtyard-water-tap.webp",
      "artworkPath": "/templates/signup/holidays/holi/courtyard-water-tap.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Courtyard Water Tap: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Clay Pigment Pots",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/clay-pigment-pots.webp",
      "artworkPath": "/templates/signup/holidays/holi/clay-pigment-pots.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Clay Pigment Pots: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · A Drum's Surface",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/a-drum-s-surface.webp",
      "artworkPath": "/templates/signup/holidays/holi/a-drum-s-surface.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "A Drum's Surface: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Green Mango Cooler",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/green-mango-cooler.webp",
      "artworkPath": "/templates/signup/holidays/holi/green-mango-cooler.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Green Mango Cooler: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · The Wooden Spinning Tops",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/the-wooden-spinning-tops.webp",
      "artworkPath": "/templates/signup/holidays/holi/the-wooden-spinning-tops.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "The Wooden Spinning Tops: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · The Color Sieve",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/the-color-sieve.webp",
      "artworkPath": "/templates/signup/holidays/holi/the-color-sieve.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "The Color Sieve: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · The Community Bonfire",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/the-community-bonfire.webp",
      "artworkPath": "/templates/signup/holidays/holi/the-community-bonfire.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "The Community Bonfire: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · Coconut Laddoo",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/coconut-laddoo.webp",
      "artworkPath": "/templates/signup/holidays/holi/coconut-laddoo.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "Coconut Laddoo: a Holi design for your own event details and signup sections.",
      "keywords": "Holi festival colors Rangwali spring"
    },
    {
      "name": "Holi · A Stained Canvas Bag",
      "tier": "free",
      "path": "/templates/signup/holidays/holi/a-stained-canvas-bag.webp",
      "artworkPath": "/templates/signup/holidays/holi/a-stained-canvas-bag.webp",
      "occasion": "holi",
      "audience": "Community & Family",
      "description": "A Stained Canvas Bag: a Holi design for your own event details and signup sections.",
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
    },
    {
      "name": "Nowruz · Blossoms Above the Door",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/blossoms-above-the-door.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/blossoms-above-the-door.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Blossoms Above the Door: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · The Spring Market",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/the-spring-market.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/the-spring-market.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "The Spring Market: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Painted Eggs from Above",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/painted-eggs-from-above.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/painted-eggs-from-above.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Painted Eggs from Above: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · The Apple Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/the-apple-basket.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/the-apple-basket.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "The Apple Basket: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Tea in the Garden",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/tea-in-the-garden.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/tea-in-the-garden.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Tea in the Garden: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · The Spring Train",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/the-spring-train.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/the-spring-train.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "The Spring Train: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Riverbank Gathering",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/riverbank-gathering.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/riverbank-gathering.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Riverbank Gathering: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Courtyard Spring Cleaning",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/courtyard-spring-cleaning.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/courtyard-spring-cleaning.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Courtyard Spring Cleaning: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Woven Picnic Baskets",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/woven-picnic-baskets.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/woven-picnic-baskets.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Woven Picnic Baskets: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · New Clothes on the Rail",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/new-clothes-on-the-rail.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/new-clothes-on-the-rail.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "New Clothes on the Rail: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · The Village Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/the-village-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/the-village-courtyard.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "The Village Courtyard: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · The Window's Reflection",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/the-window-s-reflection.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/the-window-s-reflection.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "The Window's Reflection: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · Spring Herb Pots",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/spring-herb-pots.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/spring-herb-pots.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "Spring Herb Pots: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · A Neighborhood Bakery",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/a-neighborhood-bakery.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/a-neighborhood-bakery.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "A Neighborhood Bakery: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · A Garden Seat",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/a-garden-seat.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/a-garden-seat.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "A Garden Seat: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · The Riverside Bicycle",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/the-riverside-bicycle.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/the-riverside-bicycle.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "The Riverside Bicycle: a Nowruz design for your own event details and signup sections.",
      "keywords": "Nowruz Persian New Year spring equinox"
    },
    {
      "name": "Nowruz · The First Green Branch",
      "tier": "free",
      "path": "/templates/signup/holidays/nowruz/the-first-green-branch.webp",
      "artworkPath": "/templates/signup/holidays/nowruz/the-first-green-branch.webp",
      "occasion": "nowruz",
      "audience": "Community & Family",
      "description": "The First Green Branch: a Nowruz design for your own event details and signup sections.",
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
    },
    {
      "name": "Vaisakhi · Gurdwara Morning Courtyard",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/gurdwara-morning-courtyard.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/gurdwara-morning-courtyard.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Gurdwara Morning Courtyard: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Steel Plates for Langar",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/steel-plates-for-langar.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/steel-plates-for-langar.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Steel Plates for Langar: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Marigold Market Baskets",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/marigold-market-baskets.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/marigold-market-baskets.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Marigold Market Baskets: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Roti on the Tawa",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/roti-on-the-tawa.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/roti-on-the-tawa.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Roti on the Tawa: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Sugarcane Juice Stall",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/sugarcane-juice-stall.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/sugarcane-juice-stall.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Sugarcane Juice Stall: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · A Pair of Jutti",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/a-pair-of-jutti.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/a-pair-of-jutti.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "A Pair of Jutti: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · The Volunteer Apron Rail",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/the-volunteer-apron-rail.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/the-volunteer-apron-rail.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "The Volunteer Apron Rail: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · The Wheat Thresher",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/the-wheat-thresher.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/the-wheat-thresher.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "The Wheat Thresher: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · A Courtyard Charpai",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/a-courtyard-charpai.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/a-courtyard-charpai.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "A Courtyard Charpai: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Garden for the Community",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/garden-for-the-community.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/garden-for-the-community.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Garden for the Community: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · The Cloth Stall",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/the-cloth-stall.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/the-cloth-stall.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "The Cloth Stall: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · The Fairground Wheel",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/the-fairground-wheel.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/the-fairground-wheel.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "The Fairground Wheel: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · The Community Bread Basket",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/the-community-bread-basket.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/the-community-bread-basket.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "The Community Bread Basket: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · The Combine at Rest",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/the-combine-at-rest.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/the-combine-at-rest.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "The Combine at Rest: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · A Sack of Flour",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/a-sack-of-flour.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/a-sack-of-flour.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "A Sack of Flour: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · A Garland on the Tractor",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/a-garland-on-the-tractor.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/a-garland-on-the-tractor.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "A Garland on the Tractor: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
    },
    {
      "name": "Vaisakhi · Vaisakhi Under the Stars",
      "tier": "free",
      "path": "/templates/signup/holidays/vaisakhi/vaisakhi-under-the-stars.webp",
      "artworkPath": "/templates/signup/holidays/vaisakhi/vaisakhi-under-the-stars.webp",
      "occasion": "vaisakhi",
      "audience": "Community & Family",
      "description": "Vaisakhi Under the Stars: a Vaisakhi design for your own event details and signup sections.",
      "keywords": "Vaisakhi Baisakhi Sikh Punjabi harvest April"
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
    },
    {
      "name": "Fall Harvest · The Red Pear Orchard",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/the-red-pear-orchard.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/the-red-pear-orchard.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "The Red Pear Orchard: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Beetroot from the Soil",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/beetroot-from-the-soil.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/beetroot-from-the-soil.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Beetroot from the Soil: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Carrots at the Wash Trough",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/carrots-at-the-wash-trough.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/carrots-at-the-wash-trough.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Carrots at the Wash Trough: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Rows of Drying Beans",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/rows-of-drying-beans.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/rows-of-drying-beans.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Rows of Drying Beans: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · The Potato Fork",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/the-potato-fork.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/the-potato-fork.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "The Potato Fork: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Corn in the Granary",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/corn-in-the-granary.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/corn-in-the-granary.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Corn in the Granary: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Rainy Orchard Lane",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/rainy-orchard-lane.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/rainy-orchard-lane.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Rainy Orchard Lane: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · The Root Cellar Steps",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/the-root-cellar-steps.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/the-root-cellar-steps.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "The Root Cellar Steps: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · Harvest Festival Bandstand",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/harvest-festival-bandstand.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/harvest-festival-bandstand.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "Harvest Festival Bandstand: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · The Barley Stubble",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/the-barley-stubble.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/the-barley-stubble.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "The Barley Stubble: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · A Country Grain Mill",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/a-country-grain-mill.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/a-country-grain-mill.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "A Country Grain Mill: a Fall Harvest design for your own event details and signup sections.",
      "keywords": "fall harvest autumn pumpkin patch apple picking hayride festival"
    },
    {
      "name": "Fall Harvest · The Wooden Orchard Ladder",
      "tier": "free",
      "path": "/templates/signup/holidays/fall-harvest/the-wooden-orchard-ladder.webp",
      "artworkPath": "/templates/signup/holidays/fall-harvest/the-wooden-orchard-ladder.webp",
      "occasion": "fall-harvest",
      "audience": "Community & Family",
      "description": "The Wooden Orchard Ladder: a Fall Harvest design for your own event details and signup sections.",
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
    },
    {
      "name": "Friendsgiving · The Extra Door Key",
      "tier": "free",
      "path": "/templates/signup/holidays/friendsgiving/the-extra-door-key.webp",
      "artworkPath": "/templates/signup/holidays/friendsgiving/the-extra-door-key.webp",
      "occasion": "friendsgiving",
      "audience": "Community & Family",
      "description": "The Extra Door Key: a Friendsgiving design for your own event details and signup sections.",
      "keywords": "Friendsgiving friends November potluck thanks"
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
