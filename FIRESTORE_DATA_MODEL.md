# Firestore Data Model: Real-Time Collaborative Document Editor

## Collection Structure

```
firestore/
├── users/                           # User profiles
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       └── createdAt: timestamp
│
├── documents/                       # Document metadata
│   └── {documentId}/
│       ├── title: string
│       ├── content: string          # Current content (JSON/Y.js state)
│       ├── ownerId: string          # Reference to users/{userId}
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       ├── lastEditedBy: string     # userId of last editor
│       ├── version: number          # Current version number
│       ├── isArchived: boolean
│       └── permissions/             # Subcollection
│           └── {permissionId}/
│               ├── userId: string
│               ├── email: string
│               ├── role: 'owner' | 'editor' | 'viewer'
│               ├── grantedBy: string # userId
│               ├── grantedAt: timestamp
│               └── isPending: boolean # For email invites
│
├── documentVersions/                # Version history
│   └── {documentId}/
│       └── {versionId}/
│           ├── version: number
│           ├── content: string      # Snapshot of content
│           ├── createdAt: timestamp
│           ├── createdBy: string     # userId
│           ├── changeDescription: string
│           └── metadata: map        # Additional version metadata
│
├── presence/                        # Real-time presence tracking
│   └── {documentId}/
│       └── {userId}/
│           ├── userId: string
│           ├── displayName: string
│           ├── email: string
│           ├── cursor: map           # {line: number, ch: number}
│           ├── selection: map       # {from: cursor, to: cursor}
│           ├── isActive: boolean
│           ├── lastSeen: timestamp
│           └── color: string        # User's cursor color
│
└── documentCollaboration/           # Y.js collaboration state (optional)
    └── {documentId}/
        ├── yDocState: bytes         # Y.js document state
        ├── updatedAt: timestamp
        └── version: number
```

## Detailed Schema

### 1. `users` Collection

**Purpose**: User profile information

