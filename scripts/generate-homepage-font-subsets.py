"""Prepare homepage Latin fonts without changing the full authored typefaces.

Requires fonttools[woff]==4.59.0. Run --check to verify committed derivatives.
Keep layout features, outlines, advances, names and hinting intact.
Compact unused glyph slots; all layout references are remapped together.
"""
import argparse
from io import BytesIO
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ["inter", "playfairdisplay"]
FAMILIES = {"inter": "Envitefy Homepage Inter", "playfairdisplay": "Envitefy Homepage Playfair"}
RANGES = [(0x0000, 0x024F), (0x1E00, 0x1EFF), (0x2000, 0x206F),
          (0x20A0, 0x20CF), (0x2100, 0x214F), (0x2190, 0x21FF),
          (0x2212, 0x2212), (0xFEFF, 0xFEFF), (0xFFFD, 0xFFFD)]


def prepare(source):
    original = TTFont(source, recalcTimestamp=False, recalcBBoxes=False)
    font = TTFont(source, recalcTimestamp=False, recalcBBoxes=False)
    codes = {code for first, last in RANGES for code in range(first, last + 1)}
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.glyph_names = True
    options.hinting = True
    options.retain_gids = False
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=codes)
    worker.subset(font)
    assert set(font.getBestCmap()) == set(original.getBestCmap()) & codes
    for glyph in worker.glyphs_retained:
        assert font["hmtx"][glyph] == original["hmtx"][glyph], f"{glyph}: advance changed"
        before, after = original["glyf"][glyph], font["glyf"][glyph]
        assert before.getCoordinates(original["glyf"]) == after.getCoordinates(font["glyf"]), f"{glyph}: outline changed"
        if hasattr(before, "program"):
            assert before.program.getBytecode() == after.program.getBytecode(), f"{glyph}: hints changed"
    for table, fields in [("hhea", ["ascent", "descent", "lineGap"]),
                          ("OS/2", ["sTypoAscender", "sTypoDescender", "sTypoLineGap", "usWinAscent", "usWinDescent", "usWeightClass", "fsSelection"]),
                          ("head", ["unitsPerEm", "macStyle"])]:
        for field in fields:
            assert getattr(original[table], field) == getattr(font[table], field), f"{table}.{field}: metric/style changed"
    # These are modified derivatives. Give their identity records distinct names,
    # while retaining the upstream copyright, licensing and style records verbatim.
    family = FAMILIES[source.stem]
    postscript = family.replace(" ", "") + "-Regular"
    replacements = {1: family, 3: postscript + ";homepage-v1", 4: family + " Regular", 6: postscript,
                    16: family, 18: family + " Regular", 21: family, 25: family.replace(" ", "")}
    original_names = {(record.nameID, record.platformID, record.platEncID, record.langID): record.string
                      for record in original["name"].names}
    for record in list(font["name"].names):
        if record.nameID in replacements:
            font["name"].setName(replacements[record.nameID], record.nameID,
                                 record.platformID, record.platEncID, record.langID)
    for record in font["name"].names:
        if record.nameID in replacements:
            assert record.toUnicode() == replacements[record.nameID]
        else:
            key = (record.nameID, record.platformID, record.platEncID, record.langID)
            assert record.string == original_names[key], f"name {record.nameID}: upstream notice/style changed"
    font.flavor = "woff2"
    result = BytesIO()
    font.save(result)
    return result.getvalue(), len(worker.glyphs_retained), len(font.getBestCmap())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    options = parser.parse_args()
    output = ROOT / "public/fonts/marketing/homepage-v1"
    evidence = []
    for name in FONTS:
        source = ROOT / f"public/fonts/birthday/{name}.ttf"
        target = output / f"{name}-latin-extended.woff2"
        license_source = source.with_name(f"{name}-OFL.txt")
        license_target = output / license_source.name
        data, glyphs, codepoints = prepare(source)
        if options.check:
            assert target.read_bytes() == data, f"Outdated derivative: {target}"
            assert license_target.read_bytes() == license_source.read_bytes(), f"Missing or changed notice: {license_target}"
        else:
            output.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            license_target.write_bytes(license_source.read_bytes())
        assert len(data) < source.with_suffix(".woff2").stat().st_size
        evidence.append({"font": name, "bytes": len(data), "verifiedGlyphs": glyphs, "codepoints": codepoints})
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
