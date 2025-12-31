# The Catch - Menu Image Kit

Gemini-powered batch image enhancement for menu photos. Transforms raw food photos into cohesive, professional menu imagery with consistent styling.

## Setup

```bash
cd tools/menu-image-kit
npm install
export GEMINI_API_KEY="your-api-key"
```

## Quick Start

1. **Add source images** to `./data/input/`
2. **Run the batch processor:**
   ```bash
   npm run batch
   ```
3. **Find outputs** in `./data/output/`

Each input image produces:
- `{name}__hero_4x3.png` - Hero aspect ratio
- `{name}__square_1x1.png` - Square crop for cards

## Available Prompts

| Prompt | Description |
|--------|-------------|
| `prompt_cajun_cookbook.txt` | **Default.** Weathered driftwood, golden hour warmth, Louisiana aesthetic |
| `prompt_gulf_coast.txt` | Whitewashed beach house look, bright coastal daylight |
| `prompt_minimal.txt` | No props, just clean dish presentation |

Switch prompts:
```bash
export PROMPT_FILE="./prompts/prompt_gulf_coast.txt"
npm run batch
```

## Configuration

| Env Var | Default | Purpose |
|---------|---------|---------|
| `GEMINI_API_KEY` | (required) | Your Google AI API key |
| `INPUT_DIR` | `./data/input` | Source images directory |
| `OUTPUT_DIR` | `./data/output` | Where processed images go |
| `PROMPT_FILE` | `./prompts/prompt_cajun_cookbook.txt` | Which prompt to use |
| `STYLE_REF` | `./data/style_reference.png` | Optional reference image for consistency |
| `MAX_PROPS` | `2` | 0 = no props, 1-2 = minimal |
| `CONCURRENCY` | `1` | Keep at 1 to avoid rate limits |
| `RATE_LIMIT_DELAY` | `4000` | Milliseconds between API calls |
| `OVERWRITE` | `0` | Set to `1` to re-process existing outputs |
| `RETRIES` | `3` | Retry attempts on failure |

## Usage Examples

### Process existing DFW images
```bash
export GEMINI_API_KEY="your-key"
export INPUT_DIR="../../public/dfw-images"
export OUTPUT_DIR="./data/output"
npm run batch
```

### Use a style reference for consistency
```bash
# Pick your best-looking output image as the reference
cp ./data/output/gumbo__hero_4x3.png ./data/style_reference.png
export STYLE_REF="./data/style_reference.png"
npm run batch
```

### Minimal/no-props mode
```bash
export MAX_PROPS=0
npm run batch
```

## Output

Run logs are saved to `./runs/run-{timestamp}.jsonl` with status for each image.

## Uploading to Sanity

After generating images, upload to Sanity:

```bash
# From project root
npx sanity dataset import ./upload-batch.ndjson production
```

Or manually upload via Sanity Studio.

## Tips

- **Rate limits**: Gemini has rate limits. Keep `CONCURRENCY=1` and `RATE_LIMIT_DELAY=4000` or higher.
- **Style consistency**: Use `STYLE_REF` with your best output to maintain consistent look across the batch.
- **Naming**: Name source files descriptively (e.g., `gumbo.jpg`, `catfish-basket.jpg`) - output filenames match inputs.
- **Quality**: Higher quality source images = better results. Scraped images work but pro photos are ideal.
