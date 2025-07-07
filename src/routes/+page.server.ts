import { getAllGroups, initDatabase } from '$lib/database.js';
import type { PageServerLoad } from './$types';

await initDatabase();

export const load: PageServerLoad = async () => {
	try {
		const groups = await getAllGroups();
		// Retirer les mots de passe et sels des données envoyées au client
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const groupsWithoutPasswords = groups.map(({ password, passwordSalt, ...group }) => group);
		
		return {
			groups: groupsWithoutPasswords
		};
	} catch (error) {
		console.error('Erreur lors du chargement des groupes:', error);
		return {
			groups: []
		};
	}
};
