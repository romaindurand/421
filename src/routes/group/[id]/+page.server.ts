import { getGroupById, initDatabase } from '$lib/database.js';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

await initDatabase();

export const load: PageServerLoad = async ({ params, cookies }) => {
	const groupId = params.id;
	const group = await getGroupById(groupId);
	
	if (!group) {
		throw error(404, 'Groupe non trouvé');
	}

	// Vérifier si l'utilisateur a accès à ce groupe via un cookie de session
	const sessionCookie = cookies.get(`group_access_${groupId}`);
	
	console.log(`Vérification cookie pour groupe ${groupId}:`, {
		cookieValue: sessionCookie,
		allCookies: cookies.getAll().map(c => ({ name: c.name, value: c.value }))
	});
	
	if (!sessionCookie || sessionCookie !== 'authenticated') {
		console.log(`Redirection requise pour groupe ${groupId} - cookie manquant ou invalide`);
		// Rediriger vers la page d'accueil si l'utilisateur n'est pas authentifié
		throw redirect(302, `/?group=${groupId}&auth=required`);
	}
	
	console.log(`Accès autorisé au groupe ${groupId}`);

	// Retourner les données du groupe sans le mot de passe
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { password, ...groupData } = group;
	
	return {
		group: groupData
	};
};
