


const stripMarkdown = (md: string) => {
  return md
    // headers
    .replace(/^#{1,6}\s+/gm, '')
    // bold / italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // images ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // code blocks
    .replace(/```[\s\S]*?```/g, '')
    // inline code
    .replace(/`([^`]*)`/g, '$1')
    // lists
    .replace(/^\s*[-*+]\s+/gm, '')
    // blockquotes
    .replace(/^\s*>\s?/gm, '')
    // newline → space
    .replace(/\n+/g, ' ')
    .trim();
};


export default function MarkdownPreview ({ content }: { content: string }) {
  const text = stripMarkdown(content);

  return text || "—"
};