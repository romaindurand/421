import { json } from '@sveltejs/kit';
import { updatePlayerInGame } from '$lib/database.js';
import type { RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { id, playerName } = params;
		const { action } = await request.json();
		
		if (!id || !playerName) {
			return json({ success: false, error: 'ID de partie et nom de joueur requis' }, { status: 400 });
		}

		if (!action || (action !== 'toggle-lost' && action !== 'toggle-hooked')) {
			return json({ success: false, error: 'Action invalide. Utilisez "toggle-lost" ou "toggle-hooked"' }, { status: 400 });
		}

		// Récupérer l'état actuel du joueur pour toggle correctement
		const gameResult = await import('$lib/database.js').then(db => db.getGameById(id));
		if (!gameResult) {
			return json({ success: false, error: 'Partie non trouvée' }, { status: 404 });
		}

		const player = gameResult.game.players.find(p => p.name === decodeURIComponent(playerName));
		if (!player) {
			return json({ success: false, error: 'Joueur non trouvé' }, { status: 404 });
		}

		// Appliquer l'action avec les bons paramètres booléens
		let success = false;
		if (action === 'toggle-lost') {
			success = await updatePlayerInGame(id, decodeURIComponent(playerName), !player.lost, undefined);
		} else if (action === 'toggle-hooked') {
			success = await updatePlayerInGame(id, decodeURIComponent(playerName), undefined, !player.hooked);
		}
		
		if (!success) {
			return json({ success: false, error: 'Erreur lors de la mise à jour' }, { status: 500 });
		}

		return json({ success: true, message: 'Statut du joueur mis à jour avec succès' });
	} catch (error) {
		console.error('Erreur lors de la mise à jour du statut:', error);
		return json({ success: false, error: 'Erreur lors de la mise à jour du statut' }, { status: 500 });
	}
};
