import * as fs from 'fs-extra';
import * as path from 'path';
import { Sitemap, SitemapNode } from './types.js';

const DOCS_DIR = process.env.DOCS_DIR || '../aismarttalk-docs/docs';

/**
 * Generate a hierarchical sitemap of the documentation structure
 */
export async function generateSitemap(): Promise<Sitemap> {
  const fullDocsDir = path.resolve(DOCS_DIR);
  
  if (!await fs.pathExists(fullDocsDir)) {
    return {
      root: fullDocsDir,
      structure: []
    };
  }
  
  const structure = await buildTree(fullDocsDir, fullDocsDir);
  
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
  
  try {
    const items = await fs.readdir(directory);
    const sortedItems = items.sort();
    
    for (const item of sortedItems) {
      // Skip hidden files and common ignore patterns
      if (item.startsWith('.') || item === 'node_modules' || item === 'dist') {
        continue;
      }
      
      const itemPath = path.join(directory, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        const children = await buildTree(itemPath, rootDir);
        tree.push({
          type: 'folder',
          name: item,
          children
        });
      } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
        const relativePath = path.relative(rootDir, itemPath);
        tree.push({
          type: 'file',
          name: item,
          path: relativePath
        });
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${directory}:`, error);
  }
  
  return tree;
} 