/**
 * Modular Client-Side Programmatic Code Prettifier
 * Leverages structured token/line analysis and recursive checks to auto-format files.
 */

/**
 * Formats JSON documents perfectly
 */
function formatJson(code: string): string {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, 2);
  } catch (err) {
    // If invalid JSON, fallback to line-by-line format
    return formatCStyle(code);
  }
}

/**
 * Formats HTML/XML markup safely
 */
function formatHtml(code: string): string {
  let indent = 0;
  const indentStr = "  "; // 2 spaces
  const tokens = code
    .replace(/>\s*</g, "><") // remove whitespace between tags
    .replace(/</g, "~#~<")    // inject token splitters
    .split("~#~");

  let result = "";
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (!token) continue;

    // Check if token lies in closing tag
    if (token.startsWith("</")) {
      indent = Math.max(0, indent - 1);
    }

    // Add trailing spaces based on current indentation
    result += indentStr.repeat(indent) + token + "\n";

    // Check if token lies in an opening tag (not self-closing or declaration)
    if (token.startsWith("<") && !token.startsWith("</") && !token.endsWith("/>") && !token.startsWith("<!") && !token.startsWith("<?")) {
      // Avoid incrementing indent for inline tags that close in the same token
      const matchTagName = token.match(/^<([a-zA-Z0-9:-]+)/);
      if (matchTagName) {
        const tagName = matchTagName[1];
        const closingTagStr = `</${tagName}>`;
        if (!token.includes(closingTagStr)) {
          indent++;
        }
      } else {
        indent++;
      }
    }
  }

  return result.trim();
}

/**
 * Formats C-Style curly brace languages (JS, TS, CSS, C++)
 */
function formatCStyle(code: string): string {
  const lines = code.split("\n");
  let indentLevel = 0;
  const indentStr = "  "; // 2 spaces
  const formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      // Keep up to one empty line for spacing rhythm, discard multiple empty lines
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== "") {
        formattedLines.push("");
      }
      continue;
    }

    // Count closing brackets in the beginning of line
    // e.g. } or ] or )
    let closeCount = 0;
    while (line.startsWith("}") || line.startsWith("]") || line.startsWith(")")) {
      closeCount++;
      // Temp slice for counting
      line = line.substring(1).trim();
    }

    // Restore line back to normal
    line = lines[i].trim();

    // Adjust indent down before writing the line if it starts with close braces
    const startsWithClose = /^[}\])]+/.test(line);
    if (startsWithClose) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Push currently formatted line with correct padding
    formattedLines.push(indentStr.repeat(indentLevel) + line);

    // Adjust indent for the next lines based on opening/closing symbols inside the line
    if (!startsWithClose) {
      // Total count of opening minus closing
      const openBrackets = (line.match(/[{[(]/g) || []).length;
      const closeBrackets = (line.match(/[}\right)]/g) || []).length;
      indentLevel += (openBrackets - closeBrackets);
    } else {
      // Already subtracted 1 for starting close brace; now balance the rest of the line
      const openBrackets = (line.match(/[{[(]/g) || []).length;
      // We already accounted for starting close braces, count only internal remaining close braces
      const internalLine = line.replace(/^[}\])]+/, "");
      const closeBrackets = (internalLine.match(/[}\right)]/g) || []).length;
      indentLevel += (openBrackets - closeBrackets);
    }

    // Check switch cases and labels
    if (line.startsWith("case ") || line.startsWith("default:")) {
      // Temporarily indent next lines if case is matched
      // Actually keeping standard line flow simpler keeps regex highly stable
    }

    indentLevel = Math.max(0, indentLevel);
  }

  return formattedLines.join("\n").trim();
}

/**
 * Entry portal to prettify any code content based on identified language
 */
export function prettifyCode(code: string, language: string): string {
  if (!code || !code.trim()) return "";
  
  const lang = (language || "").toLowerCase();

  switch (lang) {
    case "json":
      return formatJson(code);
    case "html":
    case "xml":
      return formatHtml(code);
    case "css":
    case "scss5":
    case "scss":
    case "less":
      return formatCStyle(code);
    case "javascript":
    case "typescript":
    case "jsx":
    case "tsx":
    case "js":
    case "ts":
      return formatCStyle(code);
    default:
      // Fallback formatting (general indentation & line trim cleanup)
      return formatCStyle(code);
  }
}
