# Firestore Security Rules: Attack Vector Prevention

## Overview

This document explains the security rules in `firestore.rules` and the attack vectors they prevent.

## Common Attack Vectors Prevented

### 1. Unauthenticated Access

**Attack**: Unauthenticated users attempt to read or write data.

**Prevention**:
- All rules require `isAuthenticated()` check
- No public read/write access to any collection
- Users must be logged in via Firebase Auth

**Rules Enforcing**:
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

**Impact**: Prevents unauthorized access to documents, user data, and collaboration state.

---

### 2. Document Enumeration / Information Disclosure

**Attack**: Users attempt to enumerate all documents by guessing document IDs or querying collections.

**Prevention**:
- Documents can only be read if user is explicitly shared (owner, editor, or viewer)
- No collection-level queries without explicit permissions
- Users can only see documents they have access to

**Rules Enforcing**:
```javascript
allow read: if canRead(documentId);
function canRead(documentId) {
  return isAuthenticated() && (
    isOwner(documentId) ||
    hasRole(documentId, 'viewer') ||
    hasRole(documentId, 'editor')
  );
}
```

**Impact**: Users cannot discover documents they're not shared on, preventing information disclosure.

---

### 3. Permission Escalation

**Attack**: Users attempt to grant themselves higher permissions or modify permissions they shouldn't control.

**Prevention**:
- Only owners can create/update permissions
- Users cannot change their own role
- Users can only accept/reject invites (update `isPending`)

**Rules Enforcing**:
```javascript
allow create: if canManagePermissions(documentId);
allow update: if canManagePermissions(documentId) ||
               (isAuthenticated() && 
                request.auth.uid == permissionId &&
                // Only allow updating isPending field
                request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isPending', 'userId']) &&
                // Cannot change role
                request.resource.data.role == resource.data.role);
```

**Impact**: Prevents viewers from becoming editors, editors from becoming owners, and unauthorized permission changes.

---

### 4. Ownership Hijacking

**Attack**: Users attempt to change document ownership or create documents owned by others.

**Prevention**:
- `ownerId` cannot be changed after document creation
- Users can only create documents with themselves as owner
- Ownership transfer requires explicit permission management

**Rules Enforcing**:
```javascript
allow create: if isAuthenticated() && 
                 request.resource.data.ownerId == request.auth.uid;
allow update: if canWrite(documentId) && 
                 request.resource.data.ownerId == resource.data.ownerId; // Cannot change owner
```

**Impact**: Prevents unauthorized ownership transfer and ensures document creators are always owners.

---

### 5. Unauthorized Content Modification

**Attack**: Viewers or unauthorized users attempt to edit document content.

**Prevention**:
- Only owners and editors can write
- Viewers are explicitly denied write access
- Permission checks verify role before allowing updates

**Rules Enforcing**:
```javascript
allow update: if canWrite(documentId);
function canWrite(documentId) {
  return isAuthenticated() && (
    isOwner(documentId) ||
    hasRole(documentId, 'editor')
  );
}
```

**Impact**: Viewers cannot modify content, ensuring read-only access is enforced.

---

### 6. Unauthorized Document Deletion

**Attack**: Editors or viewers attempt to delete documents they shouldn't have permission to delete.

**Prevention**:
- Only owners can delete documents
- Editors and viewers cannot delete

**Rules Enforcing**:
```javascript
allow delete: if isOwner(documentId);
```

**Impact**: Prevents accidental or malicious document deletion by non-owners.

---

### 7. Version History Tampering

**Attack**: Users attempt to modify or delete version history to hide changes.

**Prevention**:
- Versions are immutable (no update/delete allowed)
- Only editors/owners can create versions
- Version numbers must increment

**Rules Enforcing**:
```javascript
allow create: if canWrite(documentId);
allow update, delete: if false; // Versions are immutable
```

**Impact**: Ensures audit trail integrity and prevents historical revision attacks.

---

### 8. Presence Spoofing

**Attack**: Users attempt to impersonate other users' presence or cursor positions.

**Prevention**:
- Users can only update their own presence
- `userId` must match authenticated user
- Cannot create presence entries for other users

**Rules Enforcing**:
```javascript
allow create, update: if isAuthenticated() &&
                         request.auth.uid == userId &&
                         request.resource.data.userId == request.auth.uid;
```

**Impact**: Prevents presence spoofing and ensures accurate collaboration indicators.

---

### 9. Data Structure Manipulation

**Attack**: Users attempt to create malformed documents or bypass validation.

**Prevention**:
- Document structure validation on create
- Required fields enforced
- Type checking for critical fields
- Version number validation

**Rules Enforcing**:
```javascript
function isValidDocument() {
  let data = request.resource.data;
  return data.keys().hasAll(['title', 'ownerId', 'createdAt', 'updatedAt', 'version', 'isArchived']) &&
         data.title is string &&
         data.ownerId is string &&
         data.version is int &&
         data.version == 1;
}
```

**Impact**: Prevents malformed data that could break application logic or cause security issues.

---

### 10. Version Number Manipulation

**Attack**: Users attempt to manipulate version numbers to bypass conflict resolution or hide changes.

**Prevention**:
- Version numbers must increment
- Cannot decrease version number
- Initial version must be 1

**Rules Enforcing**:
```javascript
function isValidDocumentUpdate() {
  return data.version is int &&
         data.version >= existing.version; // Version must increment
}
```

