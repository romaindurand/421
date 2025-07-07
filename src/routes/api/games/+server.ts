import { json } from '@sveltejs/kit';
import { initDatabase } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

// Initialiser la base de données au démarrage
await initDatabase();

// Cette API est désactivée - les parties sont maintenant créées dans le contexte d'un groupe
export const GET: RequestHandler = async () => {
	return json({ success: false, error: 'API désactivée - utilisez /api/groups/[id]/games' }, { status: 410 });
};

export const POST: RequestHandler = async () => {
	return json({ success: false, error: 'API désactivée - utilisez /api/groups/[id]/games' }, { status: 410 });
};
