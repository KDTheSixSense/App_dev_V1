import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address').max(255, 'Email is too long'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email address').max(255, 'Email is too long'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
    birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
});

export const executeCodeSchema = z.object({
    source_code: z.string().max(10000, 'Code is too long'),
    language: z.enum([
        'python', 'python3', 'javascript', 'typescript',
        'php', 'c', 'cpp', 'java', 'csharp'
    ]),
    input: z.string().optional(),
});
