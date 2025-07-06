import { getGroupById, initDatabase } from '$lib/database.js';
import { error } from '@sveltejs/kit';

await initDatabase();

export const load = async ({ params }: { params: { id: string } }) => {
	const group = await getGroupById(params.id);
	
	if (!group) {
		throw error(404, 'Groupe non trouvé');
	}

	return {
		group
	};
};
