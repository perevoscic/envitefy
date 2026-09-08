// Artwork paths are installed by scripts/process-signup-artwork.py.
// The canonical path preserves template IDs and previously saved artwork.
export type SignupTemplateItem = { name: string; tier: "free" | "premium"; path: string; artworkPath?: string };
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
    }
  ]
};