```json
{
  "userId": "user_abc123",
  "email": "john.doe@example.com",
  "displayName": "John Doe",
  "photoURL": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Fields**:
- `userId` (string): Unique user ID (matches Firebase Auth UID)
- `email` (string): User's email address
- `displayName` (string): User's display name
- `photoURL` (string, optional): Profile picture URL
- `createdAt` (timestamp): Account creation time
- `updatedAt` (timestamp): Last profile update time

---

### 2. `documents` Collection

**Purpose**: Document metadata and current state

```json
{
  "documentId": "doc_xyz789",
  "title": "Project Proposal",
  "content": "{\"type\":\"doc\",\"content\":[...]}",
  "ownerId": "user_abc123",
  "createdAt": "2024-01-20T14:00:00Z",
  "updatedAt": "2024-01-20T16:30:00Z",
  "lastEditedBy": "user_def456",
  "version": 42,
  "isArchived": false,
  "wordCount": 1250,
  "characterCount": 8750,
  "yDocState": null
}
```

**Fields**:
- `documentId` (string): Unique document identifier
- `title` (string): Document title
- `content` (string): Current document content (TipTap JSON or Y.js state)
- `ownerId` (string): Reference to `users/{userId}` - document owner
- `createdAt` (timestamp): Document creation time
- `updatedAt` (timestamp): Last update time
- `lastEditedBy` (string): `userId` of last editor
- `version` (number): Current version number (increments on save)
- `isArchived` (boolean): Whether document is archived
- `wordCount` (number, optional): Cached word count
- `characterCount` (number, optional): Cached character count
- `yDocState` (bytes, optional): Y.js document state snapshot

**Subcollection: `permissions`**

```json
{
  "permissionId": "perm_001",
  "userId": "user_def456",
  "email": "jane.smith@example.com",
  "role": "editor",
  "grantedBy": "user_abc123",
  "grantedAt": "2024-01-20T15:00:00Z",
  "isPending": false
}
```

**Fields**:
- `permissionId` (string): Unique permission identifier
- `userId` (string, nullable): `userId` if user has account, null if email-only invite
- `email` (string): Email address (used for sharing)
- `role` (string): `'owner' | 'editor' | 'viewer'`
- `grantedBy` (string): `userId` who granted permission
- `grantedAt` (timestamp): When permission was granted
- `isPending` (boolean): True if user hasn't accepted invite yet

---

### 3. `documentVersions` Collection

**Purpose**: Version history snapshots

```json
{
  "versionId": "v_001",
  "documentId": "doc_xyz789",
  "version": 42,
  "content": "{\"type\":\"doc\",\"content\":[...]}",
  "createdAt": "2024-01-20T16:30:00Z",
  "createdBy": "user_def456",
  "changeDescription": "Added introduction section",
  "metadata": {
    "wordCount": 1250,
    "characterCount": 8750,
    "changes": {
      "added": 250,
      "deleted": 50
    }
  }
}
```

**Fields**:
- `versionId` (string): Unique version identifier
- `documentId` (string): Reference to parent document
- `version` (number): Version number
- `content` (string): Snapshot of document content at this version
- `createdAt` (timestamp): When version was created
- `createdBy` (string): `userId` who created this version
- `changeDescription` (string, optional): User-provided description
- `metadata` (map, optional): Additional version metadata

**Note**: Consider using Firestore's `limit()` and pagination for version history queries to avoid loading all versions at once.

---

### 4. `presence` Collection

**Purpose**: Real-time presence tracking (who's viewing/editing)

```json
{
  "userId": "user_def456",
  "documentId": "doc_xyz789",
  "displayName": "Jane Smith",
  "email": "jane.smith@example.com",
  "cursor": {
    "line": 15,
    "ch": 42
  },
  "selection": {
    "from": {"line": 15, "ch": 42},
    "to": {"line": 15, "ch": 50}
  },
  "isActive": true,
  "lastSeen": "2024-01-20T16:35:00Z",
  "color": "#FF5733"
}
```

**Fields**:
- `userId` (string): User identifier
- `documentId` (string): Document being viewed/edited
- `displayName` (string): User's display name
- `email` (string): User's email
- `cursor` (map): Current cursor position `{line: number, ch: number}`
- `selection` (map, optional): Selected text range
- `isActive` (boolean): Whether user is actively editing
- `lastSeen` (timestamp): Last activity timestamp
- `color` (string): User's cursor color (for visual distinction)

**Implementation Note**: Use Firestore's `onSnapshot` with `where('isActive', '==', true)` to track active users. Set `isActive: false` when user leaves, and use TTL/cleanup rules to remove stale presence entries.

---

### 5. `documentCollaboration` Collection (Optional)

**Purpose**: Store Y.js collaboration state for offline sync

```json
{
  "documentId": "doc_xyz789",
  "yDocState": "<base64_encoded_bytes>",
  "updatedAt": "2024-01-20T16:35:00Z",
  "version": 42
}
```

**Fields**:
- `documentId` (string): Document identifier
- `yDocState` (bytes): Serialized Y.js document state
- `updatedAt` (timestamp): Last sync time
- `version` (number): Version number matching documents collection

**Note**: This is optional if using Y.js Provider with Firestore. The provider can handle state synchronization directly.

---

## Complete Example Document Structure

### Document with All Related Data

```json
{
  "document": {
    "documentId": "doc_xyz789",
    "title": "Project Proposal",
    "content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Hello World\"}]}]}",
    "ownerId": "user_abc123",
    "createdAt": "2024-01-20T14:00:00Z",
    "updatedAt": "2024-01-20T16:30:00Z",
    "lastEditedBy": "user_def456",
    "version": 42,
    "isArchived": false
  },
  "permissions": [
    {
      "permissionId": "perm_001",
      "userId": "user_abc123",
      "email": "john.doe@example.com",
      "role": "owner",
      "grantedBy": "user_abc123",
      "grantedAt": "2024-01-20T14:00:00Z",
      "isPending": false
    },
    {
      "permissionId": "perm_002",
      "userId": "user_def456",
      "email": "jane.smith@example.com",
      "role": "editor",
      "grantedBy": "user_abc123",
      "grantedAt": "2024-01-20T15:00:00Z",
      "isPending": false
    },
    {
      "permissionId": "perm_003",
      "userId": null,
      "email": "viewer@example.com",
      "role": "viewer",
      "grantedBy": "user_abc123",
      "grantedAt": "2024-01-20T15:30:00Z",
      "isPending": true
    }
  ],
  "presence": [
    {
      "userId": "user_abc123",
      "displayName": "John Doe",
      "email": "john.doe@example.com",
      "cursor": {"line": 5, "ch": 10},
      "isActive": true,
      "lastSeen": "2024-01-20T16:35:00Z",
      "color": "#4285F4"
    },
    {
      "userId": "user_def456",
      "displayName": "Jane Smith",
      "email": "jane.smith@example.com",
      "cursor": {"line": 15, "ch": 42},
      "selection": {
        "from": {"line": 15, "ch": 42},
        "to": {"line": 15, "ch": 50}
      },
      "isActive": true,
      "lastSeen": "2024-01-20T16:35:05Z",
      "color": "#FF5733"
    }
  ],
  "latestVersion": {
    "versionId": "v_001",
    "version": 42,
    "createdAt": "2024-01-20T16:30:00Z",
    "createdBy": "user_def456",
    "changeDescription": "Added introduction section"
  }
}
```

---

## Index Recommendations

### Composite Indexes

#### 1. Documents Collection

```javascript
// Query: Get user's documents (owned or shared), ordered by updatedAt
{
  collection: 'documents',
  fields: [
    { field: 'ownerId', order: 'ASCENDING' },
    { field: 'updatedAt', order: 'DESCENDING' }
  ]
}

