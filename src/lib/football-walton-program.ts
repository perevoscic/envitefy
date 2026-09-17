// Verified against Walton High School's official athletics and game-day pages, September 15, 2026.
export const WALTON_FOOTBALL_PROGRAM = {
  aliases: ["walton", "walton high school", "walton high school football", "walton braves", "walton braves football", "walton high school defuniak springs", "walton defuniak springs"],
  mascot: "Braves",
  venue: "Walton High School football stadium",
  address: "449 Walton Road, DeFuniak Springs, FL 32433",
  venueSource: "https://whs.walton.k12.fl.us/o/whs/page/athletics",
  ticketsLink: "https://gofan.co/app/school/FL21427",
  ticketsSource: "https://whs.walton.k12.fl.us/o/whs/page/athletics",
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Bare Walton is ambiguous nationally; South Walton's local schedule identifies the Florida school. */
export function resolveWaltonFootballProgram(teamName = "", contextTeamName = "") {
  const name = normalize(teamName);
  if (!WALTON_FOOTBALL_PROGRAM.aliases.some((alias) => normalize(alias) === name)) return null;
  const explicitIdentity = name.includes("braves") || name.includes("defuniaksprings");
  const localSchedule = /^(?:south walton|fort walton beach|gulf breeze)(?:\s|$)/i.test(contextTeamName.trim());
  return explicitIdentity || localSchedule ? WALTON_FOOTBALL_PROGRAM : null;
}
