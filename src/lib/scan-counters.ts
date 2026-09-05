/** The legacy category-to-counter mapping, shared by atomic scan writes. */
export function scanCounterUpdates(category?: string | null): string[] {
  const cat = (category || "").toLowerCase();
  const columns = ["scans_total"];
  if (cat.includes("birthday")) columns.push("scans_birthdays");
  if (cat.includes("wedding")) columns.push("scans_weddings");
  if (cat.includes("sport")) columns.push("scans_sport_events");
  if (["doctor", "dr ", "dr."].some((word) => cat.includes(word)))
    columns.push("scans_doctor_appointments");
  if (cat.includes("appointment")) columns.push("scans_appointments");
  if (["play day", "playday", "playdate"].some((word) => cat.includes(word)))
    columns.push("scans_play_days");
  if (cat.includes("general")) columns.push("scans_general_events");
  if (["car pool", "carpool", "ride share", "school pickup", "school drop"].some((word) => cat.includes(word)))
    columns.push("scans_car_pool");
  // Only fixed column names above enter SQL; category is never interpolated.
  return columns.map((column) => `${column} = coalesce(${column}, 0) + 1`);
}
