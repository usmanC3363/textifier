# Document Dashboard Implementation

## Overview

Complete implementation of a document dashboard with real-time updates, document management, and permission-based access control.

## Features Implemented

### ✅ List Documents
- Shows documents user owns
- Shows documents shared with user
- Real-time updates via Firestore snapshots
- Filter by: All, Owned, Shared, Archived

### ✅ Create Document
- Create new documents with title
- Automatically sets current user as owner
- Navigates to document editor after creation

### ✅ Delete Document
- Owner-only deletion (enforced by security rules)
- Confirmation dialog before deletion
- Loading state during deletion

### ✅ Real-time Updates
- Uses Firestore `onSnapshot` for live updates
- Documents appear/disappear automatically
- Changes reflect immediately across all clients

## File Structure

```
src/
├── features/
│   └── documents/
│       ├── hooks/
│       │   └── useDocuments.ts          # React hooks for documents
│       └── types/
│           └── document.types.ts        # TypeScript types
│
├── lib/
│   └── firestore/
│       ├── queries/
│       │   └── documentQueries.ts       # Firestore query functions
│       └── mutations/
│           └── documentMutations.ts      # Firestore mutation functions
│
└── components/
    └── dashboard/
        ├── DocumentCard.tsx             # Individual document card
        ├── DocumentList.tsx             # Document list container
        └── CreateDocumentDialog.tsx     # Create document modal
```

## Firestore Query Logic

### 1. Owned Documents Query

```typescript
// Query documents where user is owner
query(
  collection(db, 'documents'),
  where('ownerId', '==', userId),
  where('isArchived', '==', false),
  orderBy('updatedAt', 'desc')
)
```

**Real-time**: Uses `onSnapshot` for live updates

### 2. Shared Documents Query

```typescript
// Query permissions collection group
query(
  collectionGroup(db, 'permissions'),
  where('userId', '==', userId),
  where('isPending', '==', false),
  orderBy('grantedAt', 'desc')
)
```

**Challenge**: Collection group queries don't return document data directly. Solution:
1. Query permissions to get document IDs
2. Fetch document data for each ID
3. Combine with permission role information

**Real-time**: Uses `onSnapshot` on permissions, then fetches documents

### 3. Combined Query

The `subscribeToUserDocuments` function combines both queries:
- Subscribes to owned documents
- Subscribes to shared documents
- Merges results with role information
- Provides unified callback with all documents

## React Hooks

### `useDocuments(filter?)`

**Purpose**: Get all documents user has access to with real-time updates

**Returns**:
```typescript
{
  documents: DocumentWithRole[];
  loading: boolean;
  error: Error | null;
}
```

**Usage**:
```typescript
const { documents, loading } = useDocuments({
  isArchived: false,
  role: 'owner',
  searchQuery: 'project'
});
```

**Features**:
- Real-time updates via Firestore snapshots
- Automatic filtering
- Loading and error states

### `useDocument(documentId)`

**Purpose**: Get a single document by ID with real-time updates

**Returns**:
```typescript
{
  document: Document | null;
  loading: boolean;
  error: Error | null;
}
```

### `useDocumentMutations()`

**Purpose**: Document CRUD operations

**Returns**:
```typescript
{
  createDocument: (input) => Promise<string>;
  updateDocument: (id, input) => Promise<void>;
  deleteDocument: (id) => Promise<void>;
  archiveDocument: (id, isArchived) => Promise<void>;
  loading: boolean;
  error: Error | null;
}
```

## Component Breakdown

### 1. `DashboardPage` (Main Component)

**Location**: `src/app/(dashboard)/dashboard/page.tsx`

**Responsibilities**:
- Wraps content with `AuthGuard`
- Manages filter state
- Coordinates document list and mutations
- Handles create/delete/archive actions

**State Management**:
- Filter selection (all/owned/shared/archived)
- Create dialog visibility
- Deleting document IDs (for loading states)

### 2. `DocumentList`

**Location**: `src/components/dashboard/DocumentList.tsx`

**Responsibilities**:
- Renders grid of document cards
- Shows loading state
- Shows empty state
- Passes actions to individual cards

**Props**:
```typescript
{
  documents: DocumentWithRole[];
  onDelete?: (id) => void;
  onArchive?: (id, isArchived) => void;
  deletingIds?: Set<string>;
  loading?: boolean;
}
```

### 3. `DocumentCard`

**Location**: `src/components/dashboard/DocumentCard.tsx`

