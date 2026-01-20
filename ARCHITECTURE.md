# Project Architecture: Real-Time Document Editor

## 1. Folder Tree Structure

```
textifier/
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── images/
│
├── src/
│   ├── app/                          # Next.js App Router (if using) or React Router pages
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (editor)/
│   │   │   ├── document/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── dashboard/
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── CreateDocumentDialog.tsx
│   │   │   └── ShareDialog.tsx
│   │   ├── editor/
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── EditorMenu.tsx
│   │   │   ├── PresenceIndicator.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   └── EditorContainer.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Navigation.tsx
│   │
│   ├── features/                     # Feature-based modules
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useAuthState.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── hooks/
│   │   │   │   ├── useDocuments.ts
│   │   │   │   ├── useDocument.ts
│   │   │   │   └── useDocumentPermissions.ts
│   │   │   ├── services/
│   │   │   │   └── documentService.ts
│   │   │   └── types/
│   │   │       └── document.types.ts
│   │   │
│   │   ├── editor/
│   │   │   ├── hooks/
│   │   │   │   ├── useEditor.ts
│   │   │   │   ├── useCollaboration.ts
│   │   │   │   └── useEditorState.ts
│   │   │   ├── services/
│   │   │   │   ├── editorService.ts
│   │   │   │   └── yjsService.ts
│   │   │   ├── extensions/
│   │   │   │   ├── collaboration.ts
│   │   │   │   ├── customNodes.ts
│   │   │   │   └── plugins.ts
│   │   │   └── types/
│   │   │       └── editor.types.ts
│   │   │
│   │   ├── presence/
│   │   │   ├── hooks/
│   │   │   │   ├── usePresence.ts
│   │   │   │   └── usePresenceList.ts
│   │   │   ├── services/
│   │   │   │   └── presenceService.ts
│   │   │   └── types/
│   │   │       └── presence.types.ts
│   │   │
│   │   └── sharing/
│   │       ├── hooks/
│   │       │   ├── useSharing.ts
│   │       │   └── usePermissions.ts
│   │       ├── services/
│   │       │   └── sharingService.ts
│   │       └── types/
│   │           └── sharing.types.ts
│   │
│   ├── lib/                          # Core libraries & utilities
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   └── firestore.ts
│   │   ├── firestore/
│   │   │   ├── collections/
│   │   │   │   ├── documents.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── permissions.ts
│   │   │   │   └── presence.ts
│   │   │   ├── queries/
│   │   │   │   ├── documentQueries.ts
│   │   │   │   ├── permissionQueries.ts
│   │   │   │   └── presenceQueries.ts
│   │   │   ├── mutations/
│   │   │   │   ├── documentMutations.ts
│   │   │   │   ├── permissionMutations.ts
│   │   │   │   └── presenceMutations.ts
│   │   │   └── subscriptions/
│   │   │       ├── documentSubscriptions.ts
│   │   │       └── presenceSubscriptions.ts
│   │   ├── tiptap/
│   │   │   ├── extensions.ts
│   │   │   ├── config.ts
│   │   │   └── utils.ts
│   │   ├── yjs/                       # Y.js for CRDT collaboration
│   │   │   ├── provider.ts
│   │   │   └── sync.ts
│   │   ├── utils/
│   │   │   ├── cn.ts                  # className utility
│   │   │   ├── date.ts
│   │   │   ├── validation.ts
│   │   │   └── errors.ts
│   │   └── constants/
│   │       ├── routes.ts
│   │       ├── permissions.ts
│   │       └── config.ts
│   │
│   ├── hooks/                        # Global shared hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useErrorBoundary.ts
│   │
│   ├── store/                        # Global state management (Zustand/Redux)
│   │   ├── authStore.ts
│   │   ├── documentStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/                        # Global TypeScript types
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── document.ts
│   │   └── api.ts
│   │
│   ├── styles/                       # Global styles
│   │   ├── globals.css
│   │   └── themes.css
│   │
│   ├── middleware/                   # Route middleware (if using Next.js)
│   │   └── auth.ts
│   │
│   ├── providers/                     # React context providers
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   └── main.tsx                      # App entry point
│
├── .env.local                        # Environment variables
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts                    # or next.config.js
└── README.md
```

## 2. Folder Responsibilities

### `/src/app/`
**Purpose**: Page-level components and routing structure
- Contains route definitions and page components
- Handles layout composition
- Should be thin - delegates logic to features/services
- Route groups `(auth)`, `(dashboard)`, `(editor)` organize protected routes

### `/src/components/`
**Purpose**: Reusable, presentational UI components
- **`ui/`**: shadcn/ui base components (buttons, inputs, dialogs)
- **`auth/`**: Authentication-specific UI components
- **`dashboard/`**: Document list and management UI
- **`editor/`**: Editor-specific UI (toolbar, menus, presence indicators)
- **`layout/`**: Shared layout components (header, sidebar, nav)
- **Rule**: Components should be presentational - minimal business logic

