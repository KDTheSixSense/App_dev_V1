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
// --- C# Warmup Logic ---
let charpWarmupDir = null;

async function prepareCSharpEnvironment() {
    if (charpWarmupDir && fs.existsSync(charpWarmupDir)) return;

    try {
        console.log('Preparing C# explosive environment...');
        const warmupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csharp-warmup-'));

        // Find dlls and create response file
        const sharedPath = '/usr/share/dotnet/shared/Microsoft.NETCore.App/8.0.22/'; // UPDATE if version changes
        // Use finding logic or strict path
        // We really should just list the dir

        const refsFile = path.join(warmupDir, 'refs.rsp');

        // We need to list all .dll files and format them as /r:path
        // We can do this in node since we have access to FS
        if (fs.existsSync(sharedPath)) {
            const files = fs.readdirSync(sharedPath);
            const dlls = files.filter(f => f.endsWith('.dll'));
            const refsContent = dlls.map(f => `/r:${path.join(sharedPath, f)}`).join('\n');
            fs.writeFileSync(refsFile, refsContent);
        } else {
            console.error('DoNet shared path not found:', sharedPath);
            // Fallback?
        }

        charpWarmupDir = warmupDir;
        console.log('C# explosive warmup complete:', charpWarmupDir);
    } catch (e) {
        console.error('C# warmup failed:', e);
    }
}

