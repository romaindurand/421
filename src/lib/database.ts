import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import { createHash, randomBytes } from 'node:crypto';

// Types pour la base de données
export interface PlayerInGame {
	name: string;
	lost: boolean;
	hooked: boolean;
}

export interface Game {
	id: string;
	date: string;
	players: PlayerInGame[];
}

export interface Group {
	id: string;
	name: string;
	password: string; // Hash du mot de passe
	passwordSalt: string; // Salt pour le hachage
	playerNames: string[];
	games: Game[];
	createdAt: string;
	updatedAt: string;
}

export interface DatabaseData {
	groups: Group[];
}

// Configuration de la base de données
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '../../data/db.json');
const adapter = new JSONFile<DatabaseData>(file);
const db = new Low(adapter, { groups: [] });

// ============= FONCTIONS DE SÉCURITÉ POUR LES MOTS DE PASSE =============

/**
 * Génère un salt aléatoire
 */
function generateSalt(): string {
	return randomBytes(16).toString('hex');
}

/**
 * Hache un mot de passe avec un salt
 */
function hashPassword(password: string, salt: string): string {
	return createHash('sha256')
		.update(password + salt)
		.digest('hex');
}

/**
 * Hache un mot de passe avec un nouveau salt
 */
function hashPasswordWithSalt(password: string): { hash: string; salt: string } {
	const salt = generateSalt();
	const hash = hashPassword(password, salt);
	return { hash, salt };
}

/**
 * Vérifie un mot de passe contre un hash stocké
 */
function verifyPassword(password: string, storedHash: string, salt: string): boolean {
	const hashToVerify = hashPassword(password, salt);
	return hashToVerify === storedHash;
}

// ============= FONCTIONS POUR LA BASE DE DONNÉES =============

// Fonction pour initialiser la base de données
export async function initDatabase(): Promise<void> {
	// Créer le répertoire data si nécessaire
	try {
		await mkdir(dirname(file), { recursive: true });
	} catch {
		// Le répertoire existe déjà, ignorer l'erreur
	}
	
	await db.read();
	db.data ||= { groups: [] };
	await db.write();
	
	// Migrer automatiquement les mots de passe en clair vers des hashes
	await migratePasswordsToHash();
}

// ============= FONCTIONS POUR LES GROUPES =============

