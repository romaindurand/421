import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Types pour la base de données
export interface Player {
	name: string;
	matchesPlayed: number;
	defeats: number;
	hooked: number; // Nombre de fois où le joueur a été "accroché"
}

export interface Game {
	id: string;
	players: Player[];
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
export async function createGame(playerNames: string[]): Promise<Game> {
	await db.read();
	
	// Convertir les noms en objets Player
	const players: Player[] = playerNames.map(name => ({
		name,
		matchesPlayed: 0,
		defeats: 0,
		hooked: 0
	}));
	
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

// Fonction pour mettre à jour les statistiques d'un joueur
export async function updatePlayerStats(gameId: string, playerName: string, matchesPlayed: number, defeats: number, hooked?: number): Promise<boolean> {
	await db.read();
	
	const game = db.data!.games.find(g => g.id === gameId);
	if (!game) {
		return false;
	}
	
	const player = game.players.find(p => p.name === playerName);
	if (!player) {
		return false;
	}
	
	player.matchesPlayed = matchesPlayed;
	player.defeats = defeats;
	if (hooked !== undefined) {
		player.hooked = hooked;
	}
	game.updatedAt = new Date().toISOString();
	
	await db.write();
	return true;
}

// Fonction pour incrémenter le nombre de manches jouées d'un joueur
export async function incrementPlayerMatches(gameId: string, playerName: string): Promise<boolean> {
	await db.read();
	
	const game = db.data!.games.find(g => g.id === gameId);
	if (!game) {
		return false;
	}
	
	const player = game.players.find(p => p.name === playerName);
	if (!player) {
		return false;
	}
	
	player.matchesPlayed += 1;
	game.updatedAt = new Date().toISOString();
	
	await db.write();
	return true;
}

// Fonction pour incrémenter le nombre de défaites d'un joueur
export async function incrementPlayerDefeats(gameId: string, playerName: string): Promise<boolean> {
	await db.read();
	
	const game = db.data!.games.find(g => g.id === gameId);
	if (!game) {
		return false;
	}
	
	const player = game.players.find(p => p.name === playerName);
	if (!player) {
		return false;
	}
	
	player.defeats += 1;
	game.updatedAt = new Date().toISOString();
	
	await db.write();
	return true;
}

// Fonction pour incrémenter le nombre de fois où un joueur a été accroché
export async function incrementPlayerHooked(gameId: string, playerName: string): Promise<boolean> {
	await db.read();
	
	const game = db.data!.games.find(g => g.id === gameId);
	if (!game) {
		return false;
	}
	
	const player = game.players.find(p => p.name === playerName);
	if (!player) {
		return false;
	}
	
	player.hooked += 1;
	game.updatedAt = new Date().toISOString();
	
	await db.write();
	return true;
}

// Fonction utilitaire pour générer un ID unique
function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
