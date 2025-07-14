/**
 * Available style transformations for markdown content
 */
const STYLE_MAP: Record<string, (content: string) => string> = {
  'bold_headers': (content: string) => {
    console.log("[STYLE_MAP] Applying 'bold_headers' style");
    return content.replace(/^(#+)\s+(.+)$/gm, '$1 **$2**');
  },
  
  'add_spacing': (content: string) => {
    console.log("[STYLE_MAP] Applying 'add_spacing' style");
    return content.replace(/\n/g, '\n\n');
  },
  
  'remove_comments': (content: string) => {
    console.log("[STYLE_MAP] Applying 'remove_comments' style");
    return content
      .split('\n')
      .filter(line => !line.trim().startsWith('<!--'))
      .join('\n');
  },
  
  'clean_whitespace': (content: string) => {
    console.log("[STYLE_MAP] Applying 'clean_whitespace' style");
    return content
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
  },
  
  'add_toc': (content: string) => {
    console.log("[STYLE_MAP] Applying 'add_toc' style");
    const lines = content.split('\n');
    const toc: string[] = ['## Table of Contents', ''];
    
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2];
        const indent = '  '.repeat(level - 1);
        const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        toc.push(`${indent}- [${title}](#${anchor})`);
      }
    }
    
    if (toc.length > 2) {
      toc.push('');
      return toc.join('\n') + content;
    }
    
    return content;
  },
  
  'format_code_blocks': (content: string) => {
    console.log("[STYLE_MAP] Applying 'format_code_blocks' style");
    return content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
      const language = lang || 'text';
      const formattedCode = code.trim();
      return `\`\`\`${language}\n${formattedCode}\n\`\`\``;
    });
  },
  
  'highlight_notes': (content: string) => {
    console.log("[STYLE_MAP] Applying 'highlight_notes' style");
    return content.replace(/^(\s*)(Note:|Warning:|Important:)/gm, '$1> **$2**');
  }
};

/**
 * Apply a style transformation to content
 */
export function applyStyle(styleId: string, content: string): { style: string; transformed: string } {
  console.log(`[applyStyle] Requested style: '${styleId}'`);
  if (!(styleId in STYLE_MAP)) {
    console.error(`[applyStyle] Style '${styleId}' not supported. Available styles: ${Object.keys(STYLE_MAP).join(', ')}`);
    throw new Error(`Style '${styleId}' not supported. Available styles: ${Object.keys(STYLE_MAP).join(', ')}`);
  }
  
  const transformed = STYLE_MAP[styleId](content);
  console.log(`[applyStyle] Style '${styleId}' applied successfully.`);
  
  return {
    style: styleId,
    transformed
  };
}

/**
 * Get list of available styles
 */
export function getAvailableStyles(): string[] {
  console.log("[getAvailableStyles] Returning available styles");
  return Object.keys(STYLE_MAP);
}

/**
 * Apply multiple styles in sequence
 */
export function applyMultipleStyles(styleIds: string[], content: string): { styles: string[]; transformed: string } {
  console.log(`[applyMultipleStyles] Applying styles in sequence: ${styleIds.join(', ')}`);
  let transformed = content;
  
  for (const styleId of styleIds) {
    console.log(`[applyMultipleStyles] Applying style: '${styleId}'`);
    const result = applyStyle(styleId, transformed);
    transformed = result.transformed;
  }
  
  console.log("[applyMultipleStyles] All styles applied.");
  return {
    styles: styleIds,
    transformed
  };
} 