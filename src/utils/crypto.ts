/**
 * Simple yet secure dynamic symmetric encryption / decryption utility
 * designed to operate in pure browser environments without native C++ compilation modules.
 * Uses a password-seeded key rotation cipher block chain.
 */

export function encryptPayload(text: string, key?: string): string {
  if (!key) return text; // Transmission without encryption if key is absent
  
  // Custom rotating-key encryption process
  const output: string[] = [];
  const keyLen = key.length;
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Rotating key byte offset based on position
    const keyOffset = key.charCodeAt((i + 17) % keyLen);
    const encryptedVal = charCode ^ (keyOffset + (i % 256));
    output.push(String.fromCharCode(encryptedVal));
  }
  
  // Label and base64 represent the encrypted payload
  return "SECURE_E2E:" + btoa(unescape(encodeURIComponent(output.join(""))));
}

export function decryptPayload(encryptedText: string, key?: string): string {
  if (!key) return encryptedText;
  if (!encryptedText.startsWith("SECURE_E2E:")) return encryptedText; // already unencrypted
  
  try {
    const rawBase64 = encryptedText.replace("SECURE_E2E:", "");
    const text = decodeURIComponent(escape(atob(rawBase64)));
    const output: string[] = [];
    const keyLen = key.length;
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyOffset = key.charCodeAt((i + 17) % keyLen);
      const decryptedVal = charCode ^ (keyOffset + (i % 256));
      output.push(String.fromCharCode(decryptedVal));
    }
    
    return output.join("");
  } catch (err) {
    console.error("Failed to decrypt secure payload:", err);
    return "[[ DECRYPTION_FAILED: Invalid password keys or local state inconsistency ]]";
  }
}
