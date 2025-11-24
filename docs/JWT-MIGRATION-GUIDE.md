# JWT Authentication Migration Guide

## Critical Security Update

The simple `token:location1,location2` format has been **deprecated** due to critical security vulnerabilities:

❌ **Security Issues with Old Format:**
- No cryptographic integrity protection
- Anyone who discovers the format can modify location lists
- No expiration or replay protection
- Easily spoofed by attackers

✅ **New JWT Format Benefits:**
- Cryptographically signed tokens prevent tampering
- Built-in expiration and replay protection
- Structured claims validation
- Industry-standard security (RFC 7519)

## Migration Steps

### 1. Install Dependencies

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

### 2. Set JWT Secret

Generate a secure secret:
```bash
openssl rand -base64 32
```

Add to `.env.local`:
```bash
KITCHEN_JWT_SECRET=your-generated-secret-here
```

⚠️ **CRITICAL:** This secret must be:
- Different from `KITCHEN_API_TOKEN`
- At least 32 bytes (256 bits)
- Kept absolutely secret
- Never committed to version control
- Rotated periodically (e.g., every 90 days)

### 3. Generate JWT Tokens

Use the provided script to generate tokens for kitchen staff:

```bash
# Generate token for a kitchen staff member
npm run generate:jwt -- \
  --userId=jane.doe@thecatch.com \
  --locations=post-oak,conroe \
  --role=kitchen_staff \
  --expiresIn=24h
```

**Arguments:**
- `--userId`: Unique user identifier (email or ID)
- `--locations`: Comma-separated list of authorized location slugs
- `--role`: Either `kitchen_staff` or `admin` (default: kitchen_staff)
- `--expiresIn`: Token expiration (default: 24h)
  - Examples: `1h`, `24h`, `7d`, `30d`, `90d`

**Example Output:**
```
✅ Token generated successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TOKEN DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User ID:       jane.doe@thecatch.com
Role:          kitchen_staff
Locations:     post-oak, conroe
Issued At:     2025-11-24T10:00:00.000Z
Expires At:    2025-11-25T10:00:00.000Z
Valid For:     24 hours
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎫 JWT TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqYW5lLmRvZUB0aGVjYXRjaC5jb20iLCJsb2NhdGlvbnMiOlsicG9zdC1vYWsiLCJjb25yb2UiXSwicm9sZSI6ImtpdGNoZW5fc3RhZmYiLCJpYXQiOjE3MDA4MjI0MDAsImV4cCI6MTcwMDkwODgwMH0.signature_here
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Update Your Authentication System

Replace old token generation with JWT:

#### Old (Insecure) Method:
```typescript
// ❌ DO NOT USE - Insecure
const token = `${KITCHEN_API_TOKEN}:${locations.join(',')}`;
```

#### New (Secure) Method:
```typescript
// ✅ Use this instead
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    sub: user.id,
    locations: user.authorizedLocations,
    role: user.role
  },
  process.env.KITCHEN_JWT_SECRET!,
  { 
    algorithm: 'HS256',
    expiresIn: '24h'
  }
);
```

### 5. Update API Calls

Your API calls remain the same - just use the new JWT token:

```typescript
const response = await fetch('/api/orders/update-status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}` // Use JWT instead of old format
  },
  body: JSON.stringify({ 
    orderId: 'order123', 
    newStatus: 'preparing' 
  })
});
```

## JWT Token Structure

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (Claims)
```json
{
  "sub": "user123",                          // User ID (Subject)
  "locations": ["post-oak", "conroe"],       // Authorized locations
  "role": "kitchen_staff",                   // User role
  "iat": 1700822400,                         // Issued at (Unix timestamp)
  "exp": 1700908800                          // Expires at (Unix timestamp)
}
```

### Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  KITCHEN_JWT_SECRET
)
```

## Security Features

### 1. Cryptographic Integrity
JWT tokens are signed with HMAC-SHA256. Any modification to the token invalidates the signature.

**Example Attack Prevention:**
```
Original Token:
  {"locations": ["post-oak"]}
  Signature: valid

Attacker Modifies:
  {"locations": ["post-oak", "all-locations"]}
  Signature: INVALID ❌ - Request denied
```

### 2. Expiration Protection
Tokens automatically expire after the specified duration.

```typescript
// Token expires after 24 hours
expiresIn: '24h'

// After 24 hours, token is automatically rejected
// Error: "Token expired - Please sign in again"
```

### 3. Structured Claims Validation
The API validates all required claims:

```typescript
// Required claims are validated:
✅ sub (user ID) - must be present and string
✅ locations - must be array of strings
✅ role - must be 'kitchen_staff' or 'admin'
✅ exp - must be in the future

// Missing or invalid claims = request denied
```

### 4. Role-Based Access Control
Only users with appropriate roles can update orders:

