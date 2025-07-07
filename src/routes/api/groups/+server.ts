import { json } from '@sveltejs/kit';
import { createGroup, getAllGroups, initDatabase } from '$lib/database.js';
import type { RequestHandler } from '@sveltejs/kit';

// Initialiser la base de données
await initDatabase();

// GET - Récupérer tous les groupes
export const GET: RequestHandler = async () => {
	try {
		const groups = await getAllGroups();
		// Retirer les mots de passe des données envoyées au client
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const groupsWithoutPasswords = groups.map(({ password, ...group }) => group);
		return json({ success: true, data: groupsWithoutPasswords });
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
		const { name, password, playerNames } = await request.json();

		if (!name || !password || !playerNames || !Array.isArray(playerNames)) {
			return json(
				{ success: false, error: 'Nom du groupe, mot de passe et liste de joueurs requis' },
				{ status: 400 }
			);
		}

		if (playerNames.length < 2) {
			return json(
				{ success: false, error: 'Il faut au moins 2 joueurs pour créer un groupe' },
				{ status: 400 }
			);
		}

		const group = await createGroup(name, password, playerNames);
		// Retirer le mot de passe des données retournées
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _, ...groupWithoutPassword } = group;
		return json({ success: true, data: groupWithoutPassword });
	} catch (error) {
		console.error('Erreur lors de la création du groupe:', error);
		return json(
			{ success: false, error: 'Erreur lors de la création du groupe' },
			{ status: 500 }
		);
	}
};