// Trigger warmup on start
prepareCSharpEnvironment();

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
        let execEnv = process.env;

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
                fileName = 'main.ts';
                let compiledFile = 'main.js';
                compileCmd = `tsc "${fileName}" --target es2020 --module commonjs --outDir .`;
                runCmd = 'node';
                runArgs = [compiledFile];
                break;

            case 'php':
                fileName = 'main.php';
                runCmd = 'php';
                runArgs = [fileName];
                if (sourceCode && !sourceCode.trim().startsWith('<?')) {
                    sourceCode = "<?php\n" + sourceCode;
                }
                break;

            case 'c':
                fileName = 'main.c';
                let compiledBin = 'app';
                compileCmd = `gcc "${fileName}" -o ${compiledBin}`;
                runCmd = `./${compiledBin}`;
                runArgs = [];
                break;

            case 'cpp':
                fileName = 'main.cpp';
                let compiledCpp = 'app';
                compileCmd = `g++ "${fileName}" -o ${compiledCpp} -std=c++17`;
                runCmd = `./${compiledCpp}`;
                runArgs = [];
                break;

            case 'java':
                fileName = 'Main.java';
                compileCmd = `javac -encoding UTF-8 "${fileName}"`;
                runCmd = 'java';
                runArgs = ['Main'];
                break;

            case 'csharp':
                // compileCmd = 'dotnet /usr/share/dotnet/sdk/8.0.416/Roslyn/bincore/csc.dll /nologo /target:exe /out:app.exe Program.cs';
                runCmd = './bin/Debug/net8.0/app'; // This is the default for dotnet build
                runArgs = [];

                // Fallback or setup for deps: csc needs refs.
                // Simple console app might need System.Runtime.dll etc.
                // It's safer to use 'dotnet build' if we have complex deps, but for 'A+B' csc is fast.
                // However, finding all refs is hard manually.

                // ALTERNATIVE: Use the previous warmup strategy but OPTIMIIZED.
                // The previous warmup was good. Why was it slow?
                // 'dotnet build --no-restore' still takes ~2s.
                // 'csc' takes ~200ms but needs refs.

                // Let's try csc with basic refs.
                // We create a response file with common refs?
                // Actually, 'dotnet build' is the most robust way.
                // Maybe 'dotnet build' was slow because I didn't actually use the warmup dir?

                // Wait, I implemented:
                // if (charpWarmupDir) { fs.cpSync(...) ... dotnet build --no-restore }
                // User said "Still 2 seconds".

                // Let's TRY csc.dll approach for speed.
                // We need to pass references.
                // Instead of hardcoding paths, we can rely on implicit refs? No.

                // Let's stick to 'dotnet build' but ensure NO generated files check?
                // 'dotnet build -c Debug --no-restore /p:UseSharedCompilation=true'

                // Actually, 'dotnet run' on a pre-built binary?
                // No, we need to compile NEW code.

                // Let's try to reuse the 'obj' folder more effectively?

                // Let's revert to 'csc' but we need to know where the refs are.
                // They are in /usr/share/dotnet/shared/Microsoft.NETCore.App/8.0.x/

                // const dotnetRoot = '/usr/share/dotnet/shared/Microsoft.NETCore.App/8.0.12'; // Verify version
                // Dynamic version check?
                // const versions = fs.readdirSync('/usr/share/dotnet/shared/Microsoft.NETCore.App/');
                // const latest = versions[0]; ...

                // To be safe and fast, let's keep the warmup but maybe we didn't use `fs.cpSync` correctly (node version?)
                // And `dotnet build` is just slow.

                // New Strategy:
                // Pre-compile a template project ONCE.
                // For new code, we just overwrite Program.cs
                // AND we invoke 'dotnet build --no-restore --no-dependencies'

                // Update: I will use csc with a hack.
                // I will add a step to 'warmup' to find all DLLs and build a response file? Too complex.

                // Let's try to trust 'dotnet build --no-restore' but make sure we are not running other tasks.

                fileName = 'Program.cs';

                if (charpWarmupDir && fs.existsSync(charpWarmupDir)) {
                    // "Explosive" speed: Use CSC directly with pre-calculated references
                    // We need to point to the response file we created in warmup
                    const rspPath = path.join(charpWarmupDir, 'refs.rsp');

                    // We use the full path to csc.dll we found
                    const cscPath = '/usr/share/dotnet/sdk/8.0.416/Roslyn/bincore/csc.dll';

                    // Direct compiler execution
                    // Note: We need to run it via 'dotnet' because csc.dll is a managed assembly
                    compileCmd = `dotnet "${cscPath}" /nologo /target:exe /out:app.exe "@${rspPath}" Program.cs`;

                    // CRITICAL: When using raw CSC, we MUST provide a runtimeconfig.json so 'dotnet app.exe' knows which runtime to use.
                    const runtimeConfig = {
                        "runtimeOptions": {
                            "tfm": "net8.0",
                            "framework": {
                                "name": "Microsoft.NETCore.App",
                                "version": "8.0.0"
                            }
                        }
                    };
                    fs.writeFileSync(path.join(tempDir, 'app.runtimeconfig.json'), JSON.stringify(runtimeConfig, null, 2));

                } else {
                    // Fallback to project file if warmup failed (should not happen)
                    const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <AssemblyName>app</AssemblyName>
  </PropertyGroup>
</Project>`;
                    fs.writeFileSync(path.join(tempDir, 'app.csproj'), csproj);
                    compileCmd = 'dotnet build -c Debug';
                }

                runCmd = 'dotnet';
                runArgs = ['./app.exe'];

                // Hack for fallback compatibility:
                if (!charpWarmupDir) {
                    // fallback produces ./bin/Debug/net8.0/app which is Native execution usually
                    runCmd = './bin/Debug/net8.0/app';
                    runArgs = [];
                }

                execEnv = {
                    ...process.env,
                    HOME: tempDir,
                    DOTNET_CLI_HOME: tempDir,
                    DOTNET_NOLOGO: 'true',
                    DOTNET_CLI_TELEMETRY_OPTOUT: 'true',
                    DOTNET_SKIP_FIRST_TIME_EXPERIENCE: 'true',
                    DOTNET_MULTILEVEL_LOOKUP: '0',
                    DOTNET_TieredCompilation: '0' // Optimize for startup speed (Quick JIT)
                };
                break;

            default:
                throw new Error(`Unsupported language: ${language}`);
        }

        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, sourceCode);

        // Compile
        if (compileCmd) {
            try {
                const { stdout, stderr } = await execPromise(compileCmd, { cwd: tempDir, env: execEnv });
                result.build_stdout = sanitizeOutput(stdout);
                result.build_stderr = sanitizeOutput(stderr);
            } catch (compileError) {
                const errorDetails = compileError.stdout || compileError.stderr || compileError.message;
                result.build_stderr = sanitizeOutput(errorDetails);

                // For C#, check if binary exists (dotnet build might return non-zero on warnings sometimes? or strictly errors)
                // If it failed, assume no binary.
                if (language === 'csharp') {
                    if (!fs.existsSync(path.join(tempDir, 'bin/Debug/net8.0/app'))) return result;
                } else if (language === 'c' || language === 'cpp') {
                    if (!fs.existsSync(path.join(tempDir, 'app'))) return result;
                } else if (language === 'java') {
                    if (!fs.existsSync(path.join(tempDir, 'Main.class'))) return result;
                } else if (language === 'typescript') {
                    if (!fs.existsSync(path.join(tempDir, 'main.js'))) return result;
                }
            }
        }

        // Run
        await new Promise((resolve) => {
            const child = spawn(runCmd, runArgs, { cwd: tempDir, env: execEnv });

            child.on('error', (err) => {
                result.stderr += `\nSpawn Error: ${err.message}`;
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

    const result = await executeCode(language, source_code, input || '');
    res.json(result);
});

app.listen(port, () => {
    console.log(`Sandbox server listening on port ${port}`);
});
