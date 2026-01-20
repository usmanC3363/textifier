# Dashboard Quick Start Guide

## Installation

No additional dependencies required beyond Firebase. The date utility is included.

## Quick Usage

### 1. Use the Dashboard Page

The dashboard page is ready to use at `/dashboard`:

```tsx
// Already implemented in src/app/(dashboard)/dashboard/page.tsx
// Just navigate to /dashboard
```

### 2. Use Hooks in Your Components

```tsx
import { useDocuments, useDocumentMutations } from '@/features/documents/hooks/useDocuments';

function MyComponent() {
  // Get all documents with real-time updates
  const { documents, loading } = useDocuments();
  
  // Get mutation functions
  const { createDocument, deleteDocument } = useDocumentMutations();
  
  // Create a document
  const handleCreate = async () => {
    const id = await createDocument({ title: 'My Document' });
    console.log('Created:', id);
  };
  
  // Delete a document
  const handleDelete = async (id: string) => {
    await deleteDocument(id);
  };
  
  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          {doc.isOwner && (
            <button onClick={() => handleDelete(doc.id)}>Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 3. Filter Documents

```tsx
// Get only owned documents
const { documents } = useDocuments({ role: 'owner' });

// Get only archived documents
const { documents } = useDocuments({ isArchived: true });

// Search documents
const { documents } = useDocuments({ searchQuery: 'project' });
```

### 4. Use Individual Components

```tsx
import { DocumentList } from '@/components/dashboard/DocumentList';
import { CreateDocumentDialog } from '@/components/dashboard/CreateDocumentDialog';

function MyDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const { documents } = useDocuments();
  const { createDocument, deleteDocument } = useDocumentMutations();
  
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Create Document</button>
      <DocumentList
        documents={documents}
        onDelete={deleteDocument}
      />
      <CreateDocumentDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreate={createDocument}
      />
    </div>
  );
}
```

## Key Features

### ✅ Real-time Updates
Documents update automatically when:
- New documents are created
- Documents are deleted
- Documents are modified
- Permissions change

### ✅ Permission-Based Access
- Only shows documents user owns or has access to
- Role badges (owner/editor/viewer)
- Owner-only actions (delete, archive)

### ✅ Efficient Queries
- Uses Firestore snapshots for real-time updates
- Combines owned and shared document queries
- Client-side filtering for performance

## Firestore Indexes Required

Make sure to create these indexes in Firebase Console:

1. **Collection Group Index** (for shared documents):
   - Collection: `permissions`
   - Fields: `userId` (Ascending), `isPending` (Ascending), `grantedAt` (Descending)

2. **Documents Collection Index**:
   - Collection: `documents`
   - Fields: `ownerId` (Ascending), `isArchived` (Ascending), `updatedAt` (Descending)

Firebase will prompt you to create these when you run queries that need them.

## Component API

### `useDocuments(filter?)`

**Parameters:**
```typescript
{
  isArchived?: boolean;      // Filter by archived status
  role?: 'owner' | 'editor' | 'viewer';  // Filter by role
  searchQuery?: string;      // Search in document titles
}
```

**Returns:**
```typescript
{
  documents: DocumentWithRole[];
  loading: boolean;
  error: Error | null;
}
```

### `useDocumentMutations()`

**Returns:**
```typescript
{
  createDocument: (input: CreateDocumentInput) => Promise<string>;
  updateDocument: (id: string, input: UpdateDocumentInput) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  archiveDocument: (id: string, isArchived: boolean) => Promise<void>;
  loading: boolean;
  error: Error | null;
}
```

## Data Flow

```
User Action
  ↓
Hook calls mutation
  ↓
Firestore updates
  ↓
Real-time subscription detects change
  ↓
Hook updates state
  ↓
Component re-renders
```

## Troubleshooting

### Documents not updating in real-time
- Check Firestore security rules allow read access
- Verify user is authenticated
- Check browser console for errors

### Shared documents not appearing
- Verify permissions subcollection exists
- Check `userId` matches authenticated user
- Ensure `isPending` is false
- Create collection group index for permissions

### Delete button not showing
- Only owners see delete button
- Check `document.isOwner` is true
- Verify Firestore security rules allow deletion

## Next Steps

1. Set up Firestore indexes
2. Test with multiple users
3. Add search functionality
4. Add sorting options
5. Add pagination for large document lists
