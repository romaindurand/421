// Store pour maintenir les connexions SSE actives
const connections = new Set<ReadableStreamDefaultController>();

// Interface pour les événements
export interface SSEEvent {
	type: 'game-updated' | 'game-deleted' | 'game-created' | 'group-updated';
	data: {
		gameId?: string;
		groupId?: string;
		game?: object;
		group?: object;
	};
}

// Fonction pour diffuser un événement à tous les clients connectés
export function broadcastEvent(event: SSEEvent) {
	const message = `data: ${JSON.stringify(event)}\n\n`;
	
	// Envoyer à toutes les connexions actives
	for (const controller of connections) {
		try {
			controller.enqueue(new TextEncoder().encode(message));
		} catch {
			// Supprimer les connexions fermées
			connections.delete(controller);
		}
	}
}

// Fonction pour ajouter une connexion
export function addConnection(controller: ReadableStreamDefaultController) {
	connections.add(controller);
}

// Fonction pour supprimer une connexion
export function removeConnection(controller: ReadableStreamDefaultController) {
	connections.delete(controller);
}
