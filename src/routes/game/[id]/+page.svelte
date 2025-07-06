<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import confetti from 'canvas-confetti';
	import type { PageData } from './$types.js';

	export let data: PageData;

	interface Player {
		name: string;
		matchesPlayed: number;
		defeats: number;
		hooked: number;
	}

	interface Game {
		id: string;
		players: Player[];
		createdAt: string;
		updatedAt: string;
	}

	$: game = data.game as Game | undefined;
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
		goto('/');
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

	async function updatePlayerStats(
		playerName: string,
		matchesPlayed: number,
		defeats: number,
		hooked?: number
	) {
		try {
			const body: { matchesPlayed: number; defeats: number; hooked?: number } = {
				matchesPlayed,
				defeats
			};
			if (hooked !== undefined) {
				body.hooked = hooked;
			}

			const response = await fetch(
				`/api/games/${game?.id}/players/${encodeURIComponent(playerName)}`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
				}
			);

			if (response.ok) {
				// Recharger les données de la partie
				window.location.reload();
			} else {
				console.error('Erreur lors de la mise à jour des statistiques');
			}
		} catch (error) {
			console.error('Erreur lors de la mise à jour des statistiques:', error);
		}
	}
</script>

<svelte:head>
	<title>
		{game ? `Partie ${game.id} - 421` : 'Partie non trouvée - 421'}
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
			Retour à l'accueil
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
				Retour à l'accueil
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
						<span class="text-sm text-gray-400">Créée le</span>
						<span class="text-lg font-medium text-gray-200">
							{formatDate(game.createdAt)}
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
				<div class="grid grid-cols-1 gap-4">
					<div class="rounded-lg bg-gray-700 p-4 text-center">
						<div class="text-2xl font-bold text-blue-400">{game.players.length}</div>
						<div class="text-sm text-gray-300">
							{game.players.length === 1 ? 'Joueur' : 'Joueurs'}
						</div>
					</div>
				</div>
			</div>

			<!-- Liste des joueurs -->
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<h2 class="mb-4 text-2xl font-semibold text-gray-100">
					Liste des joueurs ({game.players.length})
				</h2>

				{#if game.players.length > 0}
					<div class="space-y-4">
						{#each game.players as player, index}
							<div class="rounded-lg border border-gray-600 bg-gray-700 p-4">
								<div class="mb-3 flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
									>
										{index + 1}
									</div>
									<div class="flex-1">
										<h3 class="text-lg font-medium text-gray-100">{player.name}</h3>
										<div class="text-sm text-gray-400">
											{player.matchesPlayed} manches, {player.defeats} défaites, {player.hooked ||
												0} accrochages
										</div>
									</div>
								</div>

								<div class="mb-4 grid grid-cols-4 gap-3">
									<div class="rounded bg-gray-600 p-3 text-center">
										<div class="text-xl font-bold text-blue-400">{player.matchesPlayed}</div>
										<div class="text-xs text-gray-300">Manches</div>
									</div>
									<div class="rounded bg-gray-600 p-3 text-center">
										<div class="text-xl font-bold text-red-400">{player.defeats}</div>
										<div class="text-xs text-gray-300">Défaites</div>
									</div>
									<div class="rounded bg-gray-600 p-3 text-center">
										<div class="text-xl font-bold text-orange-400">{player.hooked || 0}</div>
										<div class="text-xs text-gray-300">Accrochés</div>
									</div>
									<div class="rounded bg-gray-600 p-3 text-center">
										{#if player.matchesPlayed > 0}
											<div class="text-xl font-bold text-purple-400">
												{((player.defeats / player.matchesPlayed) * 100).toFixed(0)}%
											</div>
											<div class="text-xs text-gray-300">Taux défaites</div>
										{:else}
											<div class="text-xl font-bold text-gray-500">-</div>
											<div class="text-xs text-gray-300">Taux défaites</div>
										{/if}
									</div>
								</div>

								<div class="mb-3 grid grid-cols-2 gap-3">
									<div class="space-y-2">
										<div class="text-sm font-medium text-gray-300">Manches & Défaites</div>
										<div class="flex flex-wrap gap-1">
											<button
												on:click={() =>
													updatePlayerStats(
														player.name,
														player.matchesPlayed + 1,
														player.defeats,
														player.hooked
													)}
												class="rounded bg-blue-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-blue-700"
											>
												+1 M
											</button>
											<button
												on:click={() =>
													updatePlayerStats(
														player.name,
														player.matchesPlayed,
														player.defeats + 1,
														player.hooked
													)}
												class="rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-red-700"
											>
												+1 D
											</button>
											<button
												on:click={() =>
													updatePlayerStats(
														player.name,
														Math.max(0, player.matchesPlayed - 1),
														player.defeats,
														player.hooked
													)}
												class="rounded bg-gray-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-gray-700"
												disabled={player.matchesPlayed === 0}
											>
												-1 M
											</button>
											<button
												on:click={() =>
													updatePlayerStats(
														player.name,
														player.matchesPlayed,
														Math.max(0, player.defeats - 1),
														player.hooked
													)}
												class="rounded bg-gray-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-gray-700"
												disabled={player.defeats === 0}
											>
												-1 D
											</button>
										</div>
									</div>

									<div class="space-y-2">
										<div class="text-sm font-medium text-gray-300">Accrochages</div>
										<div class="flex flex-wrap gap-1">
											<button
												on:click={() =>
													updatePlayerStats(
														player.name,
														player.matchesPlayed,
														player.defeats,
														(player.hooked || 0) + 1
													)}
												class="rounded bg-orange-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-orange-700"
											>
												+1 Accroché
											</button>
											<button
												on:click={() =>
													updatePlayerStats(
														player.name,
														player.matchesPlayed,
														player.defeats,
														Math.max(0, (player.hooked || 0) - 1)
													)}
												class="rounded bg-gray-600 px-2 py-1 text-xs text-white transition-colors duration-200 hover:bg-gray-700"
												disabled={(player.hooked || 0) === 0}
											>
												-1 Accroché
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

			<!-- Section d'actions -->
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<h3 class="mb-4 text-xl font-semibold text-gray-100">Actions</h3>
				<div class="flex flex-wrap gap-3">
					<button
						on:click={goBack}
						class="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-600"
					>
						Créer une nouvelle partie
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
						<div><strong>Créée le:</strong> {game.createdAt}</div>
						<div><strong>Modifiée le:</strong> {game.updatedAt}</div>
						<div><strong>URL:</strong> {$page.url.href}</div>
					</div>
				</details>
			</div>
		</div>
	{/if}
</div>
