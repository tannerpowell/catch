# Kitchen JWT Token Generator

Generate secure JWT tokens for kitchen staff authentication.

## Quick Start

```bash
npm run generate:jwt -- \
  --userId=jane@thecatch.com \
  --locations=post-oak,conroe \
  --role=kitchen_staff
```

## Usage

### Generate Token for Kitchen Staff

```bash
npm run generate:jwt -- \
  --userId=<user-id> \
  --locations=<location-slugs> \
  --role=<role> \
  --expiresIn=<duration>
```

### Arguments

- **--userId** (required): User identifier (email or ID)
- **--locations** (required): Comma-separated location slugs
- **--role** (optional): User role (default: `kitchen_staff`)
  - Options: `kitchen_staff`, `admin`
- **--expiresIn** (optional): Token expiration (default: `24h`)
  - Examples: `1h`, `24h`, `7d`, `30d`

### Available Location Slugs

- `post-oak`
- `conroe`
- `woodlands`
- `downtown`
- `denton`
- `fort-worth`
- `san-antonio`

## Examples

### Single Location (24-hour token)
```bash
npm run generate:jwt -- \
  --userId=manager@thecatch.com \
  --locations=post-oak
```

### Multiple Locations (7-day token)
```bash
npm run generate:jwt -- \
  --userId=regional@thecatch.com \
  --locations=post-oak,conroe,woodlands \
  --expiresIn=7d
```

### Admin Access (all locations)
```bash
npm run generate:jwt -- \
  --userId=admin@thecatch.com \
  --locations=post-oak,conroe,woodlands,downtown,denton,fort-worth,san-antonio \
  --role=admin \
  --expiresIn=30d
```

### Short-lived Token (1 hour)
```bash
npm run generate:jwt -- \
  --userId=temp@thecatch.com \
  --locations=post-oak \
  --expiresIn=1h
```

## Setup

1. **Set JWT Secret** in `.env.local`:
   ```bash
   KITCHEN_JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Generate tokens** as needed for your kitchen staff

## Security Notes

⚠️ **Token Security:**
- Treat tokens like passwords
- Never commit to version control
- Store in secure environment variables
- Use HTTPS only in production
- Rotate tokens regularly
- Revoke access by not issuing new tokens

🔒 **Secret Security:**
- `KITCHEN_JWT_SECRET` must be at least 32 bytes
- Never expose in client-side code
- Rotate every 90 days
- Different from other secrets (SANITY_WRITE_TOKEN, etc.)

## Output

The script generates a detailed output including:
- Token metadata (user, role, locations, expiration)
- The JWT token (copy this for API calls)
- Usage instructions
- Security reminders

Example output:
```
✅ Token generated successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TOKEN DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User ID:       jane@thecatch.com
Role:          kitchen_staff
Locations:     post-oak, conroe
Issued At:     2025-11-24T10:00:00.000Z
Expires At:    2025-11-25T10:00:00.000Z
Valid For:     24 hours
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎫 JWT TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
eyJhbGc...signature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Using Tokens

Include in API requests with Bearer authentication:

```bash
curl -X POST https://your-site.com/api/orders/update-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"orderId": "order123", "newStatus": "preparing"}'
```

## Troubleshooting

### "KITCHEN_JWT_SECRET not found"
Add `KITCHEN_JWT_SECRET` to `.env.local`:
```bash
echo "KITCHEN_JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
```

### "Invalid arguments"
Ensure both `--userId` and `--locations` are provided:
```bash
npm run generate:jwt -- --userId=user@email.com --locations=post-oak
```

### Token expires too quickly/slowly
Adjust with `--expiresIn`:
```bash
npm run generate:jwt -- --userId=user --locations=post-oak --expiresIn=7d
```

## Documentation

- [JWT Migration Guide](../docs/JWT-MIGRATION-GUIDE.md) - Complete JWT implementation details
- [Security Documentation](../docs/SECURITY.md) - Overall security architecture
- [Auth Implementation](../docs/AUTH-IMPLEMENTATION.md) - Authentication setup guide

## Support

For issues or questions:
1. Check error messages in script output
2. Verify `.env.local` has `KITCHEN_JWT_SECRET`
3. Review [JWT Migration Guide](../docs/JWT-MIGRATION-GUIDE.md)
4. Test with short-lived token first (`--expiresIn=1h`)
