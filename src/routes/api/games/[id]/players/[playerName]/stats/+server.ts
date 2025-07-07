import { json } from '@sveltejs/kit';
import { updatePlayerGameStats, initDatabase } from '$lib/database.js';
import { broadcastEvent } from '$lib/sse.js';
import { isPasswordRequired } from '$lib/config.js';
import type { RequestHandler } from '@sveltejs/kit';

// Initialiser la base de données
await initDatabase();

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const { id: gameId, playerName } = params;
		const { statType, increment } = await request.json();
		
		if (!gameId || !playerName) {
			return json({ success: false, error: 'ID de partie et nom de joueur requis' }, { status: 400 });
		}

		if (!statType || !['four21Count', 'four21Rerolls', 'nenetteCount'].includes(statType)) {
			return json({ success: false, error: 'Type de statistique invalide' }, { status: 400 });
		}

		if (typeof increment !== 'number' || ![-1, 1].includes(increment)) {
			return json({ success: false, error: 'Incrément invalide (doit être -1 ou 1)' }, { status: 400 });
		}

		// Récupérer les infos du jeu pour vérifier l'authentification
		const gameResult = await import('$lib/database.js').then(db => db.getGameById(gameId));
		if (!gameResult) {
			return json({ success: false, error: 'Partie non trouvée' }, { status: 404 });
		}

		// Vérifier l'authentification pour le groupe de cette partie (seulement si requis selon la config)
		if (isPasswordRequired()) {
			const sessionCookie = cookies.get(`group_access_${gameResult.group.id}`);
			
			if (!sessionCookie || sessionCookie !== 'authenticated') {
				return json({ success: false, error: 'Accès non autorisé' }, { status: 401 });
			}
		}

		const success = await updatePlayerGameStats(gameId, decodeURIComponent(playerName), statType, increment);
		
		if (!success) {
			return json({ success: false, error: 'Erreur lors de la mise à jour ou valeur négative non autorisée' }, { status: 400 });
		}

		// Récupérer la partie mise à jour pour l'envoyer via SSE
		const updatedGameResult = await import('$lib/database.js').then(db => db.getGameById(gameId));
		if (updatedGameResult) {
			// Émettre un événement SSE pour notifier tous les clients
			broadcastEvent({
				type: 'game-updated',
				data: {
					gameId: gameId,
					groupId: updatedGameResult.group.id,
					game: updatedGameResult.game
				}
			});
		}

		return json({ success: true, message: 'Statistique mise à jour avec succès' });
	} catch (error) {
		console.error('Erreur lors de la mise à jour des statistiques:', error);
		return json({ success: false, error: 'Erreur lors de la mise à jour des statistiques' }, { status: 500 });
	}
};
