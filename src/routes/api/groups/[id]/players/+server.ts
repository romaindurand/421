import { json } from '@sveltejs/kit';
import { addPlayerToGroup, initDatabase } from '$lib/database.js';
import { isPasswordRequired } from '$lib/config.js';
import type { RequestHandler } from '@sveltejs/kit';

// Initialiser la base de données
await initDatabase();

// POST - Ajouter un joueur au groupe
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const { id: groupId } = params;
		
		if (!groupId) {
			return json(
				{ success: false, error: 'ID du groupe requis' },
				{ status: 400 }
			);
		}

		// Vérifier l'authentification pour ce groupe (seulement si requis selon la config)
		if (isPasswordRequired()) {
			const sessionCookie = cookies.get(`group_access_${groupId}`);
			
			if (!sessionCookie || sessionCookie !== 'authenticated') {
				return json(
					{ success: false, error: 'Accès non autorisé' },
					{ status: 401 }
				);
			}
		}

		const { playerName } = await request.json();

		if (!playerName || typeof playerName !== 'string') {
			return json(
				{ success: false, error: 'Nom de joueur requis' },
				{ status: 400 }
			);
		}

		// Validation du nom de joueur
		const trimmedName = playerName.trim();
		if (trimmedName.length === 0) {
			return json(
				{ success: false, error: 'Le nom de joueur ne peut pas être vide' },
				{ status: 400 }
			);
		}

		if (trimmedName.length > 50) {
			return json(
				{ success: false, error: 'Le nom de joueur ne peut pas dépasser 50 caractères' },
				{ status: 400 }
			);
		}

		const success = await addPlayerToGroup(groupId, trimmedName);
		
		if (!success) {
			return json(
				{ success: false, error: 'Impossible d\'ajouter le joueur (groupe non trouvé ou joueur déjà existant)' },
				{ status: 400 }
			);
		}

		return json({ 
			success: true, 
			message: `Joueur "${trimmedName}" ajouté avec succès`,
			playerName: trimmedName
		});
	} catch (error) {
		console.error('Erreur lors de l\'ajout du joueur:', error);
		return json(
			{ success: false, error: 'Erreur lors de l\'ajout du joueur' },
			{ status: 500 }
		);
	}
};
