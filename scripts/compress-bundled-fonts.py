"""Losslessly package existing TTFs as WOFF2; requires fonttools[woff]==4.59.0.

Run with --check to verify the committed derivatives without rewriting them.
No subsetting, instancing, hint removal, outline transforms or metric changes.
"""
import argparse
import hashlib
import json
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import WOFF2FlavorData

ROOT = Path(__file__).resolve().parent.parent
FONTS = ["inter", "playfairdisplay"]


def tables(font):
    result = {}
    for tag in font.reader.keys():
        data = font.reader[tag]
        if tag == "head":
            # WOFF2 sets the lossless-compression flag (bit 11); packaging also
            # changes the sfnt checksum. Neither changes rendering semantics.
            data = data[:8] + bytes(4) + data[12:]
            flags = int.from_bytes(data[16:18], "big") & ~(1 << 11)
            data = data[:16] + flags.to_bytes(2, "big") + data[18:]
        result[tag] = data
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    options = parser.parse_args()
    evidence = []
    for name in FONTS:
        source = ROOT / "public/fonts/birthday" / f"{name}.ttf"
        target = source.with_suffix(".woff2")
        if not options.check:
            font = TTFont(source, recalcTimestamp=False, recalcBBoxes=False)
            font.flavor = "woff2"
            # Raw-table Brotli compression keeps all authored sfnt tables exact.
            font.flavorData = WOFF2FlavorData(transformedTables=set())
            font.save(target)
        original = TTFont(source, recalcTimestamp=False, recalcBBoxes=False)
        compressed = TTFont(target, recalcTimestamp=False, recalcBBoxes=False)
        before, after = tables(original), tables(compressed)
        assert before.keys() == after.keys(), f"{name}: font tables changed"
        for tag, data in before.items():
            assert data == after[tag], f"{name}: {tag} differs after decompression"
        assert source.stat().st_size > target.stat().st_size, f"{name}: no compression saving"
        evidence.append({
            "source": str(source.relative_to(ROOT)),
            "woff2": str(target.relative_to(ROOT)),
            "sourceBytes": source.stat().st_size,
            "woff2Bytes": target.stat().st_size,
            "verifiedTables": sorted(before),
            "glyphs": len(original.getGlyphOrder()),
            "unicodeCharacters": len(original.getBestCmap()),
            "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "woff2Sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        })
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
