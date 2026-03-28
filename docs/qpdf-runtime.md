# QPDF Runtime Requirement

The flyer upload pipeline expects `qpdf` to be installed in every runtime image that serves `src/app/api/upload/route.ts` and `src/app/api/ingest/route.ts`.

Default lookup:

- Binary name: `qpdf`
- Override: set `QPDF_BIN=/absolute/path/to/qpdf`

Current optimization command:

```bash
qpdf --stream-data=compress --object-streams=generate --recompress-flate --compression-level=9 input.pdf output.pdf
```

Operational behavior:

- PDF uploads continue if `qpdf` is missing, times out, or returns invalid output.
- In that fallback path, Envitefy stores the original PDF and marks `optimizedByQpdf: false`.
- Preview image generation still runs from the stored PDF bytes.

Provisioning examples:

```bash
apt-get update && apt-get install -y qpdf
```

```bash
brew install qpdf
```

```powershell
choco install qpdf
```
