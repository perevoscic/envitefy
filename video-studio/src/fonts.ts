import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export async function loadBrandFonts() {
  await Promise.all([
    loadFont({
      family: "Josefin Slab",
      url: staticFile("fonts/JosefinSlab.ttf"),
      weight: "700",
      style: "normal",
    }),
    loadFont({
      family: "Josefin Sans",
      url: staticFile("fonts/JosefinSans.ttf"),
      weight: "100 700",
      style: "normal",
    }),
  ]);
}
