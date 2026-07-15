import { fileToHtml, titleFromFilename } from './import.util';

describe('import.util', () => {
  it('converts a .txt file into paragraph HTML', () => {
    const html = fileToHtml('notes.txt', 'Hello world.\n\nSecond paragraph.');
    expect(html).toBe('<p>Hello world.</p><p>Second paragraph.</p>');
  });

  it('escapes HTML-special characters from plain text', () => {
    const html = fileToHtml('notes.txt', '<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('converts a .md file using markdown rules', () => {
    const html = fileToHtml('notes.md', '# Title\n\n- one\n- two');
    expect(html).toContain('Title</h1>');
    expect(html).toContain('<li>one</li>');
  });

  it('returns null for unsupported extensions', () => {
    expect(fileToHtml('report.docx', 'anything')).toBeNull();
  });

  it('derives a title from the filename', () => {
    expect(titleFromFilename('Project Plan.md')).toBe('Project Plan');
    expect(titleFromFilename('notes.txt')).toBe('notes');
  });
});
