import fs from "node:fs/promises";
import path from "node:path";

export default async function loadWeddingTemplate(templateId: string) {
  const file = path.join(
    process.cwd(),
    "templates/weddings",
    templateId,
    "config.json"
  );

  return JSON.parse(await fs.readFile(file, "utf8"));
}
