import { json } from '@sveltejs/kit';
import { updatePlayerStats } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { id, playerName } = params;
		const { matchesPlayed, defeats, hooked } = await request.json();
		
		if (!id || !playerName) {
			return json({ success: false, error: 'ID de partie et nom de joueur requis' }, { status: 400 });
		}

		if (typeof matchesPlayed !== 'number' || typeof defeats !== 'number') {
			return json({ success: false, error: 'Les statistiques doivent être des nombres' }, { status: 400 });
		}

		if (matchesPlayed < 0 || defeats < 0) {
			return json({ success: false, error: 'Les statistiques ne peuvent pas être négatives' }, { status: 400 });
		}

		if (hooked !== undefined && (typeof hooked !== 'number' || hooked < 0)) {
			return json({ success: false, error: 'Le nombre d\'accrochages doit être un nombre positif' }, { status: 400 });
		}

		const success = await updatePlayerStats(id, decodeURIComponent(playerName), matchesPlayed, defeats, hooked);
		
		if (!success) {
			return json({ success: false, error: 'Joueur ou partie non trouvé' }, { status: 404 });
		}

		return json({ success: true, message: 'Statistiques mises à jour avec succès' });
	} catch (error) {
		console.error('Erreur lors de la mise à jour des statistiques:', error);
		return json({ success: false, error: 'Erreur lors de la mise à jour des statistiques' }, { status: 500 });
	}
};
