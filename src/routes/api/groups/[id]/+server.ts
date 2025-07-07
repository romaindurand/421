import { json } from '@sveltejs/kit';
import { getGroupById, deleteGroup, initDatabase } from '$lib/database.js';
import { isPasswordRequired } from '$lib/config.js';
import type { RequestHandler } from '@sveltejs/kit';

// Initialiser la base de données
await initDatabase();

// GET - Récupérer un groupe par ID
export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json(
				{ success: false, error: 'ID du groupe requis' },
				{ status: 400 }
			);
		}

		// Vérifier l'authentification pour ce groupe si requis
		if (isPasswordRequired()) {
			const sessionCookie = cookies.get(`group_access_${id}`);
			
			if (!sessionCookie || sessionCookie !== 'authenticated') {
				return json(
					{ success: false, error: 'Accès non autorisé' },
					{ status: 401 }
				);
			}
		}

		const group = await getGroupById(id);
		
		if (!group) {
			return json(
				{ success: false, error: 'Groupe non trouvé' },
				{ status: 404 }
			);
		}

		// Retourner les données du groupe sans le mot de passe
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...groupData } = group;

		return json({ success: true, data: groupData });
	} catch (error) {
		console.error('Erreur lors de la récupération du groupe:', error);
		return json(
			{ success: false, error: 'Erreur lors de la récupération du groupe' },
			{ status: 500 }
		);
	}
};

// DELETE - Supprimer un groupe
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json(
				{ success: false, error: 'ID du groupe requis' },
				{ status: 400 }
			);
		}

		// Vérifier l'authentification pour ce groupe
		const sessionCookie = cookies.get(`group_access_${id}`);
		
		if (!sessionCookie || sessionCookie !== 'authenticated') {
			return json(
				{ success: false, error: 'Accès non autorisé' },
				{ status: 401 }
			);
		}

		const success = await deleteGroup(id);
		
		if (!success) {
			return json(
				{ success: false, error: 'Groupe non trouvé' },
				{ status: 404 }
			);
		}

		// Supprimer le cookie de session lors de la suppression du groupe
		cookies.delete(`group_access_${id}`, { path: '/' });

		return json({ success: true });
	} catch (error) {
		console.error('Erreur lors de la suppression du groupe:', error);
		return json(
			{ success: false, error: 'Erreur lors de la suppression du groupe' },
			{ status: 500 }
		);
	}
};
