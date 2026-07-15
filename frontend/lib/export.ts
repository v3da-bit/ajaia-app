import TurndownService from "turndown";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

// Markdown has no native underline syntax — Turndown drops <u> by default.
// Keep it as inline raw HTML, which Markdown renderers (incl. GitHub) pass through.
turndown.addRule("underline", {
  filter: ["u"],
  replacement: (content) => `<u>${content}</u>`,
});

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html);
}

function slugifyFilename(title: string): string {
  return (title.trim() || "document").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

export function downloadMarkdown(title: string, html: string) {
  const markdown = htmlToMarkdown(html);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugifyFilename(title)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
