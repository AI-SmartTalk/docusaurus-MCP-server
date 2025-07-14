import * as fs from 'fs-extra';
import * as path from 'path';
import { Sitemap, SitemapNode } from './types.js';

const DOCS_DIR = process.env.DOCS_DIR || '../aismarttalk-docs/docs';

/**
 * Generate a hierarchical sitemap of the documentation structure
 */
export async function generateSitemap(): Promise<Sitemap> {
  const fullDocsDir = path.resolve(DOCS_DIR);
  console.log(`[generateSitemap] Resolved docs directory: ${fullDocsDir}`);
  
  if (!await fs.pathExists(fullDocsDir)) {
    console.warn(`[generateSitemap] Docs directory does not exist: ${fullDocsDir}`);
    return {
      root: fullDocsDir,
      structure: []
    };
  }
  
  const structure = await buildTree(fullDocsDir, fullDocsDir);
  console.log(`[generateSitemap] Sitemap structure generated for root: ${fullDocsDir}`);
  
  return {
    root: fullDocsDir,
    structure
  };
}

/**
 * Recursively build the directory tree
 */
async function buildTree(directory: string, rootDir: string): Promise<SitemapNode[]> {
  const tree: SitemapNode[] = [];
  console.log(`[buildTree] Reading directory: ${directory}`);
  
  try {
    const items = await fs.readdir(directory);
    const sortedItems = items.sort();
    console.log(`[buildTree] Found items in ${directory}:`, sortedItems);
    
    for (const item of sortedItems) {
      // Skip hidden files and common ignore patterns
      if (item.startsWith('.') || item === 'node_modules' || item === 'dist') {
        console.log(`[buildTree] Skipping ignored item: ${item}`);
        continue;
      }
      
      const itemPath = path.join(directory, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        console.log(`[buildTree] Entering directory: ${itemPath}`);
        const children = await buildTree(itemPath, rootDir);
        tree.push({
          type: 'folder',
          name: item,
          children
        });
        console.log(`[buildTree] Added folder: ${item}`);
      } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
        const relativePath = path.relative(rootDir, itemPath);
        tree.push({
          type: 'file',
          name: item,
          path: relativePath
        });
        console.log(`[buildTree] Added file: ${item} (relative path: ${relativePath})`);
      } else {
        console.log(`[buildTree] Skipping non-doc file: ${item}`);
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${directory}:`, error);
  }
  
  return tree;
} 