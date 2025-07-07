import { json } from '@sveltejs/kit';
import { getGameById, deleteGame } from '$lib/database.js';
import { broadcastEvent } from '$lib/sse.js';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json({ success: false, error: 'ID de partie requis' }, { status: 400 });
		}

		const result = await getGameById(id);
		
		if (!result) {
			return json({ success: false, error: 'Partie non trouvée' }, { status: 404 });
		}

		return json({ success: true, data: { game: result.game, groupId: result.group.id } });
	} catch (error) {
		console.error('Erreur lors de la récupération de la partie:', error);
		return json({ success: false, error: 'Erreur lors de la récupération de la partie' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json({ success: false, error: 'ID de partie requis' }, { status: 400 });
		}

		// Récupérer les infos de la partie avant suppression pour l'événement SSE
		const gameResult = await getGameById(id);
		if (!gameResult) {
			return json({ success: false, error: 'Partie non trouvée' }, { status: 404 });
		}

		const success = await deleteGame(id);
		
		if (!success) {
			return json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 });
		}

		// Émettre un événement SSE pour notifier tous les clients
		broadcastEvent({
			type: 'game-deleted',
			data: {
				gameId: id,
				groupId: gameResult.group.id
			}
		});

		return json({ success: true, message: 'Partie supprimée avec succès' });
	} catch (error) {
		console.error('Erreur lors de la suppression de la partie:', error);
		return json({ success: false, error: 'Erreur lors de la suppression de la partie' }, { status: 500 });
	}
};
