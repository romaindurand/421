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

	// Variables pour la suppression avec progression
	let deletingGameId: string | null = null;
	let deleteProgress = 0;
	let deleteTimeout: NodeJS.Timeout | null = null;
	let deleteInterval: NodeJS.Timeout | null = null;
	let disappearingGames: Set<string> = new Set();

	// Variables pour Server-Sent Events
	let eventSource: EventSource | null = null;

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
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-300">Joueurs du groupe :</h3>
					<div class="flex flex-wrap gap-2">
						{#each group.playerNames as playerName}
							<span class="rounded-full bg-blue-600 px-3 py-1 text-xs text-white">
								{playerName}
							</span>
						{/each}
					</div>
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
