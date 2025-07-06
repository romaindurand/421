import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Types pour la base de données
export interface Game {
	id: string;
	players: string[];
	createdAt: string;
	updatedAt: string;
}

export interface DatabaseData {
	games: Game[];
}

// Configuration de la base de données
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '../../data/db.json');
const adapter = new JSONFile<DatabaseData>(file);
const db = new Low(adapter, { games: [] });

// Fonction pour initialiser la base de données
export async function initDatabase(): Promise<void> {
	await db.read();
	db.data ||= { games: [] };
	await db.write();
}

// Fonction pour créer une nouvelle partie avec des joueurs
export async function createGame(players: string[]): Promise<Game> {
	await db.read();
	
	const newGame: Game = {
		id: generateId(),
		players,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	db.data!.games.push(newGame);
	await db.write();

	return newGame;
}

// Fonction pour récupérer toutes les parties
export async function getAllGames(): Promise<Game[]> {
	await db.read();
	return db.data!.games || [];
}

// Fonction pour récupérer une partie par ID
export async function getGameById(id: string): Promise<Game | undefined> {
	await db.read();
	return db.data!.games.find(game => game.id === id);
}

// Fonction pour supprimer une partie
export async function deleteGame(id: string): Promise<boolean> {
	await db.read();
	const initialLength = db.data!.games.length;
	db.data!.games = db.data!.games.filter(game => game.id !== id);
	
	if (db.data!.games.length < initialLength) {
		await db.write();
		return true;
	}
	return false;
}

// Fonction utilitaire pour générer un ID unique
function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
