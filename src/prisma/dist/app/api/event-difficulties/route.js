"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function GET() {
    try {
        const eventDifficulties = await prisma.eventDifficulty.findMany({
            orderBy: {
                id: 'asc',
            },
        });
        return server_1.NextResponse.json(eventDifficulties);
    }
    catch (error) {
        console.error('Error fetching event difficulties:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return server_1.NextResponse.json({ error: 'Failed to fetch event difficulties', details: errorMessage }, { status: 500 });
    }
}
