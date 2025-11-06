"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
/**
 * 特定のイベントの状態（特に isStarted）を取得するAPIエンドポイント
 */
async function GET(request, { params }) {
    const eventId = parseInt(params.eventId, 10);
    if (isNaN(eventId)) {
        return server_1.NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    try {
        const event = await prisma_1.prisma.create_event.findUnique({
            where: { id: eventId },
            select: { isStarted: true, hasBeenStarted: true }, // hasBeenStartedも取得
        });
        if (!event) {
            return server_1.NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }
        return server_1.NextResponse.json({ isStarted: event.isStarted, hasBeenStarted: event.hasBeenStarted });
    }
    catch (error) {
        console.error(`Failed to get status for event ${eventId}:`, error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
