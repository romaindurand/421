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
	// Nouvelles statistiques de jeu
	four21Count: number;      // Nombre de 421 réussis
	four21Rerolls: number;    // Nombre de 421 relancés
	nenetteCount: number;     // Nombre de nenettes (2/2/1)
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

// Fonction pour déterminer le bon chemin de la base de données
function getDatabasePath(): string {
	// En production (build), essayer d'abord le chemin relatif au build
	const productionPath = join(process.cwd(), 'data/db.json');
	
	// En développement, utiliser le chemin relatif au fichier source
	const developmentPath = join(__dirname, '../../data/db.json');
	
	// Vérifier si on est en production en regardant si __dirname contient 'build'
	if (__dirname.includes('build') || process.env.NODE_ENV === 'production') {
		return productionPath;
	} else {
		return developmentPath;
	}
}

const file = getDatabasePath();
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
	// Debug des chemins (seulement en développement)
	if (process.env.NODE_ENV !== 'production') {
		console.log('🔍 Debug database path:');
		console.log('  - __dirname:', __dirname);
		console.log('  - process.cwd():', process.cwd());
		console.log('  - NODE_ENV:', process.env.NODE_ENV);
		console.log('  - Database file path:', file);
	}
	
	// Créer le répertoire data si nécessaire
	try {
		await mkdir(dirname(file), { recursive: true });
		if (process.env.NODE_ENV !== 'production') {
			console.log('📁 Directory created/verified:', dirname(file));
		}
	} catch (error) {
		console.error('❌ Error creating directory:', error);
	}
	
	try {
		await db.read();
		db.data ||= { groups: [] };
		await db.write();
		
		if (process.env.NODE_ENV !== 'production') {
			console.log('✅ Database loaded successfully');
			console.log('  - Number of groups:', db.data.groups.length);
		}
		
		// Migrer automatiquement les mots de passe en clair vers des hashes
		await migratePasswordsToHash();
		
		// Migrer automatiquement les anciennes parties sans statistiques de jeu
		await migrateGameStats();
	} catch (error) {
		console.error('❌ Error reading/writing database:', error);
	}
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

// Fonction pour ajouter un joueur à un groupe
export async function addPlayerToGroup(groupId: string, playerName: string): Promise<boolean> {
	await db.read();
	
	const group = db.data!.groups.find(g => g.id === groupId);
	if (!group) {
		return false;
	}
	
	// Vérifier si le joueur n'existe pas déjà
	if (group.playerNames.includes(playerName)) {
		return false;
	}
	
	// Ajouter le joueur
	group.playerNames.push(playerName);
	group.updatedAt = new Date().toISOString();
	
	await db.write();
	return true;
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
			hooked: false,
			four21Count: 0,
			four21Rerolls: 0,
			nenetteCount: 0
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
						// et le joueur perdant est automatiquement marqué comme accroché
						game.players.forEach(p => {
							if (p.name === playerName) {
								p.lost = true;
								p.hooked = true; // Automatiquement accroché quand perdant
							} else {
								p.lost = false;
							}
						});
					} else {
						// Si on retire le statut perdant, seul ce joueur change
						// (on ne modifie pas automatiquement le statut accroché dans ce cas)
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

// Fonction pour mettre à jour les statistiques de jeu d'un joueur
export async function updatePlayerGameStats(
	gameId: string, 
	playerName: string, 
	statType: 'four21Count' | 'four21Rerolls' | 'nenetteCount',
	increment: number
): Promise<boolean> {
	await db.read();
	
	for (const group of db.data!.groups) {
		const game = group.games.find(g => g.id === gameId);
		if (game) {
			const player = game.players.find(p => p.name === playerName);
			if (player) {
				// Mettre à jour la statistique demandée
				const newValue = player[statType] + increment;
				
				// S'assurer que la valeur ne devient pas négative
				if (newValue >= 0) {
					player[statType] = newValue;
					group.updatedAt = new Date().toISOString();
					await db.write();
					return true;
				}
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

/**
 * Migre les anciennes parties sans statistiques de jeu
 */
export async function migrateGameStats(): Promise<number> {
	await db.read();
	
	let migratedPlayersCount = 0;
	
	for (const group of db.data!.groups) {
		for (const game of group.games) {
			for (const player of game.players) {
				// Vérifier si le joueur a déjà les nouvelles statistiques
				if (player.four21Count === undefined) {
					player.four21Count = 0;
					player.four21Rerolls = 0;
					player.nenetteCount = 0;
					migratedPlayersCount++;
				}
			}
		}
	}
	
	if (migratedPlayersCount > 0) {
		await db.write();
		if (process.env.NODE_ENV !== 'production') {
			console.log(`Migration des statistiques terminée: ${migratedPlayersCount} joueur(s) migré(s)`);
		}
	}
	
	return migratedPlayersCount;
}

// Fonction utilitaire pour générer un ID unique
function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