// Fonction pour créer un nouveau groupe avec des joueurs
export async function createGroup(name: string, password: string, playerNames: string[]): Promise<Group> {
	await db.read();
	
	// Hacher le mot de passe avec un salt
	const { hash, salt } = hashPasswordWithSalt(password);
	
	const newGroup: Group = {
		id: generateId(),
		name,
		password: hash, // Stocker le hash au lieu du mot de passe en clair
		passwordSalt: salt, // Stocker le salt
		playerNames,
		games: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	db.data!.groups.push(newGroup);
	await db.write();

	return newGroup;
}

// Fonction pour récupérer tous les groupes
export async function getAllGroups(): Promise<Group[]> {
	await db.read();
	return db.data!.groups || [];
}

// Fonction pour récupérer un groupe par ID
export async function getGroupById(id: string): Promise<Group | undefined> {
	await db.read();
	return db.data!.groups.find(group => group.id === id);
}

// Fonction pour vérifier le mot de passe d'un groupe
export async function verifyGroupPassword(id: string, password: string): Promise<boolean> {
	await db.read();
	const group = db.data!.groups.find(group => group.id === id);
	
	if (!group) {
		return false;
	}
	
	// Vérifier le mot de passe avec le hash et le salt stockés
	return verifyPassword(password, group.password, group.passwordSalt);
}

// Fonction pour supprimer un groupe
export async function deleteGroup(id: string): Promise<boolean> {
	await db.read();
	const initialLength = db.data!.groups.length;
	db.data!.groups = db.data!.groups.filter(group => group.id !== id);
	
	if (db.data!.groups.length < initialLength) {
		await db.write();
		return true;
	}
	return false;
}

// ============= FONCTIONS POUR LES PARTIES =============

// Fonction pour créer une nouvelle partie dans un groupe
export async function createGameInGroup(groupId: string, playerNames: string[]): Promise<Game | null> {
	await db.read();
	
	const group = db.data!.groups.find(g => g.id === groupId);
	if (!group) {
		return null;
	}
	
	// Vérifier que tous les joueurs font partie du groupe
	const invalidPlayers = playerNames.filter(name => !group.playerNames.includes(name));
	if (invalidPlayers.length > 0) {
		throw new Error(`Les joueurs suivants ne font pas partie du groupe: ${invalidPlayers.join(', ')}`);
	}
	
	const newGame: Game = {
		id: generateId(),
		date: new Date().toISOString(),
		players: playerNames.map(name => ({
			name,
			lost: false,
			hooked: false
		}))
	};

	group.games.push(newGame);
	group.updatedAt = new Date().toISOString();
	await db.write();

	return newGame;
}

// Fonction pour récupérer une partie spécifique
export async function getGameById(gameId: string): Promise<{ group: Group; game: Game } | null> {
	await db.read();
	
	for (const group of db.data!.groups) {
		const game = group.games.find(g => g.id === gameId);
		if (game) {
			return { group, game };
		}
	}
	
	return null;
}

// Fonction pour mettre à jour le statut d'un joueur dans une partie
export async function updatePlayerInGame(gameId: string, playerName: string, lost?: boolean, hooked?: boolean): Promise<boolean> {
	await db.read();
	
	for (const group of db.data!.groups) {
		const game = group.games.find(g => g.id === gameId);
		if (game) {
			const player = game.players.find(p => p.name === playerName);
			if (player) {
				// Mettre à jour le statut "hooked"
				if (hooked !== undefined) {
					player.hooked = hooked;
				}
				
				// Logique spéciale pour le statut "lost" : un seul perdant par partie
				if (lost !== undefined) {
					if (lost === true) {
						// Si on marque ce joueur comme perdant, tous les autres deviennent gagnants
						game.players.forEach(p => {
							p.lost = (p.name === playerName);
						});
					} else {
						// Si on retire le statut perdant, seul ce joueur change
						player.lost = false;
					}
				}
				
				group.updatedAt = new Date().toISOString();
				await db.write();
				return true;
			}
		}
	}
	
	return false;
}

// Fonction pour supprimer une partie
export async function deleteGame(gameId: string): Promise<boolean> {
	await db.read();
	
	for (const group of db.data!.groups) {
		const initialLength = group.games.length;
		group.games = group.games.filter(game => game.id !== gameId);
		
		if (group.games.length < initialLength) {
			group.updatedAt = new Date().toISOString();
			await db.write();
			return true;
		}
	}
	
	return false;
}

// ============= FONCTIONS DE MIGRATION =============

/**
 * Migre les mots de passe en clair vers des mots de passe hachés
 */
export async function migratePasswordsToHash(): Promise<number> {
	await db.read();
	
	let migratedCount = 0;
	
	for (const group of db.data!.groups) {
		// Vérifier si le groupe a déjà un salt (donc déjà migré)
		if (!group.passwordSalt) {
			console.log(`Migration du mot de passe pour le groupe: ${group.name}`);
			
			// Le mot de passe est en clair, le hacher
			const { hash, salt } = hashPasswordWithSalt(group.password);
			
			group.password = hash;
			group.passwordSalt = salt;
			group.updatedAt = new Date().toISOString();
			
			migratedCount++;
		}
	}
	
	if (migratedCount > 0) {
		await db.write();
		console.log(`Migration terminée: ${migratedCount} groupe(s) migré(s)`);
	}
	
	return migratedCount;
}

// Fonction utilitaire pour générer un ID unique
function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