**Impact**: Ensures version numbers are monotonic and prevents version manipulation attacks.

---

### 11. Timestamp Manipulation

**Attack**: Users attempt to manipulate timestamps to affect sorting or hide activity.

**Prevention**:
- `updatedAt` must increase or stay the same
- `createdAt` cannot be changed
- Timestamps are validated on updates

**Rules Enforcing**:
```javascript
function isValidDocumentUpdate() {
  return data.updatedAt is timestamp &&
         data.updatedAt >= existing.updatedAt; // UpdatedAt must increase
}
```

**Impact**: Prevents timestamp manipulation that could affect document ordering or activity tracking.

---

### 12. Profile Impersonation

**Attack**: Users attempt to modify other users' profiles or create profiles with different user IDs.

**Prevention**:
- Users can only create/update their own profile
- `userId` must match authenticated `auth.uid`
- Limited fields can be updated

**Rules Enforcing**:
```javascript
allow create: if isAuthenticated() && 
                 request.auth.uid == userId;
allow update: if isAuthenticated() && 
                 request.auth.uid == userId &&
                 // Only allow specific fields
                 request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'photoURL', 'updatedAt']);
```

**Impact**: Prevents user impersonation and unauthorized profile modifications.

---

### 13. Collection Enumeration

**Attack**: Users attempt to access collections not explicitly defined in security rules.

**Prevention**:
- Explicit deny-all rule for undefined collections
- Only explicitly allowed collections are accessible

**Rules Enforcing**:
```javascript
match /{document=**} {
  allow read, write: if false;
}
```

**Impact**: Prevents access to accidentally created collections or future collections without explicit rules.

---

### 14. Collaboration State Manipulation

**Attack**: Viewers or unauthorized users attempt to modify Y.js collaboration state.

**Prevention**:
- Only editors/owners can write collaboration state
- Read access follows document permissions

**Rules Enforcing**:
```javascript
allow read: if canRead(documentId);
allow write: if canWrite(documentId);
```

**Impact**: Prevents unauthorized manipulation of real-time collaboration state.

---

### 15. Permission Enumeration

**Attack**: Users attempt to enumerate all permissions or see who has access to documents they shouldn't.

**Prevention**:
- Permission read access requires document read access
- Cannot query permissions without document access

**Rules Enforcing**:
```javascript
match /permissions/{permissionId} {
  allow read: if canRead(documentId);
}
```

**Impact**: Limits permission visibility to document collaborators only.

---

## Security Best Practices Implemented

### 1. Principle of Least Privilege
- Users only have the minimum permissions necessary
- Viewers cannot write, editors cannot delete, only owners can manage permissions

### 2. Defense in Depth
- Multiple layers of validation (authentication, authorization, data validation)
- Helper functions ensure consistent checks across rules

### 3. Explicit Deny
- Default deny for undefined collections
- Explicit allow-only model

### 4. Immutability Where Appropriate
- Version history is immutable
- Critical fields like `ownerId` cannot be changed

### 5. Audit Trail Protection
- Version history cannot be modified
- Permission changes are tracked via `grantedBy` and `grantedAt`

### 6. Data Integrity
- Type checking and structure validation
- Version number and timestamp validation
- Required field enforcement

---

## Testing Security Rules

### Recommended Test Cases

1. **Unauthenticated Access**
   - ❌ Unauthenticated user cannot read documents
   - ❌ Unauthenticated user cannot create documents

2. **Document Access**
   - ✅ Owner can read/write/delete their documents
   - ✅ Editor can read/write but not delete
   - ✅ Viewer can read but not write/delete
   - ❌ Unshared user cannot access document

3. **Permission Management**
   - ✅ Owner can grant permissions
   - ❌ Editor cannot grant permissions
   - ❌ User cannot escalate their own role
   - ✅ User can accept/reject invites

4. **Data Integrity**
   - ❌ Cannot change `ownerId` after creation
   - ❌ Cannot decrease version number
   - ❌ Cannot modify version history
   - ✅ Version must increment

5. **Presence**
   - ✅ User can update their own presence
   - ❌ User cannot update others' presence
   - ✅ Only document collaborators can see presence

---

## Additional Security Considerations

### Not Covered by Rules (Handle in Application Code)

1. **Rate Limiting**: Implement in Cloud Functions or application layer
2. **Content Validation**: Validate TipTap content structure in application code
3. **Email Verification**: Verify email addresses before granting permissions
4. **Invite Expiration**: Handle invite expiration in application code
5. **Document Size Limits**: Enforce in application code or Cloud Functions
6. **Spam Prevention**: Implement in application layer
7. **Audit Logging**: Log security events in Cloud Functions

### Recommended Cloud Functions

1. **Cleanup Stale Presence**: Remove presence entries after inactivity
2. **Validate Invites**: Verify email addresses and send invite emails
3. **Audit Logging**: Log permission changes and document modifications
4. **Content Sanitization**: Sanitize document content before storage

---

## Deployment Checklist

- [ ] Review all security rules
- [ ] Test rules with Firebase Emulator
- [ ] Create all required Firestore indexes
- [ ] Set up Cloud Functions for additional security
- [ ] Configure Firebase Auth email verification
- [ ] Set up monitoring and alerting
- [ ] Document any exceptions or custom rules
- [ ] Review and update rules periodically
