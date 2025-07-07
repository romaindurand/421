<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import confetti from 'canvas-confetti';
	import type { PageData } from './$types.js';

	export let data: PageData;

	interface PlayerInGame {
		name: string;
		lost: boolean;
		hooked: boolean;
		four21Count: number;
		four21Rerolls: number;
		nenetteCount: number;
	}

	interface Game {
		id: string;
		date: string;
		players: PlayerInGame[];
	}

	$: game = data.game as Game | undefined;
	$: groupId = data.groupId as string | undefined;
	$: error = data.error as string | undefined;

	// Variables pour Server-Sent Events
	let eventSource: EventSource | null = null;

	onMount(() => {
		setupSSE();
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
	});

	function setupSSE() {
		if (!game) return;

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
		if (!game) return;

		switch (event.type) {
			case 'game-updated':
				if (event.data.gameId === game.id) {
					// Mettre à jour la partie
					game = event.data.game;
				}
				break;

			case 'game-deleted':
				if (event.data.gameId === game.id) {
					// Rediriger vers le groupe si la partie est supprimée
					if (groupId) {
						goto(`/group/${groupId}`);
					} else {
						goto('/');
					}
				}
				break;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function goBack() {
		if (groupId) {
			goto(`/group/${groupId}`);
		} else {
			goto('/');
		}
	}

	function copyGameId() {
		if (game?.id) {
			navigator.clipboard.writeText(game.id);
			triggerConfetti();
		}
	}

	function copyGameUrl() {
		const url = window.location.href;
		navigator.clipboard.writeText(url);
		triggerConfetti();
	}

	async function togglePlayerLost(playerName: string) {
		if (!game) return;

		try {
			const response = await fetch(`/api/games/${game.id}/players/${playerName}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'toggle-lost'
				})
			});

			const result = await response.json();

			if (result.success) {
				triggerConfetti();
				// Note: SSE va gérer la mise à jour de l'état
			} else {
				console.error('Erreur lors de la mise à jour:', result.error);
			}
		} catch (error) {
			console.error('Erreur lors de la mise à jour du statut:', error);
		}
	}

	async function togglePlayerHooked(playerName: string) {
		if (!game) return;

		try {
			const response = await fetch(`/api/games/${game.id}/players/${playerName}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'toggle-hooked'
				})
			});

			const result = await response.json();

			if (result.success) {
				triggerConfetti();
				// Note: SSE va gérer la mise à jour de l'état
			} else {
				console.error('Erreur lors de la mise à jour:', result.error);
			}
		} catch (error) {
			console.error('Erreur lors de la mise à jour du statut:', error);
		}
	}

	function triggerConfetti() {
		// Configuration pour une explosion de confettis
		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
			colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
		});

		// Ajouter un second effet légèrement décalé
		setTimeout(() => {
			confetti({
				particleCount: 50,
				angle: 60,
				spread: 55,
				origin: { x: 0, y: 0.6 }
			});
		}, 150);

		setTimeout(() => {
			confetti({
				particleCount: 50,
				angle: 120,
				spread: 55,
				origin: { x: 1, y: 0.6 }
			});
		}, 300);
	}

	async function updatePlayerStat(
		playerName: string,
		statType: 'four21Count' | 'four21Rerolls' | 'nenetteCount',
		increment: number
	) {
		if (!game) return;

		try {
			const response = await fetch(`/api/games/${game.id}/players/${playerName}/stats`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					statType,
					increment
				})
			});

			const result = await response.json();

			if (result.success) {
				// Note: SSE va gérer la mise à jour de l'état
			} else {
				console.error('Erreur lors de la mise à jour des statistiques:', result.error);
			}
		} catch (error) {
			console.error('Erreur lors de la mise à jour des statistiques:', error);
		}
	}
</script>

<svelte:head>
	<title>
		{game && game.date ? `Partie du ${formatDate(game.date)} - 421` : 'Partie non trouvée - 421'}
	</title>
</svelte:head>