// Query: Get documents shared with user (via permissions subcollection)
// Note: This requires a collection group query on 'permissions'
{
  collectionGroup: 'permissions',
  fields: [
    { field: 'userId', order: 'ASCENDING' },
    { field: 'grantedAt', order: 'DESCENDING' }
  ]
}

// Query: Get archived documents for user
{
  collection: 'documents',
  fields: [
    { field: 'ownerId', order: 'ASCENDING' },
    { field: 'isArchived', order: 'ASCENDING' },
    { field: 'updatedAt', order: 'DESCENDING' }
  ]
}
```

#### 2. Document Versions Collection

```javascript
// Query: Get version history for a document, ordered by version
{
  collection: 'documentVersions',
  fields: [
    { field: 'documentId', order: 'ASCENDING' },
    { field: 'version', order: 'DESCENDING' }
  ]
}

// Query: Get versions created by a specific user
{
  collection: 'documentVersions',
  fields: [
    { field: 'createdBy', order: 'ASCENDING' },
    { field: 'createdAt', order: 'DESCENDING' }
  ]
}
```

#### 3. Presence Collection

```javascript
// Query: Get active users for a document
{
  collection: 'presence',
  fields: [
    { field: 'documentId', order: 'ASCENDING' },
    { field: 'isActive', order: 'ASCENDING' },
    { field: 'lastSeen', order: 'DESCENDING' }
  ]
}
```

#### 4. Permissions Subcollection

```javascript
// Query: Get permissions for a document, ordered by role
{
  collection: 'documents/{documentId}/permissions',
  fields: [
    { field: 'role', order: 'ASCENDING' },
    { field: 'grantedAt', order: 'ASCENDING' }
  ]
}

