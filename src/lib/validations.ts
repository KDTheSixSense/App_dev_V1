import { z } from 'zod';

// SQL Injection対策: 一般的な攻撃文字列を明示的に禁止するRegex
const sqlInjectionPattern = /['";\-\-]/;

export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email is too long')
        .refine((val) => !sqlInjectionPattern.test(val), {
            message: "Invalid characters in email"
        }),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
});

export const registerSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email is too long')
        .refine((val) => !sqlInjectionPattern.test(val), {
            message: "Invalid characters in email"
        }),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
    birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }).optional().or(z.literal('')),
});

export const executeCodeSchema = z.object({
    source_code: z.string().max(10000, 'Code is too long'),
    language: z.enum([
        'python', 'python3', 'javascript', 'typescript',
        'php', 'c', 'cpp', 'java', 'csharp'
    ]),
    input: z.string().optional(),
});
