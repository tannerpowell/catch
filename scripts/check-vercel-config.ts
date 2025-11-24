#!/usr/bin/env tsx

/**
 * Vercel Deployment Configuration Checker
 *
 * Validates that all required configuration is in place for successful Vercel deployments.
 * Run this before pushing to catch issues early.
 *
 * Usage: npx tsx scripts/check-vercel-config.ts
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  fix?: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, passMsg: string, failMsg: string, fix?: string): void {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message: condition ? passMsg : failMsg,
    fix,
  });
}

function warn(name: string, message: string, fix?: string): void {
  results.push({
    name,
    status: 'warn',
    message,
    fix,
  });
}

console.log('🔍 Checking Vercel deployment configuration...\n');

// Check 1: vercel.json exists
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
const vercelJsonExists = fs.existsSync(vercelJsonPath);
check(
  'vercel.json exists',
  vercelJsonExists,
  '✓ vercel.json found',
  '✗ vercel.json not found',
  'Create vercel.json with installCommand: "npm install --legacy-peer-deps"'
);

// Check 2: vercel.json has --legacy-peer-deps
let hasLegacyFlag = false;
if (vercelJsonExists) {
  try {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
    hasLegacyFlag = vercelJson.installCommand?.includes('--legacy-peer-deps') ?? false;
    check(
      '--legacy-peer-deps flag',
      hasLegacyFlag,
      '✓ installCommand includes --legacy-peer-deps',
      '✗ installCommand missing --legacy-peer-deps flag',
      'Update vercel.json: "installCommand": "npm install --legacy-peer-deps"'
    );
  } catch (err) {
    check(
      'vercel.json is valid JSON',
      false,
      '✓ vercel.json is valid JSON',
      '✗ vercel.json could not be parsed as JSON',
      'Fix JSON syntax in vercel.json'
    );
  }
}

// Check 3: .npmrc exists
const npmrcPath = path.join(process.cwd(), '.npmrc');
const npmrcExists = fs.existsSync(npmrcPath);
check(
  '.npmrc exists',
  npmrcExists,
  '✓ .npmrc found',
  '✗ .npmrc not found',
  'Create .npmrc with: legacy-peer-deps=true'
);

// Check 4: .npmrc has legacy-peer-deps
if (npmrcExists) {
  const npmrc = fs.readFileSync(npmrcPath, 'utf-8');
  // Split into lines, ignore comments, match legacy-peer-deps=true
  const lines = npmrc.split('\n').filter(line => !line.trim().startsWith('#'));
  const hasLegacyPeerDeps = lines.some(line => /^\s*legacy-peer-deps\s*=\s*true\s*$/.test(line.trim()));
  check(
    '.npmrc legacy-peer-deps',
    hasLegacyPeerDeps,
    '✓ .npmrc has legacy-peer-deps=true',
    '✗ .npmrc missing legacy-peer-deps=true',
    'Add to .npmrc: legacy-peer-deps=true'
  );
}

// Check 5: .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);
check(
  '.env.local exists',
  envExists,
  '✓ .env.local found',
  '✗ .env.local not found - copy from .env.example'
);

// Check 6: Key environment variables in .env.local
if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'SANITY_WRITE_TOKEN',
  ];

  requiredVars.forEach((varName) => {
    // Split into lines, ignore comments, match VAR_NAME=<value> where value doesn't start with "your-"
    const lines = envContent.split('\n').filter(line => !line.trim().startsWith('#'));
    const varRegex = new RegExp(`^\\s*${varName}\\s*=\\s*(?!your-)(.+)\\s*$`);
    const hasVar = lines.some(line => varRegex.test(line));
    check(
      varName,
      hasVar,
      `✓ ${varName} is set`,
      `✗ ${varName} is missing or has placeholder value`,
      `Set ${varName} in .env.local`
    );
  });
}

// Check 7: package.json has correct Next.js and next-sanity versions
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const nextVersion = packageJson.dependencies?.next;
  const nextSanityVersion = packageJson.dependencies?.['next-sanity'];

  if (nextVersion) {
    const isNext16 = /^[\^~]?16\./.test(nextVersion);
    if (isNext16) {
      const fixMessage = hasLegacyFlag
        ? 'This is expected - vercel.json has --legacy-peer-deps'
        : 'Ensure vercel.json installCommand includes --legacy-peer-deps';
      warn(
        'Next.js version',
        '⚠ Next.js 16 requires --legacy-peer-deps (next-sanity expects v15)',
        fixMessage
      );
    }
  }

  if (nextSanityVersion) {
    const isVersion11 = /^[\^~]?11\./.test(nextSanityVersion);
    if (isVersion11) {
      warn(
        'next-sanity version',
        '⚠ next-sanity@11.x expects Next.js 15 (you have 16)',
        'This is expected - wait for next-sanity to support Next.js 16'
      );
    }
  }
}

// Check 8: VERCEL.md exists (documentation)
const vercelMdPath = path.join(process.cwd(), 'VERCEL.md');
const vercelMdExists = fs.existsSync(vercelMdPath);
check(
  'VERCEL.md documentation',
  vercelMdExists,
  '✓ VERCEL.md found (deployment documentation)',
  '✗ VERCEL.md not found',
  'Create VERCEL.md with deployment notes and credentials'
);

// Print results
console.log('\n' + '='.repeat(60));
console.log('RESULTS');
console.log('='.repeat(60) + '\n');

const passes = results.filter(r => r.status === 'pass').length;
const fails = results.filter(r => r.status === 'fail').length;
const warns = results.filter(r => r.status === 'warn').length;

results.forEach(result => {
  const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
  const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`${color}${icon} ${result.name}${reset}`);
  console.log(`  ${result.message}`);
  if (result.fix && result.status !== 'pass') {
    console.log(`  ${color}→ Fix: ${result.fix}${reset}`);
  }
  console.log();
});

console.log('='.repeat(60));
console.log(`Summary: ${passes} passed, ${fails} failed, ${warns} warnings`);
console.log('='.repeat(60));

if (fails > 0) {
  console.log('\n❌ Configuration has issues that will cause deployment failures!');
  if (vercelMdExists) {
    console.log('📖 See VERCEL.md for detailed troubleshooting\n');
  } else {
    console.log('📖 See project README for troubleshooting guidance\n');
  }
  process.exit(1);
} else if (warns > 0) {
  console.log('\n⚠️  Configuration is valid but has expected warnings');
  console.log('✅ Deployment should succeed with current vercel.json setup\n');
  process.exit(0);
} else {
  console.log('\n✅ All checks passed! Configuration is ready for deployment\n');
  process.exit(0);
}