<div class="mx-auto min-h-screen max-w-4xl bg-gray-900 p-8 font-sans text-gray-100">
	<!-- Bouton retour -->
	<div class="mb-6">
		<button
			on:click={goBack}
			class="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-gray-100 transition-colors duration-200 hover:bg-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			{groupId ? 'Retour au groupe' : "Retour à l'accueil"}
		</button>
	</div>

	{#if error}
		<!-- Affichage d'erreur -->
		<div class="text-center">
			<div class="mb-6 rounded-lg border border-red-600 bg-red-900/20 p-6">
				<h1 class="mb-4 text-3xl font-bold text-red-400">Erreur</h1>
				<p class="text-lg text-red-300">{error}</p>
			</div>
			<button
				on:click={goBack}
				class="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-600"
			>
				{groupId ? 'Retour au groupe' : "Retour à l'accueil"}
			</button>
		</div>
	{:else if game}
		<!-- Affichage de la partie -->
		<div class="space-y-6">
			<!-- En-tête de la partie -->
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h1 class="text-3xl font-bold text-gray-100">Partie de 421</h1>
					<div class="flex flex-col gap-2 sm:items-end">
						<span class="text-sm text-gray-400">Partie du</span>
						<span class="text-lg font-medium text-gray-200">
							{formatDate(game.date)}
						</span>
					</div>
				</div>

				<!-- ID de la partie -->
				<div class="mb-4 rounded-lg bg-gray-700 p-4">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium text-gray-300">ID de la partie</span>
						<div class="flex gap-2">
							<button
								on:click={copyGameId}
								class="rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors duration-200 hover:bg-blue-700"
								title="Copier l'ID"
							>
								Copier ID
							</button>
							<button
								on:click={copyGameUrl}
								class="rounded bg-green-600 px-3 py-1 text-xs text-white transition-colors duration-200 hover:bg-green-700"
								title="Copier le lien"
							>
								Copier lien
							</button>
						</div>
					</div>
					<code class="font-mono text-lg text-gray-100">{game.id}</code>
				</div>

				<!-- Statistiques -->
				<div class="grid grid-cols-3 gap-4">
					<div class="rounded-lg bg-gray-700 p-4 text-center">
						<div class="text-2xl font-bold text-blue-400">{game.players?.length || 0}</div>
						<div class="text-sm text-gray-300">
							{(game.players?.length || 0) === 1 ? 'Joueur' : 'Joueurs'}
						</div>
					</div>
					<div class="rounded-lg bg-gray-700 p-4 text-center">
						<div class="text-2xl font-bold text-red-400">
							{game.players?.filter((p) => p.lost).length || 0}
						</div>
						<div class="text-sm text-gray-300">
							Perdant{(game.players?.filter((p) => p.lost).length || 0) > 1 ? 's' : ''}
						</div>
					</div>
					<div class="rounded-lg bg-gray-700 p-4 text-center">
						<div class="text-2xl font-bold text-orange-400">
							{game.players?.filter((p) => p.hooked).length || 0}
						</div>
						<div class="text-sm text-gray-300">
							Accroché{(game.players?.filter((p) => p.hooked).length || 0) > 1 ? 's' : ''}
						</div>
					</div>
				</div>
			</div>

			<!-- Liste des joueurs -->
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<h2 class="mb-4 text-2xl font-semibold text-gray-100">
					Joueurs de la partie ({game.players?.length || 0})
				</h2>

				{#if game.players && game.players.length > 0}
					<div class="space-y-4">
						{#each game.players as player, index}
							<div class="rounded-lg border border-gray-600 bg-gray-700 p-4">
								<div class="mb-4 flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
										>
											{index + 1}
										</div>
										<div>
											<h3 class="text-lg font-medium text-gray-100">{player.name}</h3>
											<div class="text-sm text-gray-400">
												{player.lost ? 'A perdu' : 'En vie'} •
												{player.hooked ? 'Accroché' : 'Pas accroché'}
											</div>
											<!-- Statistiques de jeu -->
											<div class="mt-2 grid grid-cols-3 gap-3 text-xs">
												<div class="rounded bg-green-900/30 px-2 py-1 text-green-200">
													<div class="font-medium">421: {player.four21Count || 0}</div>
												</div>
												<div class="rounded bg-yellow-900/30 px-2 py-1 text-yellow-200">
													<div class="font-medium">Relancés: {player.four21Rerolls || 0}</div>
												</div>
												<div class="rounded bg-purple-900/30 px-2 py-1 text-purple-200">
													<div class="font-medium">Nenettes: {player.nenetteCount || 0}</div>
												</div>
											</div>
										</div>
									</div>

									<div class="flex items-center gap-2">
										{#if player.lost}
											<span class="text-2xl" title="A perdu">💀</span>
										{:else}
											<span class="text-2xl" title="En vie">✅</span>
										{/if}

										{#if player.hooked}
											<span class="text-2xl" title="Accroché">🎣</span>
										{/if}
									</div>
								</div>

								<!-- Actions pour le joueur -->
								<div class="flex flex-wrap gap-2">
									<button
										on:click={() => togglePlayerLost(player.name)}
										class="rounded px-4 py-2 text-sm font-medium transition-colors {player.lost
											? 'bg-green-600 text-white hover:bg-green-700'
											: 'bg-red-600 text-white hover:bg-red-700'}"
									>
										{player.lost ? 'Retirer perdant' : 'Marquer perdant'}
									</button>

									<button
										on:click={() => togglePlayerHooked(player.name)}
										disabled={player.lost}
										class="rounded px-4 py-2 text-sm font-medium transition-colors {player.lost
											? 'cursor-not-allowed bg-gray-500 text-gray-300'
											: player.hooked
												? 'bg-gray-600 text-white hover:bg-gray-700'
												: 'bg-orange-600 text-white hover:bg-orange-700'}"
										title={player.lost ? 'Les joueurs perdants sont automatiquement accrochés' : ''}
									>
										{player.lost
											? 'Automatiquement accroché'
											: player.hooked
												? "Retirer l'accrochage"
												: 'Marquer comme accroché'}
									</button>
								</div>

								<!-- Contrôles des statistiques de jeu -->
								<div class="mt-4 grid grid-cols-3 gap-4">
									<!-- 421 Count -->
									<div class="rounded-lg bg-green-900/20 p-3">
										<div class="mb-2 text-center text-sm font-medium text-green-200">
											421 réussis
										</div>
										<div class="flex items-center justify-center gap-2">
											<button
												on:click={() => updatePlayerStat(player.name, 'four21Count', -1)}
												class="flex h-8 w-8 items-center justify-center rounded bg-green-700 text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-600"
												disabled={(player.four21Count || 0) === 0}
											>
												−
											</button>
											<span class="min-w-[2rem] text-center text-lg font-bold text-green-200">
												{player.four21Count || 0}
											</span>
											<button
												on:click={() => updatePlayerStat(player.name, 'four21Count', 1)}
												class="flex h-8 w-8 items-center justify-center rounded bg-green-600 text-white hover:bg-green-700"
											>
												+
											</button>
										</div>
									</div>

									<!-- 421 Rerolls -->
									<div class="rounded-lg bg-yellow-900/20 p-3">
										<div class="mb-2 text-center text-sm font-medium text-yellow-200">
											421 relancés
										</div>
										<div class="flex items-center justify-center gap-2">
											<button
												on:click={() => updatePlayerStat(player.name, 'four21Rerolls', -1)}
												class="flex h-8 w-8 items-center justify-center rounded bg-yellow-700 text-white hover:bg-yellow-800 disabled:cursor-not-allowed disabled:bg-gray-600"
												disabled={(player.four21Rerolls || 0) === 0}
											>
												−
											</button>
											<span class="min-w-[2rem] text-center text-lg font-bold text-yellow-200">
												{player.four21Rerolls || 0}
											</span>
											<button
												on:click={() => updatePlayerStat(player.name, 'four21Rerolls', 1)}
												class="flex h-8 w-8 items-center justify-center rounded bg-yellow-600 text-white hover:bg-yellow-700"
											>
												+
											</button>
										</div>
									</div>

									<!-- Nenette Count -->
									<div class="rounded-lg bg-purple-900/20 p-3">
										<div class="mb-2 text-center text-sm font-medium text-purple-200">Nenettes</div>
										<div class="flex items-center justify-center gap-2">
											<button
												on:click={() => updatePlayerStat(player.name, 'nenetteCount', -1)}
												class="flex h-8 w-8 items-center justify-center rounded bg-purple-700 text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-gray-600"
												disabled={(player.nenetteCount || 0) === 0}
											>
												−
											</button>
											<span class="min-w-[2rem] text-center text-lg font-bold text-purple-200">
												{player.nenetteCount || 0}
											</span>
											<button
												on:click={() => updatePlayerStat(player.name, 'nenetteCount', 1)}
												class="flex h-8 w-8 items-center justify-center rounded bg-purple-600 text-white hover:bg-purple-700"
											>
												+
											</button>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-400">Aucun joueur dans cette partie.</p>
				{/if}
			</div>

			<!-- Résumé de la partie -->
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<h3 class="mb-4 text-xl font-semibold text-gray-100">Résumé de la partie</h3>
				<div class="space-y-2 text-gray-300">
					<div class="flex justify-between">
						<span>Gagnants :</span>
						<span class="font-medium text-green-400">
							{game.players
								?.filter((p) => !p.lost)
								.map((p) => p.name)
								.join(', ') || 'Aucun'}
						</span>
					</div>
					<div class="flex justify-between">
						<span>Perdants :</span>
						<span class="font-medium text-red-400">
							{game.players
								?.filter((p) => p.lost)
								.map((p) => p.name)
								.join(', ') || 'Aucun'}
						</span>
					</div>
					<div class="flex justify-between">
						<span>Accrochés :</span>
						<span class="font-medium text-orange-400">
							{game.players
								?.filter((p) => p.hooked)
								.map((p) => p.name)
								.join(', ') || 'Aucun'}
						</span>
					</div>
				</div>
			</div>

			<!-- Section d'actions -->
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<h3 class="mb-4 text-xl font-semibold text-gray-100">Actions</h3>
				<div class="flex flex-wrap gap-3">
					<button
						on:click={goBack}
						class="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-600"
					>
						Retour aux groupes
					</button>
					<button
						on:click={copyGameUrl}
						class="rounded-lg bg-green-500 px-6 py-3 text-white transition-colors duration-200 hover:bg-green-600"
					>
						Partager cette partie
					</button>
				</div>
			</div>

			<!-- Informations techniques -->
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<details class="group">
					<summary
						class="cursor-pointer text-lg font-semibold text-gray-100 transition-colors duration-200 group-hover:text-blue-400"
					>
						Informations techniques
					</summary>
					<div class="mt-4 space-y-2 text-sm text-gray-400">
						<div><strong>ID:</strong> {game.id}</div>
						<div><strong>Date:</strong> {game.date}</div>
						<div><strong>URL:</strong> {$page.url.href}</div>
					</div>
				</details>
			</div>
		</div>
	{/if}
</div>
