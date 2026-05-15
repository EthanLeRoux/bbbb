/**
 * MarkdownView – lightweight markdown renderer for React Native.
 * Handles headings, bold, italic, inline code, code blocks,
 * blockquotes, unordered/ordered lists, horizontal rules, and plain text.
 * No external dependencies.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme';

// ─── Inline parser ────────────────────────────────────────────────────────────

function parseInline(text, keyBase) {
  const parts = [];
  // Patterns: **bold**, *italic*, `code`, __bold__, _italic_
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`${keyBase}-t${idx++}`}>{text.slice(lastIndex, match.index)}</Text>,
      );
    }
    if (match[1]) {
      // Bold
      parts.push(<Text key={`${keyBase}-b${idx++}`} style={s.bold}>{match[2]}</Text>);
    } else if (match[3]) {
      // Italic
      parts.push(<Text key={`${keyBase}-i${idx++}`} style={s.italic}>{match[4]}</Text>);
    } else if (match[5] !== undefined) {
      // Inline code
      parts.push(<Text key={`${keyBase}-c${idx++}`} style={s.inlineCode}>{match[5]}</Text>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<Text key={`${keyBase}-t${idx}`}>{text.slice(lastIndex)}</Text>);
  }

  return parts;
}

// ─── Block parser ─────────────────────────────────────────────────────────────

function parseBlocks(markdown) {
  const raw = (markdown || '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Empty line → skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph – accumulate until empty line or block-level element
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    }
  }

  return blocks;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderBlock(block, idx) {
  switch (block.type) {
    case 'heading': {
      const hStyle = [s.heading, s[`h${block.level}`]];
      return (
        <Text key={idx} style={hStyle}>
          {parseInline(block.text, `h${idx}`)}
        </Text>
      );
    }
    case 'paragraph':
      return (
        <Text key={idx} style={s.paragraph}>
          {parseInline(block.text, `p${idx}`)}
        </Text>
      );
    case 'code':
      return (
        <View key={idx} style={s.codeBlock}>
          {block.lang ? (
            <Text style={s.codeLang}>{block.lang}</Text>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={s.codeText}>{block.text}</Text>
          </ScrollView>
        </View>
      );
    case 'blockquote':
      return (
        <View key={idx} style={s.blockquote}>
          <Text style={s.blockquoteText}>{parseInline(block.text, `bq${idx}`)}</Text>
        </View>
      );
    case 'ul':
      return (
        <View key={idx} style={s.list}>
          {block.items.map((item, j) => (
            <View key={j} style={s.listItem}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.listText}>{parseInline(item, `ul${idx}-${j}`)}</Text>
            </View>
          ))}
        </View>
      );
    case 'ol':
      return (
        <View key={idx} style={s.list}>
          {block.items.map((item, j) => (
            <View key={j} style={s.listItem}>
              <Text style={s.bullet}>{j + 1}.</Text>
              <Text style={s.listText}>{parseInline(item, `ol${idx}-${j}`)}</Text>
            </View>
          ))}
        </View>
      );
    case 'hr':
      return <View key={idx} style={s.hr} />;
    default:
      return null;
  }
}

export default function MarkdownView({ content, style }) {
  const blocks = parseBlocks(content);
  return (
    <View style={[s.root, style]}>
      {blocks.map(renderBlock)}
    </View>
  );
}

const s = StyleSheet.create({
  blockquote: {
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    marginVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  blockquoteText: {
    color: colors.muted,
    fontFamily: fonts.serif,
    fontSize: typography.body,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  bold: { fontWeight: '700' },
  bullet: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: typography.body,
    lineHeight: 24,
    marginRight: spacing.sm,
    minWidth: 18,
  },
  codeBlock: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: spacing.xs,
    padding: spacing.md,
  },
  codeLang: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  codeText: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 20,
  },
  h1: { fontSize: 26, lineHeight: 33 },
  h2: { fontSize: 22, lineHeight: 29 },
  h3: { fontSize: 19, lineHeight: 26 },
  h4: { fontSize: 17, lineHeight: 24 },
  h5: { fontSize: 15, lineHeight: 22 },
  h6: { fontSize: 14, lineHeight: 20 },
  heading: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  hr: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    marginVertical: spacing.md,
  },
  inlineCode: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  italic: { fontStyle: 'italic' },
  list: { gap: spacing.xs, marginVertical: spacing.xs },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  listText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    lineHeight: 24,
  },
  paragraph: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 26,
    marginVertical: spacing.xs,
  },
  root: { gap: spacing.sm },
});
