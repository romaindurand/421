import { json } from '@sveltejs/kit';
import { createGroup, getAllGroups, initDatabase } from '$lib/database.js';
import type { RequestHandler } from '@sveltejs/kit';

// Initialiser la base de données
await initDatabase();

// GET - Récupérer tous les groupes
export const GET: RequestHandler = async () => {
	try {
		const groups = await getAllGroups();
		return json({ success: true, data: groups });
	} catch (error) {
		console.error('Erreur lors de la récupération des groupes:', error);
		return json(
			{ success: false, error: 'Erreur lors de la récupération des groupes' },
			{ status: 500 }
		);
	}
};

// POST - Créer un nouveau groupe
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, playerNames } = await request.json();

		if (!name || !playerNames || !Array.isArray(playerNames)) {
			return json(
				{ success: false, error: 'Nom du groupe et liste de joueurs requis' },
				{ status: 400 }
			);
		}

		if (playerNames.length < 2) {
			return json(
				{ success: false, error: 'Il faut au moins 2 joueurs pour créer un groupe' },
				{ status: 400 }
			);
		}

		const group = await createGroup(name, playerNames);
		return json({ success: true, data: group });
	} catch (error) {
		console.error('Erreur lors de la création du groupe:', error);
		return json(
			{ success: false, error: 'Erreur lors de la création du groupe' },
			{ status: 500 }
		);
	}
};
