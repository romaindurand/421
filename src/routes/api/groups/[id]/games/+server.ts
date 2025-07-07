import { json } from '@sveltejs/kit';
import { createGameInGroup, initDatabase } from '$lib/database.js';
import { broadcastEvent } from '$lib/sse.js';
import type { RequestHandler } from '@sveltejs/kit';

// Initialiser la base de données
await initDatabase();

// POST - Créer une nouvelle partie dans un groupe
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id: groupId } = params;
		
		if (!groupId) {
			return json(
				{ success: false, error: 'ID du groupe requis' },
				{ status: 400 }
			);
		}

		const { playerNames } = await request.json();

		if (!playerNames || !Array.isArray(playerNames)) {
			return json(
				{ success: false, error: 'Liste de joueurs requise' },
				{ status: 400 }
			);
		}

		if (playerNames.length < 2) {
			return json(
				{ success: false, error: 'Il faut au moins 2 joueurs pour créer une partie' },
				{ status: 400 }
			);
		}

		const game = await createGameInGroup(groupId, playerNames);
		
		if (!game) {
			return json(
				{ success: false, error: 'Groupe non trouvé' },
				{ status: 404 }
			);
		}

		// Émettre un événement SSE pour notifier tous les clients
		broadcastEvent({
			type: 'game-created',
			data: {
				gameId: game.id,
				groupId: groupId,
				game: game
			}
		});

		return json({ success: true, data: game });
	} catch (error) {
		console.error('Erreur lors de la création de la partie:', error);
		return json(
			{ success: false, error: 'Erreur lors de la création de la partie' },
			{ status: 500 }
		);
	}
};
