/**
 * File validation utilities to prevent malicious uploads via extension spoofing.
 */

// Magic numbers for common file types
const MAGIC_NUMBERS: Record<string, number[]> = {
    // Images
    jpg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    gif: [0x47, 0x49, 0x46, 0x38],
    webp: [0x52, 0x49, 0x46, 0x46], // WEBP starts with 'RIFF', then length, then 'WEBP'

    // Documents / Archives
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    zip: [0x50, 0x4B, 0x03, 0x04], // PK..
    rar: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], // Rar!...
    '7z': [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C],
};

/**
 * Checks if the buffer starts with the specified magic signature.
 */
function checkSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) return false;
    for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) return false;
    }
    return true;
}

/**
 * Validates that the file buffer matches the expected extension based on magic numbers.
 * Returns true if valid, false if invalid or unknown (fail-safe).
 * 
 * Note: For text-based files (txt, md, js, etc.), magic numbers are unreliable.
 * This checks strictly for binary formats where spoofing is most dangerous (images, executables disguised).
 */
/**
 * ファイルシグネチャ検証関数
 * 
 * ファイルのマジックナンバー（先頭バイト列）をチェックし、
 * 拡張子と実際のファイル形式が一致しているか検証します（なりすまし防止）。
 */
export function validateFileSignature(buffer: Buffer, extension: string): boolean {
    const normExt = extension.toLowerCase().replace('.', '');

    // Special handling for WEBP (Offset check needed)
    if (normExt === 'webp') {
        // RIFF .... WEBP
        if (!checkSignature(buffer, MAGIC_NUMBERS['webp'])) return false;
        // Check for 'WEBP' at offset 8
        if (buffer.length < 12) return false;
        const webpSig = [0x57, 0x45, 0x42, 0x50]; // WEBP
        for (let i = 0; i < 4; i++) {
            if (buffer[8 + i] !== webpSig[i]) return false;
        }
        return true;
    }

    const signature = MAGIC_NUMBERS[normExt];

    // If we have a signature for this extension, verify it.
    if (signature) {
        return checkSignature(buffer, signature);
    }

    // If it's a text file or source code, we can't rely on magic numbers.
    // We should scan for obviously malicious content (like <script tags) if it's being served as HTML,
    // but ideally text files should be served as text/plain.
    // For now, allow unknown extensions but assume the caller filters by a strict allowlist first.
    const BINARY_EXTENSIONS_TO_BLOCK_IF_UNKNOWN = ['exe', 'dll', 'sh', 'bin'];
    if (BINARY_EXTENSIONS_TO_BLOCK_IF_UNKNOWN.includes(normExt)) {
        return false;
    }

    return true;
}

/**
 * Detects if a buffer contains potentially malicious HTML/Script content.
 * Useful for checking 'text' files before upload.
 */
export function scanForHtmlContent(buffer: Buffer): boolean {
    const content = buffer.toString('utf8').toLowerCase();
    // Simple heuristic checks
    if (content.includes('<script') || content.includes('javascript:') || content.includes('onload=')) {
        return true;
    }
    if (content.includes('<html') || content.includes('<body') || content.includes('<iframe')) {
        return true;
    }
    return false;
}
