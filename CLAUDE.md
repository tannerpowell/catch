# Claude Code Project Instructions

## Code Review Workflow

All changes must be reviewed via pull requests before merging to `main`.

### CodeRabbit Integration

- **Require 100% CodeRabbit approval** before merging any PR to main
- Claude should address ALL CodeRabbit comments, including nitpicks
- Claude has discretion to respectfully disagree if there's a strong technical reason, but should explain the reasoning in a reply comment
- Do not merge until CodeRabbit gives full approval

### PR Process

1. Create feature branch and commit changes
2. Open PR for CodeRabbit review
3. Address all review comments (fix or reply with reasoning)
4. Wait for CodeRabbit approval
5. Merge to main

## Project Context

This is The Catch restaurant ordering system with:
- Next.js 15 frontend
- Sanity CMS for content
- Multi-location menu management
- Kitchen display system (KDS)

## Key Directories

- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utilities, adapters, contexts
- `sanity/` - Sanity schema definitions
- `studio/` - Embedded Sanity Studio
- `scripts/` - Data migration and utility scripts
