/**
 * HTMLサニタイズ関数 (DOMPurify)
 * 
 * 入力されたHTML文字列から危険なスクリプトタグなどを除去し、
 * 安全なHTMLのみを返します。XSS対策として使用されます。
 */
export const sanitize = (content: string) => {
    if (!content) return '';
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DOMPurify = require('isomorphic-dompurify');
        const sanitizer = DOMPurify.default || DOMPurify;
        return sanitizer.sanitize(content);
    } catch (error) {
        // Fail-closed: Return empty string on error to prevent XSS
        console.error('Sanitization failed:', error);
        return '';
    }
};