**Responsibilities**:
- Displays document metadata
- Shows role badge (owner/editor/viewer)
- Handles click to navigate to document
- Shows delete/archive buttons (owner only)
- Displays time ago, word count, version

**Props**:
```typescript
{
  document: DocumentWithRole;
  onDelete?: (id) => void;
  onArchive?: (id, isArchived) => void;
  isDeleting?: boolean;
}
```

### 4. `CreateDocumentDialog`

**Location**: `src/components/dashboard/CreateDocumentDialog.tsx`

**Responsibilities**:
- Modal dialog for creating documents
- Form input for document title
- Submit handler
- Loading state

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  loading?: boolean;
}
```

## Data Flow

### Reading Documents

```
User opens dashboard
  ↓
useDocuments hook initializes
  ↓
subscribeToUserDocuments called
  ↓
Two subscriptions created:
  - subscribeToOwnedDocuments
  - subscribeToSharedDocuments
  ↓
Firestore onSnapshot listeners active
  ↓
Documents update in real-time
  ↓
React re-renders with new data
```

### Creating Documents

```
User clicks "New Document"
  ↓
CreateDocumentDialog opens
  ↓
User enters title and submits
  ↓
handleCreateDocument called
  ↓
createDocument mutation executed
  ↓
Firestore document created
  ↓
Real-time subscription detects change
  ↓
New document appears in list
  ↓
User navigated to document editor
```

### Deleting Documents

```
User clicks delete on DocumentCard
  ↓
Confirmation dialog shown
  ↓
User confirms deletion
  ↓
handleDeleteDocument called
  ↓
deleteDocument mutation executed
  ↓
Firestore document deleted
  ↓
Real-time subscription detects change
  ↓
Document removed from list
```

## Security Considerations

### Owner-Only Deletion

**Enforcement**: 
- Frontend: Only shows delete button for owners
- Backend: Firestore security rules enforce owner-only deletion

**Security Rule**:
```javascript
allow delete: if isOwner(documentId);
```

### Permission-Based Access

**Enforcement**:
- Firestore security rules check permissions before allowing read
- Users can only see documents they own or are shared on

## Performance Optimizations

### 1. Real-time Subscriptions
- Uses Firestore `onSnapshot` for efficient real-time updates
- Automatically handles connection management
- Cleans up subscriptions on unmount

### 2. Filtering
- Client-side filtering for simple filters (archived, role)
- Could be moved to Firestore queries for better performance with large datasets

### 3. Pagination (Future Enhancement)
- Current implementation loads all documents
- Can add pagination using `limit()` and `startAfter()`

### 4. Debouncing (Future Enhancement)
- Search query could be debounced to reduce re-renders

## Usage Example

```tsx
import { useDocuments, useDocumentMutations } from '@/features/documents/hooks/useDocuments';

function MyDashboard() {
  const { documents, loading } = useDocuments({ isArchived: false });
  const { createDocument, deleteDocument } = useDocumentMutations();

  const handleCreate = async () => {
    const id = await createDocument({ title: 'New Document' });
    console.log('Created:', id);
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
  };

  return (
    <div>
      <button onClick={handleCreate}>Create</button>
      {documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <button onClick={() => handleDelete(doc.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Testing Considerations

### Unit Tests
- Test query functions with mock Firestore
- Test hooks with React Testing Library
- Test component rendering and interactions

### Integration Tests
- Test real-time updates
- Test permission-based filtering
- Test create/delete flows

### E2E Tests
- Test full dashboard workflow
- Test real-time collaboration scenarios
- Test permission changes

## Future Enhancements

1. **Search**: Full-text search across document titles and content
2. **Sorting**: Sort by title, date, size
3. **Bulk Actions**: Select multiple documents for bulk operations
4. **Tags/Categories**: Organize documents with tags
5. **Recent Documents**: Show recently viewed documents
6. **Starred Documents**: Favorite documents
7. **Export**: Export document list as CSV/JSON
8. **Keyboard Shortcuts**: Quick actions via keyboard

## Dependencies

- `firebase/firestore` - Firestore SDK
- `date-fns` - Date formatting (for "time ago")
- React hooks for state management

## Notes

- The shared documents query uses collection group queries, which require an index
- Make sure to create the required Firestore indexes before deploying
- Real-time subscriptions automatically handle reconnection
- Document deletion doesn't cascade to subcollections (permissions, versions, presence)
  - Consider Cloud Functions for cleanup
