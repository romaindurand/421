import { json } from '@sveltejs/kit';
import { getGameById } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json({ success: false, error: 'ID de partie requis' }, { status: 400 });
		}

		const game = await getGameById(id);
		
		if (!game) {
			return json({ success: false, error: 'Partie non trouvée' }, { status: 404 });
		}

		return json({ success: true, data: game });
	} catch (error) {
		console.error('Erreur lors de la récupération de la partie:', error);
		return json({ success: false, error: 'Erreur lors de la récupération de la partie' }, { status: 500 });
	}
};
