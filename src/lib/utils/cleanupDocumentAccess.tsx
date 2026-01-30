// src/lib/utils/cleanupAllDocuments.ts
// Run this ONCE to fix all documents in your Firestore

import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteField,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface CleanupResult {
  documentId: string;
  title: string;
  invalidKeysRemoved: string[];
  success: boolean;
  error?: string;
}

/**
 * Check if a key looks like a user ID (invalid)
 */
function isUserIdKey(key: string): boolean {
  // User IDs are typically 28 chars, alphanumeric, no underscores
  // Valid email keys have underscores (from dots being replaced)
  return key.length > 20 && !key.includes('_') && /^[a-zA-Z0-9]+$/.test(key);
}

/**
 * Check if a key looks like a broken email (has nested 'com')
 */
function isBrokenEmailKey(key: string): boolean {
  // Keys like "demon@dev" (without _com) are broken
  return key.includes('@') && !key.includes('_');
}

/**
 * Clean up a single document
 */
export async function cleanupSingleDocument(documentId: string): Promise<CleanupResult> {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        documentId,
        title: 'Not Found',
        invalidKeysRemoved: [],
        success: false,
        error: 'Document not found',
      };
    }
    
    const docData = docSnap.data();
    const access = docData.access || {};
    const updates: Record<string, any> = {};
    const invalidKeys: string[] = [];
    
    // Find all invalid keys
    Object.keys(access).forEach(key => {
      const isInvalid = isUserIdKey(key) || isBrokenEmailKey(key);
      
      if (isInvalid) {
        console.log(`  🗑️  Removing invalid key: "${key}" from ${docData.title}`);
        updates[`access.${key}`] = deleteField();
        invalidKeys.push(key);
      }
    });
    
    // Apply updates if needed
    if (invalidKeys.length > 0) {
      await updateDoc(docRef, updates);
      console.log(`  ✅ Cleaned ${invalidKeys.length} invalid entries from "${docData.title}"`);
    } else {
      console.log(`  ✨ No cleanup needed for "${docData.title}"`);
    }
    
    return {
      documentId,
      title: docData.title || 'Untitled',
      invalidKeysRemoved: invalidKeys,
      success: true,
    };
  } catch (error) {
    console.error(`  ❌ Error cleaning document ${documentId}:`, error);
    return {
      documentId,
      title: 'Error',
      invalidKeysRemoved: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clean up ALL documents in your Firestore
 */
export async function cleanupAllDocuments(): Promise<{
  total: number;
  cleaned: number;
  failed: number;
  results: CleanupResult[];
}> {
  console.log('🧹 Starting cleanup of all documents...');
  
  try {
    // Get all documents
    const docsSnapshot = await getDocs(collection(db, 'documents'));
    console.log(`Found ${docsSnapshot.size} documents to check`);
    
    const results: CleanupResult[] = [];
    let cleanedCount = 0;
    let failedCount = 0;
    
    // Clean each document
    for (const docSnap of docsSnapshot.docs) {
      const result = await cleanupSingleDocument(docSnap.id);
      results.push(result);
      
      if (result.success && result.invalidKeysRemoved.length > 0) {
        cleanedCount++;
      } else if (!result.success) {
        failedCount++;
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Total documents: ${docsSnapshot.size}`);
    console.log(`  Documents cleaned: ${cleanedCount}`);
    console.log(`  Documents failed: ${failedCount}`);
    console.log(`  No cleanup needed: ${docsSnapshot.size - cleanedCount - failedCount}`);
    
    return {
      total: docsSnapshot.size,
      cleaned: cleanedCount,
      failed: failedCount,
      results,
    };
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    throw error;
  }
}

/**
 * React component to trigger cleanup
 * Add this temporarily to your settings or dashboard
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CleanupAllButton() {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleCleanup = async () => {
    if (!confirm('This will clean up ALL documents. Continue?')) {
      return;
    }

    setCleaning(true);
    setResult('Cleaning...');
    
    try {
      const results = await cleanupAllDocuments();
      setResult(
        `✅ Cleanup complete!\n` +
        `Total: ${results.total} documents\n` +
        `Cleaned: ${results.cleaned} documents\n` +
        `Failed: ${results.failed} documents`
      );
      
      // Reload after 3 seconds
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-2 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔧</span>
        <div>
          <p className="text-sm font-medium">Developer Tools - Cleanup</p>
          <p className="text-xs text-muted-foreground">
            Remove invalid access entries from ALL documents
          </p>
        </div>
      </div>
      
      <Button
        onClick={handleCleanup}
        disabled={cleaning}
        variant="outline"
        className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
      >
        {cleaning ? '🧹 Cleaning...' : '🧹 Clean Up All Documents'}
      </Button>
      
      {result && (
        <pre className="text-xs mt-2 p-2 bg-white rounded border whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}