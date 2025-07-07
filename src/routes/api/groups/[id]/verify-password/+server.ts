import { json } from '@sveltejs/kit';
import { verifyGroupPassword } from '$lib/database.js';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const { id } = params;
		const { password } = await request.json();
		
		if (!id || !password) {
			return json({ success: false, error: 'ID du groupe et mot de passe requis' }, { status: 400 });
		}

		const isValid = await verifyGroupPassword(id, password);
		
		if (!isValid) {
			return json({ success: false, error: 'Mot de passe incorrect' }, { status: 401 });
		}

		// Définir un cookie de session pour ce groupe (valable 30 jours)
		cookies.set(`group_access_${id}`, 'authenticated', {
			maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
			httpOnly: true,
			secure: false, // en développement, mis à true en production
			sameSite: 'lax', // changé de 'strict' à 'lax' pour plus de compatibilité
			path: '/'
		});

		console.log(`Cookie défini pour groupe ${id}:`, {
			name: `group_access_${id}`,
			value: 'authenticated',
			maxAge: 30 * 24 * 60 * 60
		});

		return json({ success: true, message: 'Mot de passe correct' });
	} catch (error) {
		console.error('Erreur lors de la vérification du mot de passe:', error);
		return json({ success: false, error: 'Erreur lors de la vérification' }, { status: 500 });
	}
};