### `/src/features/`
**Purpose**: Feature-based modules containing all related code
- Each feature is self-contained with its own hooks, services, and types
- **`auth/`**: Authentication logic, hooks, and services
- **`documents/`**: Document CRUD operations and queries
- **`editor/`**: TipTap editor configuration, collaboration logic, extensions
- **`presence/`**: Real-time presence tracking (who's viewing/editing)
- **`sharing/`**: Permission management and sharing functionality
- **Rule**: Features should be independent and loosely coupled

### `/src/lib/`
**Purpose**: Core infrastructure and third-party integrations
- **`firebase/`**: Firebase initialization and configuration
- **`firestore/`**: Firestore access layer (collections, queries, mutations, subscriptions)
- **`tiptap/`**: TipTap editor configuration and extensions
- **`yjs/`**: Y.js CRDT provider for real-time collaboration
- **`utils/`**: Pure utility functions (no side effects)
- **`constants/`**: Application constants and configuration
- **Rule**: Should contain no React components or hooks

### `/src/hooks/`
**Purpose**: Global, reusable React hooks
- Shared hooks used across multiple features
- Examples: debouncing, localStorage, error boundaries
- **Rule**: Should be generic and feature-agnostic

### `/src/store/`
**Purpose**: Global application state
- Client-side state management (Zustand, Redux, or Context)
- Stores: auth state, document cache, UI state
- **Rule**: Use sparingly - prefer feature-local state when possible

### `/src/types/`
**Purpose**: Global TypeScript type definitions
- Shared types used across multiple features
- Feature-specific types should live in `/features/[feature]/types/`

### `/src/providers/`
**Purpose**: React context providers for app-wide concerns
- AuthProvider: Manages authentication context
- ThemeProvider: Theme management
- ErrorBoundary: Global error handling

### `/src/middleware/`
**Purpose**: Route-level middleware (if using Next.js)
- Authentication guards
- Permission checks
- Redirects

## 3. Client-Only Files

All files in this project are **client-only** because:
- React 19.1.4 is a client-side framework
- Firebase Auth & Firestore require client-side SDK
- TipTap editor runs in the browser
- Y.js collaboration requires WebSocket connections

**However, if using Next.js App Router**, mark these as client components:
- All files in `/src/components/` → Add `"use client"` directive
- All files in `/src/features/*/hooks/` → Add `"use client"` directive
- All files in `/src/providers/` → Add `"use client"` directive
- All page files that use hooks or Firebase → Add `"use client"` directive

**Files that MUST be client-only:**
```
src/components/**/*.tsx          # All React components
src/features/**/hooks/**/*.ts   # All React hooks
src/providers/**/*.tsx          # All context providers
src/lib/firebase/**/*.ts        # Firebase client SDK
src/lib/yjs/**/*.ts             # Y.js WebSocket provider
src/lib/tiptap/**/*.ts          # TipTap editor (browser-only)
```

## 4. Logic That Should NEVER Live in Components

### ❌ Business Logic
- **Firestore queries/mutations** → Move to `/lib/firestore/queries/` or `/lib/firestore/mutations/`
- **Authentication flows** → Move to `/features/auth/services/authService.ts`
- **Permission checks** → Move to `/features/sharing/services/sharingService.ts`
- **Document CRUD operations** → Move to `/features/documents/services/documentService.ts`

### ❌ Data Transformation
- **Complex data mapping** → Move to utility functions in `/lib/utils/`
- **Validation logic** → Move to `/lib/utils/validation.ts`
- **Date formatting** → Move to `/lib/utils/date.ts`

### ❌ State Management Logic
- **Complex state calculations** → Move to custom hooks in `/features/[feature]/hooks/`
- **Cross-feature state coordination** → Move to `/src/store/` or context providers

### ❌ API Calls
- **Direct Firestore calls** → Move to `/lib/firestore/` access layer
- **Firebase Auth calls** → Move to `/features/auth/services/authService.ts`

### ❌ Side Effects
- **LocalStorage operations** → Move to custom hooks (`useLocalStorage.ts`)
- **Analytics tracking** → Move to service layer
- **Error logging** → Move to error boundary or service

### ❌ Configuration
- **TipTap extensions setup** → Move to `/lib/tiptap/extensions.ts`
- **Firebase config** → Move to `/lib/firebase/config.ts`
- **Y.js provider setup** → Move to `/lib/yjs/provider.ts`

### ✅ What Components SHOULD Do
- Render UI based on props/state
- Handle user interactions (clicks, inputs)
- Call hooks/services (delegate to business logic)
- Compose smaller components
- Manage local UI state (isOpen, isLoading, etc.)

## Example: Correct Separation

### ❌ Bad (Logic in Component)
```tsx
// components/dashboard/DocumentList.tsx
export function DocumentList() {
  const [docs, setDocs] = useState([]);
  
  useEffect(() => {
    // ❌ Direct Firestore call in component
    const unsubscribe = onSnapshot(
      collection(db, 'documents'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: formatDate(doc.data().createdAt) // ❌ Transformation in component
        }));
        setDocs(data);
      }
    );
    return unsubscribe;
  }, []);
  
  // ❌ Permission check in component
  const canEdit = user.role === 'admin' || doc.permissions.includes(user.id);
  
  return <div>...</div>;
}
```

### ✅ Good (Logic Separated)
```tsx
// components/dashboard/DocumentList.tsx
export function DocumentList() {
  const { documents, isLoading } = useDocuments(); // ✅ Hook handles logic
  const { canEdit } = useDocumentPermissions();    // ✅ Permission hook
  
  return <div>...</div>;
}

// features/documents/hooks/useDocuments.ts
export function useDocuments() {
  const { data, isLoading } = useDocumentQuery(); // ✅ Query hook
  return { documents: data, isLoading };
}

// lib/firestore/queries/documentQueries.ts
export function useDocumentQuery() {
  return useFirestoreQuery(
    collection(db, 'documents'),
    { transform: transformDocument } // ✅ Transformation in query layer
  );
}
```

## Key Principles

1. **Separation of Concerns**: Components = UI, Services = Logic, Hooks = State
2. **Feature-Based Organization**: Related code lives together
3. **Access Layer Pattern**: All Firestore access goes through `/lib/firestore/`
4. **Single Responsibility**: Each file/function does one thing
5. **Testability**: Business logic is isolated and easily testable
6. **Scalability**: Easy to add new features without touching existing code
