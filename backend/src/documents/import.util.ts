import { marked } from 'marked';

export const SUPPORTED_UPLOAD_EXTENSIONS = ['txt', 'md'] as const;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Plain text -> paragraphs, one <p> per blank-line-separated block. */
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Convert an uploaded file's contents into editor-ready HTML based on its
 * extension. Returns null for unsupported extensions.
 */
export function fileToHtml(filename: string, text: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'md') return marked.parse(text, { async: false });
  if (ext === 'txt') return textToHtml(text);
  return null;
}

export function titleFromFilename(filename: string): string {
  return filename.replace(/\.(txt|md)$/i, '') || 'Untitled document';
}
