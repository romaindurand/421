import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, cookies }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json({ success: false, error: 'ID du groupe requis' }, { status: 400 });
		}

		// Supprimer le cookie de session pour ce groupe
		cookies.delete(`group_access_${id}`, { path: '/' });

		return json({ success: true, message: 'Déconnexion réussie' });
	} catch (error) {
		console.error('Erreur lors de la déconnexion:', error);
		return json({ success: false, error: 'Erreur lors de la déconnexion' }, { status: 500 });
	}
};
