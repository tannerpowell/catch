# Authentication Implementation Guide

## ⚠️ CRITICAL SECURITY REQUIREMENT

**The order management system currently has authentication DISABLED.** This is a critical security vulnerability that MUST be addressed before production deployment.

## Current Status

- ✅ Authentication guard structure implemented in `lib/api/orders.ts`
- ✅ State machine validation for order status transitions
- ✅ Rate limiting and input validation
- ⚠️ **Authentication validation is bypassed** when `DISABLE_AUTH_CHECK=true`
- ❌ **No authentication provider configured**

## Security Risk

Without authentication:
- **Anyone** who can access the application can update order statuses
- No audit trail of who made changes
- No role-based access control
- Potential for data corruption and operational disruption
- Compliance and liability issues

## Implementation Steps

### Option 1: NextAuth.js (Recommended for Next.js)

**Best for:** Traditional session-based authentication, flexible provider support

1. **Install dependencies:**
   ```bash
   npm install next-auth
   ```

2. **Create auth configuration** at `app/api/auth/[...nextauth]/route.ts`:
   ```typescript
   import NextAuth, { NextAuthOptions } from 'next-auth';
   import CredentialsProvider from 'next-auth/providers/credentials';
   
   export const authOptions: NextAuthOptions = {
     providers: [
       CredentialsProvider({
         name: 'Credentials',
         credentials: {
           email: { label: "Email", type: "email" },
           password: { label: "Password", type: "password" }
         },
         async authorize(credentials) {
           // Implement your authentication logic here
           // Verify credentials against your database
           const user = await verifyUser(credentials.email, credentials.password);
           
           if (user && user.role === 'kitchen_staff') {
             return {
               id: user.id,
               email: user.email,
               role: user.role,
               locations: user.authorizedLocations
             };
           }
           return null;
         }
       })
     ],
     callbacks: {
       async jwt({ token, user }) {
         if (user) {
           token.role = user.role;
           token.locations = user.locations;
         }
         return token;
       },
       async session({ session, token }) {
         if (session.user) {
           session.user.role = token.role;
           session.user.locations = token.locations;
         }
         return session;
       }
     },
     pages: {
       signIn: '/auth/signin',
     },
     session: {
       strategy: 'jwt',
     }
   };
   
   const handler = NextAuth(authOptions);
   export { handler as GET, handler as POST };
   ```

3. **Update `lib/api/orders.ts`:**
   ```typescript
   import { getServerSession } from 'next-auth/next';
   import { authOptions } from '@/app/api/auth/[...nextauth]/route';
   
   async function validateAuth(): Promise<{ 
     authorized: boolean; 
     error?: string; 
     userId?: string;
     locations?: string[];
   }> {
     const session = await getServerSession(authOptions);
     
     if (!session?.user) {
       return { authorized: false, error: 'Not authenticated' };
     }
     
     if (session.user.role !== 'kitchen_staff') {
       return { authorized: false, error: 'Insufficient permissions' };
     }
     
     return { 
       authorized: true, 
       userId: session.user.id,
       locations: session.user.locations
     };
   }
   ```

4. **Environment variables** (`.env.local`):
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   # Remove or set to false:
   # DISABLE_AUTH_CHECK=false
   ```

### Option 2: Clerk (Simplest Setup)

**Best for:** Quick setup, managed authentication, modern UX

1. **Install Clerk:**
   ```bash
   npm install @clerk/nextjs
   ```

2. **Configure Clerk** in `app/layout.tsx`:
   ```typescript
   import { ClerkProvider } from '@clerk/nextjs';
   
   export default function RootLayout({ children }) {
     return (
       <ClerkProvider>
         <html>
           <body>{children}</body>
         </html>
       </ClerkProvider>
     );
   }
   ```

3. **Update `lib/api/orders.ts`:**
   ```typescript
   import { auth } from '@clerk/nextjs/server';
   
   async function validateAuth(): Promise<{ 
     authorized: boolean; 
     error?: string; 
     userId?: string 
   }> {
     const { userId, sessionClaims } = await auth();
     
     if (!userId) {
       return { authorized: false, error: 'Not authenticated' };
     }
     
     // Check role in Clerk metadata
     const role = sessionClaims?.metadata?.role;
     if (role !== 'kitchen_staff') {
       return { authorized: false, error: 'Insufficient permissions' };
     }
     
     return { authorized: true, userId };
   }
   ```

4. **Environment variables** (`.env.local`):
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   # Remove or set to false:
   # DISABLE_AUTH_CHECK=false
   ```

### Option 3: Custom JWT/Session

**Best for:** Existing authentication system, specific requirements

