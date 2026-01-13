export const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358';

export const EVENT_THEMES = {
    default: { label: 'Default', class: 'bg-gradient-to-br from-slate-600 to-slate-800', textClass: 'text-white', pattern: 'waves' },
    it: { label: 'IT / Tech', class: 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700', textClass: 'text-white', pattern: 'batik-megamendung' },
    contest: { label: 'Contest', class: 'bg-gradient-to-bl from-violet-200 via-purple-200 to-fuchsia-200', textClass: 'text-purple-900', pattern: 'batik-aceh' },
    campus: { label: 'Campus', class: 'bg-gradient-to-r from-teal-400 via-emerald-500 to-green-600', textClass: 'text-white', pattern: 'batik-parang' },
    cyber: { label: 'Cyber', class: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900', textClass: 'text-white', pattern: 'hexagons' },
    pop: { label: 'Starry', class: 'bg-gradient-to-tr from-sky-100 via-cyan-100 to-blue-200', textClass: 'text-sky-800', pattern: 'batik-truntum' },
    sakura: { label: 'Sakura', class: 'bg-gradient-to-br from-pink-100 via-rose-100 to-red-100', textClass: 'text-rose-800', pattern: 'batik-kawung' },
    sunset: { label: 'Sunset', class: 'bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100', textClass: 'text-orange-800', pattern: 'batik-megamendung' },
    mint: { label: 'Mint', class: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100', textClass: 'text-teal-800', pattern: 'batik-truntum' },
};