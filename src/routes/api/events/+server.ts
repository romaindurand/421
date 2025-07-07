import type { RequestHandler } from '@sveltejs/kit';
import { addConnection, removeConnection } from '$lib/sse.js';

export const GET: RequestHandler = async () => {
	const stream = new ReadableStream({
		start(controller) {
			// Ajouter cette connexion à la liste
			addConnection(controller);
			
			// Envoyer l'en-tête SSE
			controller.enqueue(new TextEncoder().encode('data: {"type":"connected"}\n\n'));
			
			// Nettoyer lors de la déconnexion
			const cleanup = () => {
				removeConnection(controller);
			};
			
			// Gérer la déconnexion
			return cleanup;
		},
		
		cancel(controller) {
			// Nettoyer lors de l'annulation
			removeConnection(controller);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Cache-Control'
		}
	});
};
