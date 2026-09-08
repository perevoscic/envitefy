#!/usr/bin/env python3
"""Verify and install built-in ImageGen outputs; never calls an image API."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs/signup-artwork-catalog.json"
GENERATOR_ROOT = Path("/Users/rj/.codex/generated_images/01a07e7b-f2c7-7261-9f84-f5a4d4379424")


def dimensions(path):
    result = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height", "-of", "json", str(path),
    ], check=True, capture_output=True, text=True)
    stream = json.loads(result.stdout)["streams"][0]
    return [stream["width"], stream["height"]]


def save(plan):
    temporary = PLAN.with_suffix(".tmp")
    temporary.write_text(json.dumps(plan, indent=2) + "\n")
    temporary.replace(PLAN)


def install(result_file):
    plan = json.loads(PLAN.read_text())
    for result in json.loads(Path(result_file).read_text()):
        job = next(job for job in plan["assets"] if job["id"] == result["id"])
        source = Path(result["source"]).resolve()
        if source.parent != GENERATOR_ROOT.resolve() or source.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            raise ValueError(f"Unexpected generator source: {source}")
        output = ROOT / job["output"]
        if output.exists() and job["status"] != "generated":
            raise FileExistsError(f"Unregistered output already exists: {output}")
        output.parent.mkdir(parents=True, exist_ok=True)
        before = dimensions(source)
        temporary = output.with_suffix(".encoding.webp")
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", str(source),
            "-c:v", "libwebp", "-quality", "85", "-compression_level", "6",
            str(temporary),
        ], check=True)
        data = temporary.read_bytes()
        if data[:4] != b"RIFF" or data[8:12] != b"WEBP" or dimensions(temporary) != before:
            raise ValueError(f"WebP verification failed: {temporary}")
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(temporary), "-f", "null", "-"], check=True, capture_output=True)
        temporary.replace(output)
        job.update(status="generated", source=str(source), verifiedDimensions=before,
                   verifiedDecode=True, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                   quality=85, compressionLevel=6, originalDeleted=False)
        save(plan)
        print(json.dumps({"id": job["id"], "output": job["output"], "dimensions": before, "bytes": len(data)}))


def cleanup():
    plan = json.loads(PLAN.read_text())
    removed = 0
    for job in plan["assets"]:
        if job["status"] != "generated" or job.get("originalDeleted"):
            continue
        source, output = Path(job["source"]).resolve(), ROOT / job["output"]
        if source.parent != GENERATOR_ROOT.resolve():
            raise ValueError(f"Unexpected cleanup path: {source}")
        if not job.get("visuallyReviewed"):
            continue
        if hashlib.sha256(output.read_bytes()).hexdigest() != job["sha256"] or dimensions(output) != job["verifiedDimensions"]:
            raise ValueError(f"Replacement changed: {output}")
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(output), "-f", "null", "-"], check=True, capture_output=True)
        source.unlink(missing_ok=True)
        job["originalDeleted"] = not source.exists()
        removed += 1
    save(plan)
    print(json.dumps({"originalsRemoved": removed}))


def publish():
    plan = json.loads(PLAN.read_text())
    ready = {job["legacyPath"]: "/" + job["output"].removeprefix("public/")
             for job in plan["assets"] if job["status"] == "generated" and job.get("visuallyReviewed")}
    manifest_path = ROOT / "public/templates/signup/manifest.json"
    manifest = json.loads(manifest_path.read_text())
    for entries in manifest.values():
        for entry in entries:
            if entry["path"] in ready:
                entry["artworkPath"] = ready[entry["path"]]
    serialized = json.dumps(manifest, indent=2, ensure_ascii=False)
    manifest_path.write_text(serialized + "\n")
    (ROOT / "src/assets/signup-templates.ts").write_text(
        '// Artwork paths are installed by scripts/process-signup-artwork.py.\n'
        '// The canonical path preserves template IDs and previously saved artwork.\n'
        'export type SignupTemplateItem = { name: string; tier: "free" | "premium"; path: string; artworkPath?: string };\n'
        'export type SignupTemplateManifest = Record<string, SignupTemplateItem[]>;\n'
        'export const SIGNUP_TEMPLATES: SignupTemplateManifest = ' + serialized + ';\n')
    print(json.dumps({"templatesWithNewArtwork": len(ready)}))


def reviewed(result_file):
    plan = json.loads(PLAN.read_text())
    ids = {result["id"] for result in json.loads(Path(result_file).read_text())}
    for job in plan["assets"]:
        if job["id"] in ids and job["status"] == "generated":
            job["visuallyReviewed"] = True
    save(plan)
    print(json.dumps({"reviewed": len(ids)}))


if __name__ == "__main__":
    if sys.argv[1] == "cleanup":
        cleanup()
    elif sys.argv[1] == "publish":
        publish()
    elif sys.argv[1] == "reviewed":
        reviewed(sys.argv[2])
    else:
        install(sys.argv[1])
