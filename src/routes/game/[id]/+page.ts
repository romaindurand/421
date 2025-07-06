import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch(`/api/games/${params.id}`);
		const result = await response.json();

		if (result.success) {
			return {
				game: result.data.game,
				groupId: result.data.groupId
			};
		} else {
			return {
				error: result.error || 'Partie non trouvée'
			};
		}
	} catch (error) {
		console.error('Erreur lors du chargement de la partie:', error);
		return {
			error: 'Erreur lors du chargement de la partie'
		};
	}
};
