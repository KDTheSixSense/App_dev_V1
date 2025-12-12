const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const app = express();
const port = 4000;

app.use(express.json());

const execPromise = promisify(exec);

// --- Output Sanitization ---
function sanitizeOutput(output) {
    if (!output) return '';
    const tmpDir = os.tmpdir();
    let sanitized = output.split(tmpDir).join('/sandbox');

    try {
        const username = os.userInfo().username;
        if (username) {
            sanitized = sanitized.split(username).join('user');
        }
    } catch (e) {
        // Ignore error if we can't read user info (e.g. strict permissions)
    }

    return sanitized;
}

// --- Execution Logic ---
async function executeCode(language, sourceCode, input) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'execution-'));

    const result = {
        build_stdout: '',
        build_stderr: '',
        stdout: '',
        stderr: '',
        exit_code: 0,
    };

    try {
        let fileName = '';
        let runCmd = '';
        let runArgs = [];
        let compileCmd = '';
        let compiledFile = '';

        switch (language) {
            case 'python':
            case 'python3':
                fileName = 'main.py';
                runCmd = 'python3';
                runArgs = [fileName];
                break;

            case 'javascript':
                fileName = 'main.js';
                runCmd = 'node';
                runArgs = [fileName];
                break;

            case 'typescript':
                // Note: In the sandbox, we might need to install typescript globally or use npx
                // For simplicity, let's assume we can run it with node if it's just JS, 
                // but for TS we need compilation. 
                // Let's use a simple tsc invocation if available, or ts-node.
                // Given the Dockerfile plan, we should install typescript.
                fileName = 'main.ts';
                compiledFile = 'main.js';
                compileCmd = `tsc "${fileName}" --target es2020 --module commonjs --outDir .`;
                runCmd = 'node';
                runArgs = [compiledFile];
                break;

            case 'php':
                fileName = 'main.php';
                runCmd = 'php';
                runArgs = [fileName];
                break;

            case 'c':
                fileName = 'main.c';
                compiledFile = 'app';
                compileCmd = `gcc "${fileName}" -o ${compiledFile}`;
                runCmd = `./${compiledFile}`;
                runArgs = [];
                break;

            case 'cpp':
                fileName = 'main.cpp';
                compiledFile = 'app';
                compileCmd = `g++ "${fileName}" -o ${compiledFile}`;
                runCmd = `./${compiledFile}`;
                runArgs = [];
                break;

            case 'java':
                fileName = 'Main.java';
                compiledFile = 'Main.class';
                compileCmd = `javac -encoding UTF-8 "${fileName}"`;
                runCmd = 'java';
                runArgs = ['Main'];
                break;

            case 'csharp':
                fileName = 'Program.cs';
                compiledFile = 'app.exe';
                compileCmd = `mcs "${fileName}" -out:${compiledFile}`;
                runCmd = 'mono';
                runArgs = [compiledFile];
                break;

            default:
                throw new Error(`Unsupported language: ${language}`);
        }

        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, sourceCode);

        // Compile
        if (compileCmd) {
            try {
                const { stdout, stderr } = await execPromise(compileCmd, { cwd: tempDir });
                result.build_stdout = sanitizeOutput(stdout);
                result.build_stderr = sanitizeOutput(stderr);
            } catch (compileError) {
                result.build_stdout = sanitizeOutput(compileError.stdout || '');
                result.build_stderr = sanitizeOutput(compileError.stderr || compileError.message);

                // Check if artifact exists despite error (warnings?)
                // If no artifact, return early
                if (compiledFile && !fs.existsSync(path.join(tempDir, compiledFile))) {
                    return result;
                }
            }
        }

        // Run
        await new Promise((resolve) => {
            const child = spawn(runCmd, runArgs, { cwd: tempDir });

            child.on('error', (err) => {
                result.stderr += `\nSpawn Error: ${err.message}`;
                // If spawn fails, we should resolve?
                // But 'close' might not fire if spawn fails immediately?
                // Actually, 'error' is emitted *instead* of 'spawn' if it fails.
                // And 'close' might not fire.
                resolve();
            });

            if (input) {
                child.stdin.write(input);
                child.stdin.end();
            }

            child.stdout.on('data', (data) => { result.stdout += data.toString(); });
            child.stderr.on('data', (data) => { result.stderr += data.toString(); });

            child.on('close', (code) => {
                result.exit_code = code || 0;
                resolve();
            });

            // Timeout 3s
            setTimeout(() => {
                if (!child.killed) {
                    child.kill();
                    result.stderr += '\nError: Time Limit Exceeded (3s)';
                    resolve();
                }
            }, 3000);
        });

        result.stdout = sanitizeOutput(result.stdout);
        result.stderr = sanitizeOutput(result.stderr);

        return result;

    } catch (e) {
        return { ...result, stderr: `System Error: ${e.message}` };
    } finally {
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        } catch (e) {
            console.error('Temp dir clean error', e);
        }
    }
}

app.post('/execute', async (req, res) => {
    const { language, source_code, input } = req.body;

    if (!language || !source_code) {
        return res.status(400).json({ error: 'Missing language or source_code' });
    }

    // Decode source_code from Base64
    const decodedSourceCode = Buffer.from(source_code, 'base64').toString('utf-8');

    const result = await executeCode(language, decodedSourceCode, input || '');
    res.json(result);
});

app.listen(port, () => {
    console.log(`Sandbox server listening on port ${port}`);
});
