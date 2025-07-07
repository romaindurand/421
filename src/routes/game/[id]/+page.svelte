<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import confetti from 'canvas-confetti';
	import type { PageData } from './$types.js';

	export let data: PageData;

	interface PlayerInGame {
		name: string;
		lost: boolean;
		hooked: boolean;
	}

	interface Game {
		id: string;
		date: string;
		players: PlayerInGame[];
	}

	$: game = data.game as Game | undefined;
	$: groupId = data.groupId as string | undefined;
	$: error = data.error as string | undefined;

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
				// Mettre à jour l'état local selon la logique "un seul perdant"
				const targetPlayer = game.players.find((p) => p.name === playerName);
				if (targetPlayer) {
					const newLostStatus = !targetPlayer.lost;

					if (newLostStatus) {
						// Si on marque ce joueur comme perdant, tous les autres deviennent gagnants
						game.players.forEach((p) => {
							p.lost = p.name === playerName;
						});
					} else {
						// Si on retire le statut perdant, seul ce joueur change
						targetPlayer.lost = false;
					}

					game = { ...game }; // Force reactivity
				}
				triggerConfetti();
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
				// Mettre à jour l'état local
				const playerIndex = game.players.findIndex((p) => p.name === playerName);
				if (playerIndex !== -1) {
					game.players[playerIndex].hooked = !game.players[playerIndex].hooked;
					game = { ...game }; // Force reactivity
				}
				triggerConfetti();
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
										{player.lost ? 'Marquer comme gagnant' : 'Marquer comme perdant'}
									</button>

									<button
										on:click={() => togglePlayerHooked(player.name)}
										class="rounded px-4 py-2 text-sm font-medium transition-colors {player.hooked
											? 'bg-gray-600 text-white hover:bg-gray-700'
											: 'bg-orange-600 text-white hover:bg-orange-700'}"
									>
										{player.hooked ? "Retirer l'accrochage" : 'Marquer comme accroché'}
									</button>
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
