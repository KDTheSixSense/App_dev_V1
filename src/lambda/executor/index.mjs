import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);

export const handler = async (event) => {
    const { code, input } = event;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lambda-exec-'));
    const fileName = 'main.js';
    const filePath = path.join(tempDir, fileName);

    try {
        fs.writeFileSync(filePath, code);

        // Security Hardening: Use Node.js Permission Model (v20+)
        // Block all FS access except for the temporary directory
        const runCmd = `node --no-warnings --experimental-permission --allow-fs-read="${tempDir}" --allow-fs-write="${tempDir}" "${filePath}"`;

        // Execute
        const child = await new Promise((resolve) => {
            const process = exec(runCmd, { cwd: tempDir, timeout: 3000 }, (error, stdout, stderr) => {
                resolve({ error, stdout, stderr });
            });

            if (input) {
                process.stdin.write(input);
                process.stdin.end();
            }
        });

        return {
            stdout: child.stdout || '',
            stderr: child.stderr || (child.error ? child.error.message : ''),
            exit_code: child.error ? 1 : 0
        };

    } catch (error) {
        return {
            stdout: '',
            stderr: error.message,
            exit_code: 1
        };
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};
