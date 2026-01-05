/**
 * Utility functions for formatting and cleaning quiz questions
 */

/**
 * Removes [UNDERLINE] and [/UNDERLINE] markup tags from question text
 * @param text - The question text that may contain markup tags
 * @returns Cleaned text without markup tags
 */
export function cleanQuestionText(text: string): string {
  return text
    .replace(/\[UNDERLINE\]/g, '')
    .replace(/\[\/UNDERLINE\]/g, '');
}

/**
 * Extracts the underlined text from a question with [UNDERLINE] markup
 * @param text - The question text with markup tags
 * @returns The text that was between the UNDERLINE tags, or empty string if not found
 */
export function extractUnderlinedText(text: string): string {
  const match = text.match(/\[UNDERLINE\](.*?)\[\/UNDERLINE\]/);
  return match ? match[1] : '';
}

/**
 * Replaces [UNDERLINE]text[/UNDERLINE] markup with formatted React elements
 * @param text - The question text with markup tags
 * @param className - Optional CSS class for styling the underlined portion
 * @returns Object with parts array for rendering
 */
export function parseUnderlineMarkup(text: string, className?: string): {
  parts: Array<{ text: string; isUnderlined: boolean }>;
} {
  const parts: Array<{ text: string; isUnderlined: boolean }> = [];
  const regex = /\[UNDERLINE\](.*?)\[\/UNDERLINE\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isUnderlined: false,
      });
    }
    
    // Add the underlined text
    parts.push({
      text: match[1],
      isUnderlined: true,
    });
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isUnderlined: false,
    });
  }
  
  // If no matches found, return the entire text as one part
  if (parts.length === 0) {
    parts.push({
      text: text,
      isUnderlined: false,
    });
  }
  
  return { parts };
}
