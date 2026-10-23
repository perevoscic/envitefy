#!/usr/bin/env python3
"""Install and verify the holiday collection artwork (no image API calls)."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs/holiday-template-artwork.json"
RESULTS = ROOT / "output/seasonal-templates/results"
API_SOURCES = ROOT / "output/imagegen/holiday-batch"
API_CORRECTIONS = ROOT / "output/imagegen/holiday-corrections"
SOURCES = Path.home() / ".codex/generated_images/01a0d710-2458-7f01-b400-591358ad081c"
GENERATED_ROOT = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")) / "generated_images"


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def dimensions(file):
    probe = json.loads(run("ffprobe", "-v", "error", "-select_streams", "v:0",
                          "-show_entries", "stream=width,height", "-of", "json", str(file)))
    stream = probe["streams"][0]
    return [stream["width"], stream["height"]]


def verify(file, expected):
    data = file.read_bytes()
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP" or dimensions(file) != expected:
        raise ValueError(f"Invalid WebP: {file}")
    run("ffmpeg", "-v", "error", "-i", str(file), "-f", "null", "-")
    return data


def save(plan):
    temporary = PLAN.with_suffix(".tmp")
    temporary.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n")
    temporary.replace(PLAN)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "install"
    if mode not in {"install", "reviewed", "cleanup", "verify"}:
        raise ValueError("Use install, reviewed <ids...>, cleanup, or verify")
    plan = json.loads(PLAN.read_text())
    only = set()
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1:])
        unknown = only - {asset["id"] for asset in plan["assets"]}
        if unknown:
            raise ValueError(f"Unknown artwork IDs: {sorted(unknown)}")
    count = 0
    for asset in plan["assets"]:
        if only and asset["id"] not in only:
            continue
        if mode == "reviewed":
            if asset["id"] in sys.argv[2:] and asset["status"] == "generated":
                asset["visuallyReviewed"] = True
                count += 1
            continue
        if mode == "install":
            result = RESULTS / (asset["id"] + ".json")
            if result.exists():
                entry = json.loads(result.read_text())
                if entry["id"] != asset["id"]:
                    raise ValueError("Result ID mismatch")
                asset["source"] = entry["source"]
                asset["provider"] = "OpenAI built-in image_gen"
                if entry.get("generationPrompt") and entry["generationPrompt"] != asset["prompt"]:
                    asset["generationPromptOverride"] = entry["generationPrompt"]
                if entry.get("referenceSource"):
                    asset["generationReferenceSource"] = entry["referenceSource"]
            elif (API_SOURCES / (asset["id"] + ".png")).exists():
                asset["source"] = str((API_SOURCES / (asset["id"] + ".png")).resolve())
                asset["provider"] = "OpenAI API"
                asset["model"] = "gpt-image-2"
                asset["generationQuality"] = "medium"
        if not asset.get("source"):
            continue
        source = Path(asset["source"]).resolve()
        output = (ROOT / asset["output"]).resolve()
        codex_original = (source.parent.parent == GENERATED_ROOT.resolve()
                          and source.name.startswith("exec-"))
        if source.suffix != ".png" or not (source.parent == SOURCES.resolve() or codex_original or
                (source.parent in {API_SOURCES.resolve(), API_CORRECTIONS.resolve()}
                 and source.name == asset["id"] + ".png")):
            raise ValueError(f"Unexpected generated original: {source}")
        if not output.is_relative_to(ROOT / "public/templates/signup") or output.suffix != ".webp":
            raise ValueError(f"Unexpected output: {output}")
        if mode == "install":
            if asset["status"] == "generated":
                continue
            if output.exists():
                raise FileExistsError(output)
            expected = dimensions(source)
            output.parent.mkdir(parents=True, exist_ok=True)
            temporary = output.with_suffix(".encoding.webp")
            run("ffmpeg", "-v", "error", "-y", "-i", str(source), "-c:v", "libwebp",
                "-quality", "85", "-compression_level", "6", str(temporary))
            data = verify(temporary, expected)
            temporary.replace(output)
            asset.update(status="generated", verifiedDimensions=expected, verifiedDecode=True,
                         bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), quality=85,
                         compressionLevel=6, originalDeleted=False, visuallyReviewed=False)
            count += 1
            save(plan)
        elif mode in {"cleanup", "verify"}:
            if asset["status"] != "generated":
                continue
            data = verify(output, asset["verifiedDimensions"])
            if hashlib.sha256(data).hexdigest() != asset["sha256"]:
                raise ValueError(f"Changed output: {output}")
            if mode == "cleanup" and asset.get("visuallyReviewed"):
                source.unlink(missing_ok=True)
                asset["originalDeleted"] = not source.exists()
                count += 1
                save(plan)
            elif mode == "verify":
                assert asset.get("originalDeleted") and not source.exists(), asset["id"]
                assert asset.get("visuallyReviewed"), asset["id"]
                count += 1
    save(plan)
    if mode == "verify":
        selected = [a for a in plan["assets"] if not only or a["id"] in only]
        expected = (sum(a["status"] == "generated" for a in selected)
                    if "--available-only" in sys.argv else len(selected))
        assert count == expected and count > 0, f"Only {count} of {expected} assets complete"
    print(json.dumps({"action": mode, "processed": count,
                      "installed": sum(a["status"] == "generated" for a in plan["assets"])}))


if __name__ == "__main__":
    main()
