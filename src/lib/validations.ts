import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address').max(255, 'Email is too long'),
    password: z.string().min(1, 'Password is required').max(100, 'Password is too long'),
});

export const executeCodeSchema = z.object({
    source_code: z.string().max(10000, 'Code is too long'),
    language: z.enum([
        'python', 'python3', 'javascript', 'typescript',
        'php', 'c', 'cpp', 'java', 'csharp'
    ]),
    input: z.string().optional(),
});
