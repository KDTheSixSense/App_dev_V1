const fs = require('fs');
const path = require('path');

const appDir = path.join(process.cwd(), 'app');

function traverseDir(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            traverseDir(filePath, fileList);
        } else {
            if (file === 'route.ts' || file === 'route.tsx') {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const routes = traverseDir(appDir);
console.log(`Found ${routes.length} routes.`);

routes.forEach(route => {
    const content = fs.readFileSync(route, 'utf-8');
    // Simple check: Look for session/auth pattern
    const hasIronSession = content.includes('getIronSession');
    const hasAppSession = content.includes('getAppSession');
    const hasAuth = content.includes('auth(') || content.includes('getServerSession'); // Fallback

    if (!hasIronSession && !hasAppSession && !hasAuth) {
        // Exclude public routes known to be safe
        if (route.includes('/api/auth/') || route.includes('/api/health')) return;

        console.log(`[Warning] Potential Missing Auth Check: ${path.relative(process.cwd(), route)}`);
    }
});
