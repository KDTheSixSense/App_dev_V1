import DOMPurify from 'isomorphic-dompurify';

export const sanitize = (content: string) => {
    return DOMPurify.sanitize(content);
};
