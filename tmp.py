from pathlib import Path
text=Path("src/app/event/weddings/customize/page.tsx").read_text().splitlines()
for idx,line in enumerate(text,1):
    if 200<=idx<=260:
        print(f"{idx}: {line}")