1. **Create auth utilities** in `lib/auth/`:
   ```typescript
   // lib/auth/jwt.ts
   import jwt from 'jsonwebtoken';
   
   export async function verifyJWT(token: string) {
     try {
       const secret = process.env.KITCHEN_JWT_SECRET;
       if (!secret) {
         throw new Error('KITCHEN_JWT_SECRET not configured');
       }
       
       const payload = jwt.verify(token, secret, {
         algorithms: ['HS256'],
         clockTolerance: 10, // Allow 10 seconds clock skew
       });
       
       return payload;
     } catch (error) {
       console.error('[JWT] Verification failed:', error);
       return null;
     }
   }
   
   export function signJWT(payload: any, expiresIn: string = '24h') {
     const secret = process.env.KITCHEN_JWT_SECRET;
     if (!secret) {
       throw new Error('KITCHEN_JWT_SECRET not configured');
     }
     
     return jwt.sign(payload, secret, {
       algorithm: 'HS256',
       expiresIn,
     });
   }
   ```

2. **Update `lib/api/orders.ts`:**
   ```typescript
   import { cookies } from 'next/headers';
   import { verifyJWT } from '@/lib/auth/jwt';
   
   async function validateAuth(): Promise<{ 
     authorized: boolean; 
     error?: string; 
     userId?: string 
   }> {
     const cookieStore = await cookies();
     const token = cookieStore.get('auth-token')?.value;
     
     if (!token) {
       return { authorized: false, error: 'Not authenticated' };
     }
     
     const payload = await verifyJWT(token);
     
     if (!payload || typeof payload === 'string') {
       return { authorized: false, error: 'Invalid token' };
     }
     
     if (payload.role !== 'kitchen_staff') {
       return { authorized: false, error: 'Unauthorized' };
     }
     
     return { 
       authorized: true, 
       userId: typeof payload.sub === 'string' ? payload.sub : undefined 
     };
   }
   ```

3. **Environment variables** (`.env.local`):
   ```bash
   KITCHEN_JWT_SECRET=$(openssl rand -base64 32)
   ```

## Enhanced Security: Location-Based Authorization

After implementing basic authentication, add location-based access control:

```typescript
async function validateAuth(orderId?: string): Promise<{ 
  authorized: boolean; 
  error?: string; 
  userId?: string 
}> {
  // ... existing authentication logic ...
  
  if (orderId) {
    // Fetch order's location
    const order = await sanityClient.fetch(
      `*[_type == "order" && _id == $orderId][0]{ location }`,
      { orderId }
    );
    
    const orderLocation = await sanityClient.fetch(
      `*[_type == "location" && _id == $locationId][0]{ "slug": slug.current }`,
      { locationId: order.location._ref }
    );
    
    // Check if user is authorized for this location
    const userLocations = session.user.locations; // or from JWT
    if (!userLocations.includes(orderLocation.slug)) {
      return { 
        authorized: false, 
        error: 'Not authorized for this location' 
      };
    }
  }
  
  return { authorized: true, userId: session.user.id };
}
```

## Testing Checklist

Before deploying to production:

- [ ] Authentication provider is fully configured
- [ ] `DISABLE_AUTH_CHECK` is removed or set to `false`
- [ ] Test successful authentication with valid credentials
- [ ] Test rejection of invalid credentials
- [ ] Test rejection of unauthenticated requests
- [ ] Test rejection of authenticated but unauthorized users (wrong role)
- [ ] Test location-based authorization (if implemented)
- [ ] Verify audit logs contain user IDs for all actions
- [ ] Test session timeout and re-authentication flow
- [ ] Load test with authenticated requests
- [ ] Security scan with authenticated endpoints

## Deployment Steps

1. **Choose and implement** one of the authentication options above
2. **Test thoroughly** in development/staging environment
3. **Remove** `DISABLE_AUTH_CHECK=true` from environment variables
4. **Verify** authentication is enforced (attempt unauthorized access)
5. **Monitor** logs for authentication failures
6. **Set up alerts** for suspicious authentication activity
7. **Deploy** to production
8. **Document** the authentication flow for your team

## Audit Logging

The current implementation logs authenticated actions. Enhance with:

```typescript
// After successful auth
await logAuditEvent({
  action: 'order_status_update',
  userId: authResult.userId,
  orderId,
  oldStatus: existingOrder.status,
  newStatus,
  timestamp: new Date().toISOString(),
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent')
});
```

## Support

For questions or issues with authentication implementation:
1. Review the code comments in `lib/api/orders.ts`
2. Consult your chosen auth provider's documentation
3. Test in development first, then staging
4. Monitor logs during initial production rollout

---

**Remember:** Do not deploy to production with `DISABLE_AUTH_CHECK=true`. This bypasses all security checks and exposes your system to unauthorized access.
