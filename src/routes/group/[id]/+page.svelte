<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import confetti from 'canvas-confetti';
	import { slide } from 'svelte/transition';

	interface Game {
		id: string;
		date: string;
		players: Array<{
			name: string;
			lost: boolean;
			hooked: boolean;
		}>;
	}

	interface Group {
		id: string;
		name: string;
		playerNames: string[];
		games: Game[];
		createdAt: string;
		updatedAt: string;
	}

	export let data: { group: Group };
	$: group = data.group;

	let selectedPlayers: string[] = [];
	let errorMessage = '';
	let successMessage = '';
	let isLoading = false;

	// Variables pour le système d'onglets du panneau d'informations
	let activeTab: 'defeat-rate' | 'normalized-score' | 'hooked-defeat-rate' = 'defeat-rate';

	// Variables pour l'ajout de joueur
	let newPlayerName = '';
	let isAddingPlayer = false;
	let addPlayerError = '';
	let showAddPlayerForm = false;

	// Variables pour la suppression avec progression
	let deletingGameId: string | null = null;
	let deleteProgress = 0;
	let deleteTimeout: NodeJS.Timeout | null = null;
	let deleteInterval: NodeJS.Timeout | null = null;
	let disappearingGames: Set<string> = new Set();

	// Variables pour Server-Sent Events
	let eventSource: EventSource | null = null;

	// Fonction pour calculer le taux de défaite classique
	function calculateDefeatRate(playerName: string): number {
		let totalGames = 0;
		let defeats = 0;

		group.games.forEach((game) => {
			const player = game.players.find((p) => p.name === playerName);
			if (player) {
				totalGames++;
				if (player.lost) {
					defeats++;
				}
			}
		});

		return totalGames === 0 ? 0 : (defeats / totalGames) * 100;
	}

	// Fonction pour calculer le taux de défaite uniquement sur les parties où le joueur a été accroché
	function calculateHookedDefeatRate(playerName: string): {
		rate: number;
		hookedGames: number;
		hookedDefeats: number;
	} {
		let hookedGames = 0;
		let hookedDefeats = 0;

		group.games.forEach((game) => {
			const player = game.players.find((p) => p.name === playerName);
			if (player && player.hooked) {
				hookedGames++;
				if (player.lost) {
					hookedDefeats++;
				}
			}
		});

		return {
			rate: hookedGames === 0 ? 0 : (hookedDefeats / hookedGames) * 100,
			hookedGames,
			hookedDefeats
		};
	}

	// Sélectionner tous les joueurs par défaut et configurer SSE
	onMount(() => {
		selectedPlayers = [...group.playerNames];
		setupSSE();
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
	});

	function setupSSE() {
		// Connecter aux Server-Sent Events
		eventSource = new EventSource('/api/events');

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				handleSSEEvent(data);
			} catch (error) {
				console.error("Erreur lors du parsing de l'événement SSE:", error);
			}
		};

		eventSource.onerror = (error) => {
			console.error('Erreur SSE:', error);
		};
	}

	function handleSSEEvent(event: any) {
		switch (event.type) {
			case 'game-created':
				if (event.data.groupId === group.id) {
					// Ajouter la nouvelle partie à la liste
					group.games = [...group.games, event.data.game];
					successMessage = 'Nouvelle partie créée !';
					setTimeout(() => {
						successMessage = '';
					}, 3000);
				}
				break;

			case 'game-updated':
				if (event.data.groupId === group.id) {
					// Mettre à jour la partie existante
					const gameIndex = group.games.findIndex((g) => g.id === event.data.gameId);
					if (gameIndex !== -1) {
						group.games[gameIndex] = event.data.game;
						group.games = [...group.games]; // Force reactivity
					}
				}
				break;

			case 'game-deleted':
				if (event.data.groupId === group.id) {
					// Supprimer la partie de la liste
					group.games = group.games.filter((g) => g.id !== event.data.gameId);
					successMessage = 'Partie supprimée !';
					setTimeout(() => {
						successMessage = '';
					}, 3000);
				}
				break;
		}
	}

	function togglePlayer(playerName: string) {
		if (selectedPlayers.includes(playerName)) {
			selectedPlayers = selectedPlayers.filter((p) => p !== playerName);
		} else {
			selectedPlayers = [...selectedPlayers, playerName];
		}
		errorMessage = '';
	}

	function selectAll() {
		selectedPlayers = [...group.playerNames];
	}

	function selectNone() {
		selectedPlayers = [];
	}

	async function createGame() {
		if (selectedPlayers.length < 2) {
			errorMessage = 'Il faut au moins 2 joueurs pour créer une partie';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch(`/api/groups/${group.id}/games`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerNames: selectedPlayers
				})
			});

			const result = await response.json();

			if (result.success) {
				successMessage = 'Partie créée avec succès !';

				// Trigger confetti
				confetti({
					particleCount: 100,
					spread: 70,
					origin: { y: 0.6 }
				});

				// Redirect to the game page (SSE va notifier les autres utilisateurs)
				setTimeout(() => {
					window.location.href = `/game/${result.data.id}`;
				}, 1500);
			} else {
				errorMessage = result.error || 'Erreur lors de la création de la partie';
			}
		} catch (error) {
			console.error('Erreur lors de la création de la partie:', error);
			errorMessage = 'Erreur lors de la création de la partie';
		}

		isLoading = false;
	}

	async function addPlayer() {
		if (!newPlayerName.trim()) {
			addPlayerError = 'Le nom de joueur ne peut pas être vide';
			return;
		}

		if (newPlayerName.trim().length > 50) {
			addPlayerError = 'Le nom de joueur ne peut pas dépasser 50 caractères';
			return;
		}

		if (group.playerNames.includes(newPlayerName.trim())) {
			addPlayerError = 'Ce joueur existe déjà dans le groupe';
			return;
		}

		isAddingPlayer = true;
		addPlayerError = '';

		try {
			const response = await fetch(`/api/groups/${group.id}/players`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerName: newPlayerName.trim()
				})
			});

			const result = await response.json();

			if (result.success) {
				// Ajouter le joueur à la liste locale
				group.playerNames = [...group.playerNames, result.playerName];
				newPlayerName = '';
				showAddPlayerForm = false;
				successMessage = `Joueur "${result.playerName}" ajouté avec succès !`;
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				addPlayerError = result.error || "Erreur lors de l'ajout du joueur";
			}
		} catch (error) {
			console.error("Erreur lors de l'ajout du joueur:", error);
			addPlayerError = "Erreur lors de l'ajout du joueur";
		}

		isAddingPlayer = false;
	}

	function cancelAddPlayer() {
		showAddPlayerForm = false;
		newPlayerName = '';
		addPlayerError = '';
	}

	function startDeleteGame(gameId: string) {
		if (deletingGameId === gameId) return; // Éviter les doubles clics

		deletingGameId = gameId;
		deleteProgress = 0;

		// Animation de progression (2 secondes = 2000ms)
		deleteInterval = setInterval(() => {
			deleteProgress += 2; // 2% toutes les 40ms = 100% en 2000ms
			if (deleteProgress >= 100) {
				deleteProgress = 100;
				clearInterval(deleteInterval!);
			}
		}, 40);

		// Suppression après 2 secondes
		deleteTimeout = setTimeout(async () => {
			await executeDeleteGame(gameId);
		}, 2000);
	}

	function cancelDeleteGame() {
		if (deleteTimeout) {
			clearTimeout(deleteTimeout);
			deleteTimeout = null;
		}
		if (deleteInterval) {
			clearInterval(deleteInterval);
			deleteInterval = null;
		}
		deletingGameId = null;
		deleteProgress = 0;
	}

	async function executeDeleteGame(gameId: string) {
		try {
			const response = await fetch(`/api/games/${gameId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				// Trigger confetti
				confetti({
					particleCount: 50,
					spread: 70,
					origin: { y: 0.6 },
					colors: ['#ef4444', '#f97316']
				});
				// Note: SSE va gérer la mise à jour de la liste des parties
			} else {
				errorMessage = result.error || 'Erreur lors de la suppression de la partie';
			}
		} catch (error) {
			console.error('Erreur lors de la suppression de la partie:', error);
			errorMessage = 'Erreur lors de la suppression de la partie';
		}

		// Reset des variables
		cancelDeleteGame();
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);

			// Trigger confetti effect
			confetti({
				particleCount: 50,
				spread: 50,
				origin: { y: 0.7 }
			});
		} catch (err) {
			console.error('Erreur lors de la copie:', err);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function logout() {
		try {
			const response = await fetch(`/api/groups/${group.id}/logout`, {
				method: 'POST'
			});

			if (response.ok) {
				// Rediriger vers la page d'accueil après la déconnexion
				window.location.href = '/';
			} else {
				console.error('Erreur lors de la déconnexion');
			}
		} catch (error) {
			console.error('Erreur lors de la déconnexion:', error);
		}
	}

	// Fonction pour calculer le score normalisé qui prend en compte le nombre de joueurs
	function calculateNormalizedScore(playerName: string): number {
		let totalWeightedScore = 0;
		let totalWeight = 0;

		group.games.forEach((game) => {
			const player = game.players.find((p) => p.name === playerName);
			if (player) {
				const playerCount = game.players.length;
				const theoreticalDefeatRate = 100 / playerCount; // Probabilité théorique de perdre
				const actualDefeat = player.lost ? 100 : 0; // 100% si perdu, 0% si gagné
				const normalizedScore = (actualDefeat / theoreticalDefeatRate) * 100;

				// Pondération par le nombre de joueurs pour donner plus de poids aux parties difficiles
				const weight = playerCount;
				totalWeightedScore += normalizedScore * weight;
				totalWeight += weight;
			}
		});

		return totalWeight === 0 ? 0 : totalWeightedScore / totalWeight;
	}

	// Fonction pour obtenir les joueurs triés par taux de défaite ou score normalisé
	function getPlayersSortedByDefeatRate() {
		return group.playerNames
			.map((playerName) => {
				const hookedStats = calculateHookedDefeatRate(playerName);
				return {
					name: playerName,
					defeatRate: calculateDefeatRate(playerName),
					normalizedScore: calculateNormalizedScore(playerName),
					hookedDefeatRate: hookedStats.rate,
					hookedGames: hookedStats.hookedGames,
					hookedDefeats: hookedStats.hookedDefeats,
					totalGames: group.games.filter((game) => game.players.some((p) => p.name === playerName))
						.length,
					avgPlayersPerGame:
						group.games
							.filter((game) => game.players.some((p) => p.name === playerName))
							.reduce((sum, game) => sum + game.players.length, 0) /
						Math.max(
							1,
							group.games.filter((game) => game.players.some((p) => p.name === playerName)).length
						)
				};
			})
			.sort((a, b) => {
				// Tri selon l'onglet actif
				if (activeTab === 'normalized-score') {
					return a.normalizedScore - b.normalizedScore;
				} else if (activeTab === 'hooked-defeat-rate') {
					return a.hookedDefeatRate - b.hookedDefeatRate;
				} else {
					return a.defeatRate - b.defeatRate;
				}
			});
	}
</script>

<svelte:head>
	<title>Groupe {group.name} - 421</title>
</svelte:head>

<div class="mx-auto min-h-screen max-w-4xl bg-gray-900 p-8 font-sans text-gray-100">
	<!-- En-tête -->
	<div class="mb-8">
		<div class="mb-4 flex items-center justify-between">
			<a
				href="/"
				class="inline-flex w-fit items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-gray-100 transition-colors duration-200 hover:bg-gray-600"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Retour aux groupes
			</a>

			<button
				on:click={logout}
				class="inline-flex w-fit items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-red-100 transition-colors duration-200 hover:bg-red-600"
				title="Se déconnecter de ce groupe"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				Se déconnecter
			</button>
		</div>
		<h1 class="mb-2 text-3xl font-bold text-gray-100">{group.name}</h1>
		<div class="flex items-center gap-4 text-sm text-gray-400">
			<span>{group.playerNames.length} joueur{group.playerNames.length > 1 ? 's' : ''}</span>
			<span>{group.games.length} partie{group.games.length > 1 ? 's' : ''}</span>
			<span>Créé le {formatDate(group.createdAt)}</span>
		</div>
	</div>

	<!-- Messages -->
	{#if errorMessage}
		<div class="mb-4 rounded-lg border border-red-600 bg-red-900 p-4 text-red-200">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div class="mb-4 rounded-lg border border-green-600 bg-green-900 p-4 text-green-200">
			{successMessage}
		</div>
	{/if}

	<!-- Section d'ajout de joueur -->
	<div class="mb-8 rounded-lg border border-gray-600 bg-gray-800 p-6">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-200">Gestion des joueurs</h3>
			{#if !showAddPlayerForm}
				<button
					on:click={() => (showAddPlayerForm = true)}
					class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Ajouter un joueur
				</button>
			{/if}
		</div>

		{#if showAddPlayerForm}
			<div
				class="rounded-lg border border-green-600 bg-green-900/20 p-4"
				transition:slide={{ duration: 300 }}
			>
				<h4 class="mb-3 text-sm font-medium text-green-200">Ajouter un nouveau joueur</h4>

				<div class="space-y-3">
					<div>
						<input
							type="text"
							bind:value={newPlayerName}
							placeholder="Nom du nouveau joueur"
							class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-gray-100 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
							maxlength="50"
						/>
					</div>

					{#if addPlayerError}
						<div class="rounded-lg bg-red-900/30 p-3 text-sm text-red-200">
							{addPlayerError}
						</div>
					{/if}

					<div class="flex gap-2">
						<button
							on:click={addPlayer}
							disabled={isAddingPlayer || !newPlayerName.trim()}
							class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-600"
						>
							{isAddingPlayer ? 'Ajout...' : 'Ajouter'}
						</button>
						<button
							on:click={cancelAddPlayer}
							class="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
						>
							Annuler
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Liste des joueurs actuels -->
		<div class="mt-4">
			<h4 class="mb-2 text-sm font-medium text-gray-300">
				Joueurs du groupe ({group.playerNames.length})
			</h4>
			<div class="flex flex-wrap gap-2">
				{#each group.playerNames as playerName}
					<span class="rounded-full bg-blue-600/20 px-3 py-1 text-sm text-blue-200">
						{playerName}
					</span>
				{/each}
			</div>
		</div>
	</div>

	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Création d'une nouvelle partie -->
		<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-200">Créer une nouvelle partie</h2>

			<div class="mb-4">
				<div class="mb-3 flex gap-2">
					<button
						on:click={selectAll}
						class="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
					>
						Tout sélectionner
					</button>
					<button
						on:click={selectNone}
						class="rounded bg-gray-600 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-700"
					>
						Tout désélectionner
					</button>
				</div>

				<div class="space-y-2">
					{#each group.playerNames as playerName}
						<label class="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								checked={selectedPlayers.includes(playerName)}
								on:change={() => togglePlayer(playerName)}
								class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
							/>
							<span class="text-gray-200">{playerName}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="mb-4 text-sm text-gray-400">
				{selectedPlayers.length} joueur{selectedPlayers.length > 1 ? 's' : ''} sélectionné{selectedPlayers.length >
				1
					? 's'
					: ''}
			</div>

			<button
				on:click={createGame}
				disabled={isLoading || selectedPlayers.length < 2}
				class="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-600"
			>
				{isLoading ? 'Création...' : 'Créer la partie'}
			</button>
		</div>

		<!-- Informations du groupe -->
		<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-200">Informations</h2>
				<button
					on:click={() => copyToClipboard(`${window.location.origin}/group/${group.id}`)}
					class="rounded bg-gray-600 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-700"
					title="Copier le lien du groupe"
				>
					📋 Copier le lien
				</button>
			</div>

			<div class="space-y-4">
				<!-- Onglets de navigation -->
				<div class="border-b border-gray-600">
					<nav class="-mb-px flex flex-wrap gap-1 sm:space-x-1 sm:gap-0" aria-label="Onglets des statistiques">
						<button
							role="tab"
							class="flex-1 sm:flex-none border-b-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors {activeTab ===
							'defeat-rate'
								? 'border-blue-500 text-blue-400'
								: 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300'}"
							on:click={() => (activeTab = 'defeat-rate')}
							aria-selected={activeTab === 'defeat-rate'}
						>
							<span class="hidden sm:inline">📊 </span>Taux de défaite
						</button>
						<button
							role="tab"
							class="flex-1 sm:flex-none border-b-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors {activeTab ===
							'normalized-score'
								? 'border-blue-500 text-blue-400'
								: 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300'}"
							on:click={() => (activeTab = 'normalized-score')}
							aria-selected={activeTab === 'normalized-score'}
						>
							<span class="hidden sm:inline">⚖️ </span>Score normalisé
						</button>
						<button
							role="tab"
							class="flex-1 sm:flex-none border-b-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors {activeTab ===
							'hooked-defeat-rate'
								? 'border-blue-500 text-blue-400'
								: 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300'}"
							on:click={() => (activeTab = 'hooked-defeat-rate')}
							aria-selected={activeTab === 'hooked-defeat-rate'}
						>
							<span class="hidden sm:inline">🎣 </span>Défaites accrochées
						</button>
					</nav>
				</div>

				<!-- Contenu des onglets -->
				<div class="mt-4">
					{#if activeTab === 'defeat-rate'}
						<!-- Onglet 1: Taux de défaite classique -->
						<div>
							<h3 class="mb-3 text-sm font-medium text-gray-300">Taux de défaite global :</h3>
							<div class="space-y-2">
								{#each getPlayersSortedByDefeatRate() as playerStats}
									<div class="flex items-center justify-between rounded-lg bg-gray-700 p-3">
										<div class="flex flex-col gap-1">
											<div class="flex items-center gap-3">
												<span class="font-medium text-gray-200">{playerStats.name}</span>
												<span class="text-xs text-gray-400">
													{playerStats.totalGames} partie{playerStats.totalGames > 1 ? 's' : ''}
													{#if playerStats.totalGames > 0}
														• moy. {playerStats.avgPlayersPerGame.toFixed(1)} joueurs
													{/if}
												</span>
											</div>
										</div>
										<div class="flex items-center gap-2">
											<span class="text-sm text-gray-300">
												{playerStats.defeatRate.toFixed(1)}%
											</span>
											<div class="h-2 w-16 overflow-hidden rounded-full bg-gray-600">
												<div
													class="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-300"
													style="width: {playerStats.defeatRate}%"
												></div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else if activeTab === 'normalized-score'}
						<!-- Onglet 2: Score normalisé -->
						<div>
							<h3 class="mb-3 text-sm font-medium text-gray-300">
								Score normalisé (ajusté selon le nombre de joueurs) :
							</h3>
							<div class="space-y-2">
								{#each getPlayersSortedByDefeatRate() as playerStats}
									<div class="flex items-center justify-between rounded-lg bg-gray-700 p-3">
										<div class="flex flex-col gap-1">
											<div class="flex items-center gap-3">
												<span class="font-medium text-gray-200">{playerStats.name}</span>
												<span class="text-xs text-gray-400">
													{playerStats.totalGames} partie{playerStats.totalGames > 1 ? 's' : ''}
													{#if playerStats.totalGames > 0}
														• moy. {playerStats.avgPlayersPerGame.toFixed(1)} joueurs
													{/if}
												</span>
											</div>
											<div class="text-xs text-gray-500">
												Taux brut: {playerStats.defeatRate.toFixed(1)}%
											</div>
										</div>
										<div class="flex items-center gap-2">
											<span class="text-sm text-gray-300">
												{playerStats.normalizedScore.toFixed(0)}
											</span>
											<div class="h-2 w-16 overflow-hidden rounded-full bg-gray-600">
												<div
													class="h-full transition-all duration-300 {playerStats.normalizedScore <
													100
														? 'bg-green-500'
														: playerStats.normalizedScore > 100
															? 'bg-red-500'
															: 'bg-yellow-500'}"
													style="width: {Math.min(playerStats.normalizedScore, 200) / 2}%"
												></div>
											</div>
										</div>
									</div>
								{/each}
							</div>
							{#if group.games.length > 0}
								<div class="mt-3 rounded-lg bg-blue-900/30 p-3 text-xs text-blue-200">
									<div class="mb-1 font-medium">ℹ️ Score normalisé</div>
									<div class="space-y-1 text-blue-300">
										<div>• <strong>&lt; 100</strong> : Meilleur que la moyenne théorique</div>
										<div>• <strong>= 100</strong> : Conforme à la moyenne théorique</div>
										<div>• <strong>&gt; 100</strong> : Moins bon que la moyenne théorique</div>
										<div class="mt-2 text-xs">
											Ce score ajuste le taux de défaite selon le nombre de joueurs par partie (plus
											difficile avec moins de joueurs).
										</div>
									</div>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'hooked-defeat-rate'}
						<!-- Onglet 3: Taux de défaites sur parties accrochées -->
						<div>
							<h3 class="mb-3 text-sm font-medium text-gray-300">
								Taux de défaite sur parties accrochées uniquement :
							</h3>
							<div class="space-y-2">
								{#each getPlayersSortedByDefeatRate() as playerStats}
									<div class="flex items-center justify-between rounded-lg bg-gray-700 p-3">
										<div class="flex flex-col gap-1">
											<div class="flex items-center gap-3">
												<span class="font-medium text-gray-200">{playerStats.name}</span>
												<span class="text-xs text-gray-400">
													{playerStats.hookedGames} partie{playerStats.hookedGames > 1 ? 's' : ''} accrochée{playerStats.hookedGames >
													1
														? 's'
														: ''}
													{#if playerStats.hookedGames > 0}
														• {playerStats.hookedDefeats} défaite{playerStats.hookedDefeats > 1
															? 's'
															: ''}
													{/if}
												</span>
											</div>
											<div class="text-xs text-gray-500">
												Taux global: {playerStats.defeatRate.toFixed(1)}% ({playerStats.totalGames} parties)
											</div>
										</div>
										<div class="flex items-center gap-2">
											{#if playerStats.hookedGames > 0}
												<span class="text-sm text-gray-300">
													{playerStats.hookedDefeatRate.toFixed(1)}%
												</span>
												<div class="h-2 w-16 overflow-hidden rounded-full bg-gray-600">
													<div
														class="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-300"
														style="width: {playerStats.hookedDefeatRate}%"
													></div>
												</div>
											{:else}
												<span class="text-xs text-gray-500 italic">Jamais accroché</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
							{#if group.games.length > 0}
								<div class="mt-3 rounded-lg bg-amber-900/30 p-3 text-xs text-amber-200">
									<div class="mb-1 font-medium">🎣 Statistiques accrochées</div>
									<div class="space-y-1 text-amber-300">
										<div>
											Cette statistique ne prend en compte que les parties où le joueur a été
											accroché.
										</div>
										<div>
											Plus ce taux est élevé, plus le joueur a tendance à perdre quand il se fait
											accrocher.
										</div>
										<div class="mt-2 text-xs">
											Un joueur qui n'apparaît jamais dans cette liste n'a jamais été accroché.
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if group.games.length === 0}
						<p class="mt-3 text-sm text-gray-500 italic">
							Aucune statistique disponible - créez une partie pour voir les statistiques
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Historique des parties -->
	<div class="mt-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-200">Historique des parties</h2>

		{#if group.games.length === 0}
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-8 text-center">
				<p class="text-gray-400">Aucune partie jouée pour l'instant</p>
				<p class="mt-2 text-sm text-gray-500">Créez votre première partie ci-dessus !</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each group.games.sort((a: Game, b: Game) => new Date(b.date).getTime() - new Date(a.date).getTime()) as game (game.id)}
					{#if !disappearingGames.has(game.id)}
						<div
							class="rounded-lg border border-gray-600 bg-gray-800 p-4"
							out:slide={{ duration: 400 }}
						>
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<span class="font-medium text-gray-300">Partie du {formatDate(game.date)}</span>
									<span class="text-xs text-gray-500">ID: {game.id.slice(0, 8)}...</span>
								</div>
								<div class="flex gap-2">
									<button
										on:click={() => copyToClipboard(`${window.location.origin}/game/${game.id}`)}
										class="rounded bg-gray-600 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-700"
										title="Copier le lien de la partie"
									>
										📋
									</button>
									<a
										href="/game/{game.id}"
										class="rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
									>
										Voir →
									</a>
									<!-- Bouton de suppression avec progression -->
									<div class="relative">
										<button
											on:mousedown={() => startDeleteGame(game.id)}
											on:mouseup={cancelDeleteGame}
											on:mouseleave={cancelDeleteGame}
											on:touchstart={() => startDeleteGame(game.id)}
											on:touchend={cancelDeleteGame}
											class="relative overflow-hidden rounded bg-red-600 px-3 py-1 text-xs text-white transition-colors select-none hover:bg-red-700"
											title="Maintenir 2 secondes pour supprimer"
										>
											<!-- Barre de progression -->
											{#if deletingGameId === game.id}
												<div
													class="absolute inset-0 bg-red-800 transition-all duration-75 ease-linear"
													style="width: {deleteProgress}%"
												></div>
											{/if}
											<!-- Texte du bouton -->
											<span class="relative z-10">🗑️</span>
										</button>
									</div>
								</div>
							</div>

							<div class="flex flex-wrap gap-2">
								{#each game.players as player}
									<span
										class="rounded px-2 py-1 text-xs {player.lost
											? 'bg-red-600'
											: 'bg-green-600'} text-white"
									>
										{player.name}
										{player.hooked ? '🎣' : ''}
										{player.lost ? '💀' : '✅'}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
