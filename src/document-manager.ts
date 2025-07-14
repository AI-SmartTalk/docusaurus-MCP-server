import fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { vectorStore } from './vector-store.js';

const DOCS_DIR = process.env.DOCS_DIR || '../aismarttalk-docs/docs';
const WATERMARK = '<!-- TODO: INCOMPLETE -->';

/**
 * Create a new document with content and optional incomplete watermark
 */
export async function createDocument(
  documentPath: string, 
  content: string, 
  markIncomplete: boolean = true
): Promise<{ status: string; path: string }> {
  const fullPath = path.join(DOCS_DIR, documentPath);
  console.log(`[createDocument] Creating document at: ${fullPath} (markIncomplete: ${markIncomplete})`);
  
  // Ensure directory exists
  await fs.ensureDir(path.dirname(fullPath));
  
  // Add watermark if requested and not already present
  let finalContent = content;
  if (markIncomplete && !content.includes(WATERMARK)) {
    finalContent += `\n\n${WATERMARK}`;
    console.log(`[createDocument] Watermark added to document at: ${documentPath}`);
  }
  
  // Write file
  await fs.writeFile(fullPath, finalContent, 'utf8');
  console.log(`[createDocument] File written at: ${fullPath}`);
  
  // Update vector store
  await vectorStore.upsert(documentPath, finalContent);
  console.log(`[createDocument] Vector store updated for: ${documentPath}`);
  
  return { status: 'created', path: documentPath };
}

/**
 * Update specific lines in a document
 */
export async function updateDocument(
  documentPath: string,
  startLine: number,
  endLine: number,
  newText: string
): Promise<{ status: string; path: string }> {
  const fullPath = path.join(DOCS_DIR, documentPath);
  console.log(`[updateDocument] Updating document at: ${fullPath} (lines ${startLine} to ${endLine})`);
  
  if (!await fs.pathExists(fullPath)) {
    console.error(`[updateDocument] Document not found: ${documentPath}`);
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  const content = await fs.readFile(fullPath, 'utf8');
  const lines = content.split('\n');
  
  // Replace lines (convert to 0-based indexing)
  const newLines = newText.split('\n');
  lines.splice(startLine, endLine - startLine, ...newLines);
  
  const updatedContent = lines.join('\n');
  await fs.writeFile(fullPath, updatedContent, 'utf8');
  console.log(`[updateDocument] File updated at: ${fullPath}`);
  
  // Update vector store
  await vectorStore.upsert(documentPath, updatedContent);
  console.log(`[updateDocument] Vector store updated for: ${documentPath}`);
  
  return { status: 'updated', path: documentPath };
}

/**
 * Continue writing a document by appending content
 */
export async function continueDocument(
  documentPath: string,
  continuation: string
): Promise<{ status: string; path: string }> {
  const fullPath = path.join(DOCS_DIR, documentPath);
  console.log(`[continueDocument] Continuing document at: ${fullPath}`);
  
  if (!await fs.pathExists(fullPath)) {
    console.error(`[continueDocument] Document not found: ${documentPath}`);
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  const currentContent = await fs.readFile(fullPath, 'utf8');
  let updatedContent = currentContent.trim() + '\n' + continuation;
  
  // Remove watermark if document seems complete (continuation doesn't end with watermark)
  if (updatedContent.includes(WATERMARK) && !continuation.trim().endsWith(WATERMARK)) {
    updatedContent = updatedContent.replace(WATERMARK, '');
    console.log(`[continueDocument] Watermark removed from document at: ${documentPath}`);
  }
  
  await fs.writeFile(fullPath, updatedContent, 'utf8');
  console.log(`[continueDocument] File updated at: ${fullPath}`);
  
  // Update vector store
  await vectorStore.upsert(documentPath, updatedContent);
  console.log(`[continueDocument] Vector store updated for: ${documentPath}`);
  
  return { status: 'continued', path: documentPath };
}

/**
 * Get document content by path
 */
export async function getDocumentContent(documentPath: string): Promise<string> {
  const fullPath = path.join(DOCS_DIR, documentPath);
  console.log(`[getDocumentContent] Getting content for: ${fullPath}`);
  
  if (!await fs.pathExists(fullPath)) {
    console.error(`[getDocumentContent] Document not found: ${documentPath}`);
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  return await fs.readFile(fullPath, 'utf8');
}

/**
 * Get all unfinished documents (containing the watermark)
 */
export async function getUnfinishedDocuments(): Promise<string[]> {
  const pattern = path.join(DOCS_DIR, '**/*.md').replace(/\\/g, '/');
  console.log(`[getUnfinishedDocuments] Searching for unfinished documents with pattern: ${pattern}`);
  const files = await glob(pattern);
  const unfinished: string[] = [];
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes(WATERMARK)) {
        const relativePath = path.relative(DOCS_DIR, file);
        unfinished.push(relativePath);
        console.log(`[getUnfinishedDocuments] Unfinished document found: ${relativePath}`);
      }
    } catch (error) {
      console.warn(`Error reading file ${file}:`, error);
    }
  }
  
  console.log(`[getUnfinishedDocuments] Total unfinished documents: ${unfinished.length}`);
  return unfinished;
}

/**
 * Delete a document
 */
export async function deleteDocument(documentPath: string): Promise<{ status: string; path: string }> {
  const fullPath = path.join(DOCS_DIR, documentPath);
  console.log(`[deleteDocument] Deleting document at: ${fullPath}`);
  
  if (!await fs.pathExists(fullPath)) {
    console.error(`[deleteDocument] Document not found: ${documentPath}`);
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  await fs.remove(fullPath);
  console.log(`[deleteDocument] File removed at: ${fullPath}`);
  vectorStore.delete(documentPath);
  console.log(`[deleteDocument] Vector store entry deleted for: ${documentPath}`);
  
  return { status: 'deleted', path: documentPath };
}

/**
 * Sync all documents in the docs directory to the vector store
 */
export async function syncDocuments(): Promise<{ synced: number; errors: number }> {
  const pattern = path.join(DOCS_DIR, '**/*.{md,mdx}').replace(/\\/g, '/');
  console.log(`[syncDocuments] Syncing documents with pattern: ${pattern}`);
  const files = await glob(pattern);
  
  let synced = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const relativePath = path.relative(DOCS_DIR, file);
      await vectorStore.upsert(relativePath, content);
      synced++;
      console.log(`[syncDocuments] Synced: ${relativePath}`);
    } catch (error) {
      console.warn(`Error syncing file ${file}:`, error);
      errors++;
    }
  }
  
  console.log(`[syncDocuments] Sync complete. Synced: ${synced}, Errors: ${errors}`);
  return { synced, errors };
} 