```typescript
const allowedRoles = ['kitchen_staff', 'admin'];

if (!allowedRoles.includes(decoded.role)) {
  return 403 Forbidden; // Insufficient permissions
}
```

## Token Expiration Recommendations

Choose expiration based on security vs. convenience tradeoff:

| Duration | Use Case | Security Level |
|----------|----------|----------------|
| `1h` | High-security environments | ⭐⭐⭐⭐⭐ Best |
| `8h` | Single work shift | ⭐⭐⭐⭐ Good |
| `24h` | Daily rotation (recommended) | ⭐⭐⭐ Balanced |
| `7d` | Weekly rotation | ⭐⭐ Acceptable |
| `30d` | Monthly rotation | ⭐ Risky |
| `90d+` | Long-term | ❌ Not recommended |

**Recommendation:** Use `24h` for production. Staff sign in once per day.

## Token Management Best Practices

### Storage
- **Backend**: Environment variables or secrets manager (AWS Secrets Manager, HashiCorp Vault)
- **Frontend**: HttpOnly cookies (preferred) or secure localStorage
- **Mobile**: Encrypted keychain/keystore

### Distribution
1. Generate tokens via secure admin panel or CLI tool
2. Distribute via secure channel (encrypted email, password manager)
3. Never send tokens via insecure channels (SMS, unencrypted email, Slack)

### Rotation
- Rotate `KITCHEN_JWT_SECRET` every 90 days
- Regenerate all tokens after secret rotation
- Log all token generations for audit trail

### Revocation
When staff leaves or token is compromised:
1. Remove their user ID from authorized list
2. Optionally rotate `KITCHEN_JWT_SECRET` to invalidate all tokens
3. Generate new tokens for remaining staff

## Troubleshooting

### "JWT verification failed"
**Cause:** Token is invalid, expired, or signed with wrong secret

**Solutions:**
1. Check `KITCHEN_JWT_SECRET` matches the secret used to generate token
2. Verify token hasn't expired (check `exp` claim)
3. Ensure token wasn't modified in transit
4. Regenerate token with correct secret

### "Invalid token claims - missing user ID"
**Cause:** Token doesn't have required `sub` claim

**Solution:** Regenerate token with `--userId` parameter:
```bash
npm run generate:jwt -- --userId=user123 --locations=post-oak
```

### "Insufficient permissions"
**Cause:** User role is not `kitchen_staff` or `admin`

**Solution:** Regenerate token with correct role:
```bash
npm run generate:jwt -- --userId=user123 --locations=post-oak --role=kitchen_staff
```

### "Token expired - Please sign in again"
**Cause:** Token has passed its expiration time

**Solution:** Generate new token:
```bash
npm run generate:jwt -- --userId=user123 --locations=post-oak --expiresIn=24h
```

## Migration Checklist

- [ ] Install `jsonwebtoken` package
- [ ] Generate and set `KITCHEN_JWT_SECRET` in environment
- [ ] Generate JWT tokens for all kitchen staff
- [ ] Update authentication system to generate JWTs
- [ ] Test JWT authentication in development
- [ ] Verify token expiration handling
- [ ] Update frontend/mobile apps to use JWT tokens
- [ ] Deploy to staging and test
- [ ] Train staff on new token format (if manual entry)
- [ ] Deploy to production
- [ ] Monitor logs for authentication errors
- [ ] Remove old `KITCHEN_API_TOKEN` format support (if deprecated)

## Example Integration

### Express/Node.js Backend
```typescript
import jwt from 'jsonwebtoken';

function generateKitchenToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      locations: user.authorizedLocations,
      role: user.role
    },
    process.env.KITCHEN_JWT_SECRET!,
    { 
      algorithm: 'HS256',
      expiresIn: '24h'
    }
  );
}

// Use in login route
app.post('/auth/login', async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);
  
  if (user && user.role === 'kitchen_staff') {
    const token = generateKitchenToken(user);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

### React Frontend
```typescript
// Store token after login
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const { token } = await response.json();
  
  // Store in httpOnly cookie (preferred) or localStorage
  localStorage.setItem('kitchen_token', token);
};

// Use token in API calls
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  const token = localStorage.getItem('kitchen_token');
  
  const response = await fetch('/api/orders/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ orderId, newStatus })
  });
  
  return response.json();
};
```

## Additional Resources

- [JWT.io](https://jwt.io/) - JWT debugger and documentation
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT specification
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

## Support

For issues with JWT migration:
1. Check error logs for specific JWT verification errors
2. Use [jwt.io](https://jwt.io) to decode and inspect tokens (DO NOT paste production tokens!)
3. Verify `KITCHEN_JWT_SECRET` is set correctly in all environments
4. Ensure system clocks are synchronized (JWT uses timestamps)
