import * as fs from 'fs-extra';
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
  
  // Ensure directory exists
  await fs.ensureDir(path.dirname(fullPath));
  
  // Add watermark if requested and not already present
  let finalContent = content;
  if (markIncomplete && !content.includes(WATERMARK)) {
    finalContent += `\n\n${WATERMARK}`;
  }
  
  // Write file
  await fs.writeFile(fullPath, finalContent, 'utf8');
  
  // Update vector store
  await vectorStore.upsert(documentPath, finalContent);
  
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
  
  if (!await fs.pathExists(fullPath)) {
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  const content = await fs.readFile(fullPath, 'utf8');
  const lines = content.split('\n');
  
  // Replace lines (convert to 0-based indexing)
  const newLines = newText.split('\n');
  lines.splice(startLine, endLine - startLine, ...newLines);
  
  const updatedContent = lines.join('\n');
  await fs.writeFile(fullPath, updatedContent, 'utf8');
  
  // Update vector store
  await vectorStore.upsert(documentPath, updatedContent);
  
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
  
  if (!await fs.pathExists(fullPath)) {
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  const currentContent = await fs.readFile(fullPath, 'utf8');
  let updatedContent = currentContent.trim() + '\n' + continuation;
  
  // Remove watermark if document seems complete (continuation doesn't end with watermark)
  if (updatedContent.includes(WATERMARK) && !continuation.trim().endsWith(WATERMARK)) {
    updatedContent = updatedContent.replace(WATERMARK, '');
  }
  
  await fs.writeFile(fullPath, updatedContent, 'utf8');
  
  // Update vector store
  await vectorStore.upsert(documentPath, updatedContent);
  
  return { status: 'continued', path: documentPath };
}

/**
 * Get document content by path
 */
export async function getDocumentContent(documentPath: string): Promise<string> {
  const fullPath = path.join(DOCS_DIR, documentPath);
  
  if (!await fs.pathExists(fullPath)) {
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  return await fs.readFile(fullPath, 'utf8');
}

/**
 * Get all unfinished documents (containing the watermark)
 */
export async function getUnfinishedDocuments(): Promise<string[]> {
  const pattern = path.join(DOCS_DIR, '**/*.md').replace(/\\/g, '/');
  const files = await glob(pattern);
  const unfinished: string[] = [];
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes(WATERMARK)) {
        const relativePath = path.relative(DOCS_DIR, file);
        unfinished.push(relativePath);
      }
    } catch (error) {
      console.warn(`Error reading file ${file}:`, error);
    }
  }
  
  return unfinished;
}

/**
 * Delete a document
 */
export async function deleteDocument(documentPath: string): Promise<{ status: string; path: string }> {
  const fullPath = path.join(DOCS_DIR, documentPath);
  
  if (!await fs.pathExists(fullPath)) {
    throw new Error(`Document not found: ${documentPath}`);
  }
  
  await fs.remove(fullPath);
  vectorStore.delete(documentPath);
  
  return { status: 'deleted', path: documentPath };
}

/**
 * Sync all documents in the docs directory to the vector store
 */
export async function syncDocuments(): Promise<{ synced: number; errors: number }> {
  const pattern = path.join(DOCS_DIR, '**/*.{md,mdx}').replace(/\\/g, '/');
  const files = await glob(pattern);
  
  let synced = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const relativePath = path.relative(DOCS_DIR, file);
      await vectorStore.upsert(relativePath, content);
      synced++;
    } catch (error) {
      console.warn(`Error syncing file ${file}:`, error);
      errors++;
    }
  }
  
  return { synced, errors };
} 