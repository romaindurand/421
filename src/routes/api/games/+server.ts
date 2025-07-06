import { json } from '@sveltejs/kit';
import { createGame, getAllGames, initDatabase } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

// Initialiser la base de données au démarrage
await initDatabase();

export const GET: RequestHandler = async () => {
	try {
		const games = await getAllGames();
		return json({ success: true, data: games });
	} catch (error) {
		console.error('Erreur lors de la récupération des parties:', error);
		return json({ success: false, error: 'Erreur lors de la récupération des parties' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { players } = await request.json();
		
		if (!players || !Array.isArray(players) || players.length === 0) {
			return json({ success: false, error: 'Liste de joueurs invalide' }, { status: 400 });
		}

		const newGame = await createGame(players);
		return json({ success: true, data: newGame });
	} catch (error) {
		console.error('Erreur lors de la création de la partie:', error);
		return json({ success: false, error: 'Erreur lors de la création de la partie' }, { status: 500 });
	}
};
