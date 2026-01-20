# Firebase Authentication Setup Guide

## Overview

This implementation provides Firebase Authentication with:
- ✅ Email/Password authentication
- ✅ Google OAuth authentication
- ✅ Persistent auth state (survives page refreshes)
- ✅ Auth context provider
- ✅ Protected routes with redirect
- ✅ User data exposure (id, email, displayName)

## File Structure

```
src/
├── lib/
│   └── firebase/
│       ├── config.ts              # Firebase initialization
│       └── auth.ts                # Auth instance export
│
├── features/
│   └── auth/
│       ├── hooks/
│       │   └── useAuth.ts         # useAuth hook export
│       ├── services/
│       │   └── authService.ts     # Auth business logic
│       └── types/
│           └── auth.types.ts      # TypeScript types
│
├── providers/
│   └── AuthProvider.tsx           # Auth context provider
│
└── components/
    └── auth/
        └── AuthGuard.tsx          # Route protection component
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install firebase
# or
yarn add firebase
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note**: If using Next.js, prefix with `NEXT_PUBLIC_` instead of `VITE_`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# ... etc
```

### 3. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Authentication:
   - Go to **Authentication** > **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** (configure OAuth consent screen)

### 4. Configure Path Aliases (if needed)

If your project uses path aliases (`@/`), ensure your `tsconfig.json` or `vite.config.ts` includes:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

For Vite, add to `vite.config.ts`:
```typescript
import path from 'path';

export default {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};
```

## Usage

### 1. Wrap App with AuthProvider

```tsx
// src/app/layout.tsx or src/main.tsx
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Protect Routes with AuthGuard

**Next.js:**
```tsx
// src/app/dashboard/page.tsx
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardPage() {
  const router = useRouter();
  
  return (
    <AuthGuard onRedirect={(path) => router.push(path)}>
      <DashboardContent />
    </AuthGuard>
  );
}
```

**React Router:**
```tsx
// src/pages/Dashboard.tsx
import { useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';

export function DashboardPage() {
  const navigate = useNavigate();
  
  return (
    <AuthGuard onRedirect={(path) => navigate(path)}>
      <DashboardContent />
    </AuthGuard>
  );
}
```

### 3. Use Auth Hook in Components

```tsx
import { useAuth } from '@/features/auth/hooks/useAuth';

function MyComponent() {
  const { user, signOut, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Name: {user.displayName}</p>
      <p>ID: {user.uid}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 4. Sign Up Example

**Next.js:**
```tsx
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signUp({
        email: 'user@example.com',
        password: 'password123',
        displayName: 'John Doe',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**React Router:**
```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

function SignUpForm() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signUp({
        email: 'user@example.com',
        password: 'password123',
        displayName: 'John Doe',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 5. Sign In Examples

**Email/Password (Next.js):**
```tsx
import { useRouter } from 'next/navigation';
const router = useRouter();
const { signIn } = useAuth();

await signIn({
  email: 'user@example.com',
  password: 'password123',
});
router.push('/dashboard');
```

**Email/Password (React Router):**
```tsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
const { signIn } = useAuth();

await signIn({
  email: 'user@example.com',
  password: 'password123',
});
navigate('/dashboard');
```

**Google OAuth:**
```tsx
// Next.js
import { useRouter } from 'next/navigation';
const router = useRouter();
const { signInWithGoogle } = useAuth();
await signInWithGoogle();
router.push('/dashboard');

// React Router
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
const { signInWithGoogle } = useAuth();
await signInWithGoogle();
navigate('/dashboard');
```

## API Reference

### useAuth Hook

Returns an object with:

```typescript
{
  user: AuthUser | null;           // Current user (null if not authenticated)
  loading: boolean;                 // Auth state loading status
  error: Error | null;              // Auth error (if any)
  signUp: (credentials) => Promise<void>;
  signIn: (credentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name) => Promise<void>;
}
```

### AuthUser Type

```typescript
{
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
```

### AuthGuard Component

```tsx
<AuthGuard redirectTo="/login">
  <ProtectedContent />
</AuthGuard>
```

**Props:**
- `children`: React node to render when authenticated
- `redirectTo`: Route to redirect to when unauthenticated (default: `/login`)

## Features

### ✅ Persistent Auth State

Auth state persists across page refreshes using Firebase's `onAuthStateChanged` listener. The user remains logged in until they explicitly sign out.

### ✅ Automatic Redirect

`AuthGuard` automatically redirects unauthenticated users to the login page.

### ✅ User Data Exposure

The `useAuth` hook exposes:
- `user.uid` - User ID
- `user.email` - User email
- `user.displayName` - Display name
- `user.photoURL` - Profile photo URL (for Google OAuth)

### ✅ Error Handling

All auth methods throw errors that can be caught and handled:

```tsx
try {
  await signIn({ email, password });
} catch (error) {
  // Handle error (e.g., wrong password, user not found)
  console.error(error.message);
}
```

### ✅ Loading States

The `loading` state indicates when auth operations are in progress:

```tsx
const { loading } = useAuth();

if (loading) {
  return <Spinner />;
}
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Password Validation**: Implement client-side password validation (min length, complexity)
3. **Email Verification**: Consider adding email verification flow
4. **Rate Limiting**: Firebase handles basic rate limiting, but consider additional protection
5. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### "useAuth must be used within an AuthProvider"

**Solution**: Wrap your app with `<AuthProvider>` in the root layout.

### "Firebase: Error (auth/configuration-not-found)"

**Solution**: Check that environment variables are correctly set and prefixed with `VITE_` (or `NEXT_PUBLIC_` for Next.js).

### Google Sign-In Popup Blocked

**Solution**: Ensure popups are not blocked in browser settings. Consider using redirect flow instead of popup.

### Auth State Not Persisting

**Solution**: Ensure Firebase Auth persistence is enabled (it's enabled by default). Check browser localStorage is not disabled.

## Next Steps

- Add email verification flow
- Add password reset functionality
- Add profile editing
- Add account deletion
- Implement remember me functionality
- Add social auth providers (GitHub, Twitter, etc.)
