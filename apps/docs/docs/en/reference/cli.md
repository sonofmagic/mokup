# CLI

`@mokup/cli` provides the `mokup build` command to generate `.mokup` outputs.

## Usage

```bash
pnpm exec mokup build --dir mock --out .mokup
```

## Options

| Option          | Description                          |
| --------------- | ------------------------------------ |
| `--dir, -d`     | Mock directory (repeatable)          |
| `--out, -o`     | Output directory (default: `.mokup`) |
| `--prefix`      | URL prefix                           |
| `--include`     | Include regex                        |
| `--exclude`     | Exclude regex                        |
| `--no-handlers` | Skip handler output                  |

## Notes

- Multiple `--dir` values are merged into one manifest.
- `mokup.bundle.mjs` is the recommended runtime entry.
