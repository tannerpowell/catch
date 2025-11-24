#!/usr/bin/env tsx
/**
 * Generate JWT Token for Kitchen Staff
 * 
 * This script generates signed JWT tokens for kitchen staff authentication.
 * Use this to create tokens for your kitchen staff management system.
 * 
 * Usage:
 *   npm run generate:jwt -- --userId=user123 --locations=post-oak,conroe --role=kitchen_staff
 *   
 * Or with tsx directly:
 *   tsx scripts/generate-kitchen-jwt.ts --userId=user123 --locations=post-oak,conroe
 * 
 * Arguments:
 *   --userId=<id>       User ID (required)
 *   --locations=<list>  Comma-separated location slugs (required)
 *   --role=<role>       User role: kitchen_staff or admin (default: kitchen_staff)
 *   --expiresIn=<time>  Token expiration (default: 24h)
 *                       Examples: 1h, 7d, 30d, 90d
 */

import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TokenOptions {
  userId: string;
  locations: string[];
  role: 'kitchen_staff' | 'admin';
  expiresIn: string;
}

function parseArgs(): TokenOptions | null {
  const args = process.argv.slice(2);
  const options: Partial<TokenOptions> = {
    role: 'kitchen_staff',
    expiresIn: '24h',
  };

  for (const arg of args) {
    if (arg.startsWith('--userId=')) {
      options.userId = arg.substring('--userId='.length);
    } else if (arg.startsWith('--locations=')) {
      const locationStr = arg.substring('--locations='.length);
      options.locations = locationStr.split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--role=')) {
      const role = arg.substring('--role='.length);
      if (role !== 'kitchen_staff' && role !== 'admin') {
        console.error(`❌ Invalid role: ${role}. Must be 'kitchen_staff' or 'admin'`);
        return null;
      }
      options.role = role as 'kitchen_staff' | 'admin';
    } else if (arg.startsWith('--expiresIn=')) {
      options.expiresIn = arg.substring('--expiresIn='.length);
    } else if (arg === '--help' || arg === '-h') {
      return null;
    }
  }

  if (!options.userId) {
    console.error('❌ Missing required argument: --userId');
    return null;
  }

  if (!options.locations || options.locations.length === 0) {
    console.error('❌ Missing required argument: --locations');
    return null;
  }

  return options as TokenOptions;
}

function printUsage() {
  console.log(`
JWT Token Generator for Kitchen Staff Authentication

Usage:
  tsx scripts/generate-kitchen-jwt.ts [options]

Required Arguments:
  --userId=<id>           User ID (e.g., user123, jane.doe@thecatch.com)
  --locations=<list>      Comma-separated location slugs
                          Examples: post-oak,conroe,woodlands

Optional Arguments:
  --role=<role>           User role (default: kitchen_staff)
                          Options: kitchen_staff, admin
  
  --expiresIn=<time>      Token expiration (default: 24h)
                          Examples: 1h, 7d, 30d, 90d

Examples:
  # Generate token for kitchen staff at Post Oak and Conroe (expires in 24 hours)
  tsx scripts/generate-kitchen-jwt.ts \\
    --userId=jane.doe@thecatch.com \\
    --locations=post-oak,conroe

  # Generate admin token for all locations (expires in 7 days)
  tsx scripts/generate-kitchen-jwt.ts \\
    --userId=admin@thecatch.com \\
    --locations=post-oak,conroe,woodlands,downtown,denton,fort-worth,san-antonio \\
    --role=admin \\
    --expiresIn=7d

  # Generate token that expires in 1 hour
  tsx scripts/generate-kitchen-jwt.ts \\
    --userId=temp.user@thecatch.com \\
    --locations=post-oak \\
    --expiresIn=1h

Available Location Slugs:
  - post-oak
  - conroe  
  - woodlands
  - downtown (Houston)
  - denton
  - fort-worth
  - san-antonio

Environment:
  Requires KITCHEN_JWT_SECRET in .env.local
  Generate secret with: openssl rand -base64 32
`);
}

function generateToken(options: TokenOptions): string {
  const jwtSecret = process.env.KITCHEN_JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      'KITCHEN_JWT_SECRET not found in environment.\n' +
      'Add it to .env.local: KITCHEN_JWT_SECRET=your-secret-here\n' +
      'Generate with: openssl rand -base64 32'
    );
  }

  const payload = {
    sub: options.userId,
    locations: options.locations,
    role: options.role,
  };

  const token = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: options.expiresIn,
  });

  return token;
}

function decodeToken(token: string) {
  const decoded = jwt.decode(token, { complete: true });
  return decoded;
}

async function main() {
  console.log('🔐 Kitchen Staff JWT Token Generator\n');

  const options = parseArgs();
  
  if (!options) {
    printUsage();
    process.exit(1);
  }

  try {
    // Generate token
    const token = generateToken(options);
    
    // Decode to show details
    const decoded = decodeToken(token);
    
    if (!decoded) {
      throw new Error('Failed to decode generated token');
    }

    const payload = decoded.payload as any;
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
    const issuedAt = payload.iat ? new Date(payload.iat * 1000) : null;

    console.log('✅ Token generated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TOKEN DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`User ID:       ${payload.sub}`);
    console.log(`Role:          ${payload.role}`);
    console.log(`Locations:     ${payload.locations.join(', ')}`);
    console.log(`Issued At:     ${issuedAt?.toISOString() || 'N/A'}`);
    console.log(`Expires At:    ${expiresAt?.toISOString() || 'Never'}`);
    if (expiresAt) {
      const hoursUntilExpiry = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
      console.log(`Valid For:     ${hoursUntilExpiry} hours`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🎫 JWT TOKEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 USAGE INSTRUCTIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Include this token in the Authorization header:');
    console.log('');
    console.log(`  Authorization: Bearer ${token.substring(0, 40)}...`);
    console.log('');
    console.log('Example API call:');
    console.log('');
    console.log('  curl -X POST https://your-site.com/api/orders/update-status \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log(`    -H "Authorization: Bearer ${token}" \\`);
    console.log('    -d \'{"orderId": "order123", "newStatus": "preparing"}\'');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  SECURITY REMINDERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Keep this token secret - treat it like a password');
    console.log('• Do not commit tokens to version control');
    console.log('• Store in secure environment variables or secrets manager');
    console.log('• Use HTTPS only in production');
    console.log('• Rotate tokens regularly');
    console.log('• Revoke tokens for former employees immediately');
    if (expiresAt) {
      console.log(`• This token expires on ${expiresAt.toLocaleDateString()} - regenerate before expiry`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error generating token:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