// Collection Group Query: Get all documents shared with a user
{
  collectionGroup: 'permissions',
  fields: [
    { field: 'userId', order: 'ASCENDING' },
    { field: 'role', order: 'ASCENDING' },
    { field: 'grantedAt', order: 'DESCENDING' }
  ]
}
```

### Single-Field Indexes

These are automatically created by Firestore, but ensure they exist:

- `documents.ownerId`
- `documents.createdAt`
- `documents.updatedAt`
- `documents.isArchived`
- `documentVersions.documentId`
- `documentVersions.version`
- `presence.documentId`
- `presence.userId`
- `presence.isActive`

---

## Security-Sensitive Fields

### 🔴 Highly Sensitive (Require Strict Access Control)

#### Documents Collection
- **`content`**: Document content - only editors/owners can read, only editors/owners can write
- **`ownerId`**: Document ownership - critical for permission checks
- **`yDocState`**: Y.js state - same restrictions as content

#### Permissions Subcollection
- **`userId`**: User identifier - sensitive for privacy
- **`email`**: Email address - PII, should be encrypted or access-controlled
- **`role`**: Permission level - critical for access control
- **`grantedBy`**: Who granted permission - audit trail

#### Presence Collection
- **`userId`**: User identifier - privacy concern
- **`email`**: Email address - PII
- **`cursor`**: Cursor position - reveals user activity
- **`selection`**: Selected text - reveals user focus/activity

#### Document Versions Collection
- **`content`**: Version snapshot - same restrictions as document content
- **`createdBy`**: User identifier - audit trail

### 🟡 Moderately Sensitive (Require Access Control)

#### Documents Collection
- **`title`**: Document title - viewers can read, only editors/owners can modify
- **`lastEditedBy`**: Last editor identifier - privacy consideration
- **`updatedAt`**: Update timestamp - reveals activity patterns
- **`version`**: Version number - reveals edit frequency

#### Users Collection
- **`email`**: Email address - PII
- **`displayName`**: Display name - privacy consideration
- **`photoURL`**: Profile picture - privacy consideration

### 🟢 Low Sensitivity (Generally Safe)

#### Documents Collection
- **`createdAt`**: Creation timestamp - generally safe
- **`isArchived`**: Archive status - generally safe
- **`wordCount`**: Word count - metadata, generally safe
- **`characterCount`**: Character count - metadata, generally safe

#### Presence Collection
- **`isActive`**: Active status - generally safe
- **`lastSeen`**: Last seen timestamp - generally safe
- **`color`**: Cursor color - cosmetic, safe

---

## Firestore Security Rules Recommendations

### Example Security Rules Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(documentId) {
      return get(/databases/$(database)/documents/documents/$(documentId)).data.ownerId == request.auth.uid;
    }
    
    function hasPermission(documentId, role) {
      let doc = get(/databases/$(database)/documents/documents/$(documentId));
      return doc.data.ownerId == request.auth.uid ||
             exists(/databases/$(database)/documents/documents/$(documentId)/permissions/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/documents/$(documentId)/permissions/$(request.auth.uid)).data.role == role;
    }
    
    function canRead(documentId) {
      return hasPermission(documentId, 'viewer') ||
             hasPermission(documentId, 'editor') ||
             hasPermission(documentId, 'owner') ||
             isOwner(documentId);
    }
    
    function canWrite(documentId) {
      return hasPermission(documentId, 'editor') ||
             hasPermission(documentId, 'owner') ||
             isOwner(documentId);
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Documents collection
    match /documents/{documentId} {
      // Read: owner, editor, or viewer
      allow read: if isAuthenticated() && canRead(documentId);
      
      // Create: authenticated users only
      allow create: if isAuthenticated() && 
                       request.resource.data.ownerId == request.auth.uid;
      
      // Update: owner or editor only
      allow update: if isAuthenticated() && canWrite(documentId) &&
                       // Prevent ownerId changes
                       request.resource.data.ownerId == resource.data.ownerId;
      
      // Delete: owner only
      allow delete: if isAuthenticated() && isOwner(documentId);
      
      // Permissions subcollection
      match /permissions/{permissionId} {
        allow read: if isAuthenticated() && canRead(documentId);
        allow create: if isAuthenticated() && canWrite(documentId);
        allow update: if isAuthenticated() && canWrite(documentId);
        allow delete: if isAuthenticated() && (canWrite(documentId) || 
                                               request.auth.uid == resource.data.userId);
      }
    }
    
    // Document versions collection
    match /documentVersions/{documentId}/versions/{versionId} {
      allow read: if isAuthenticated() && canRead(documentId);
      allow create: if isAuthenticated() && canWrite(documentId);
      // Versions are immutable - no update/delete
      allow update, delete: if false;
    }
    
    // Presence collection
    match /presence/{documentId}/{userId} {
      allow read: if isAuthenticated() && canRead(documentId);
      allow create, update: if isAuthenticated() && 
                               request.auth.uid == userId &&
                               canRead(documentId);
      allow delete: if isAuthenticated() && 
                       (request.auth.uid == userId || canWrite(documentId));
    }
  }
}
```

---

## Data Access Patterns

### Common Queries

1. **Get user's documents** (owned + shared)
   ```typescript
   // Owned documents
   collection('documents')
     .where('ownerId', '==', userId)
     .orderBy('updatedAt', 'desc')
   
   // Shared documents (via collection group query)
   collectionGroup('permissions')
     .where('userId', '==', userId)
     .where('isPending', '==', false)
   ```

2. **Get document with permissions**
   ```typescript
   doc(`documents/${documentId}`)
   collection(`documents/${documentId}/permissions`)
   ```

3. **Get active users for document**
   ```typescript
   collection('presence')
     .where('documentId', '==', documentId)
     .where('isActive', '==', true)
   ```

4. **Get version history**
   ```typescript
   collection('documentVersions')
     .where('documentId', '==', documentId)
     .orderBy('version', 'desc')
     .limit(50)
   ```

---

## Performance Considerations

1. **Pagination**: Use `limit()` and `startAfter()` for version history and document lists
2. **Caching**: Cache document metadata in client state, only sync content changes
3. **Presence Cleanup**: Use Cloud Functions to clean up stale presence entries (>5 min inactive)
4. **Version Storage**: Consider archiving old versions to Cloud Storage if storage costs become high
5. **Indexes**: Create all recommended composite indexes before deployment
6. **Batch Writes**: Use batch writes when updating document + version simultaneously

---

## Migration Considerations

1. **Version Field**: Add `version: 1` to existing documents
2. **Permissions**: Migrate existing sharing data to permissions subcollection
3. **Presence**: Initialize presence collection structure
4. **Indexes**: Create indexes before enabling queries in production
