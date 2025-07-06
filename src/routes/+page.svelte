<script lang="ts">
	import { onMount } from 'svelte';

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

	let playerName = '';
	let players: string[] = [];
	let errorMessage = '';
	let successMessage = '';
	let savedGames: Game[] = [];
	let isLoading = false;

	// Charger les parties sauvegardées au chargement du composant
	onMount(async () => {
		await loadSavedGames();
	});

	async function loadSavedGames() {
		try {
			const response = await fetch('/api/games');
			const result = await response.json();

			if (result.success) {
				savedGames = result.data;
			} else {
				console.error('Erreur lors du chargement des parties:', result.error);
			}
		} catch (error) {
			console.error('Erreur lors du chargement des parties:', error);
		}
	}

	function addPlayer() {
		if (playerName.trim() === '') {
			errorMessage = 'Veuillez entrer un nom de joueur';
			return;
		}

		if (players.includes(playerName.trim())) {
			errorMessage = 'Ce nom de joueur existe déjà';
			return;
		}

		players = [...players, playerName.trim()];
		playerName = '';
		errorMessage = '';
		successMessage = '';
	}

	function removePlayer(index: number) {
		players = players.filter((_, i) => i !== index);
		successMessage = '';
	}

	async function validateForm() {
		if (players.length === 0) {
			errorMessage = 'Veuillez ajouter au moins un joueur';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Créer une nouvelle partie via l'API
			const response = await fetch('/api/games', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ players })
			});

			const result = await response.json();

			if (result.success) {
				successMessage = `Partie créée avec succès ! ID: ${result.data.id}`;

				// Recharger la liste des parties sauvegardées
				await loadSavedGames();

				// Réinitialiser le formulaire
				players = [];
			} else {
				errorMessage = result.error || 'Erreur lors de la sauvegarde de la partie';
			}
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
			errorMessage = 'Erreur lors de la sauvegarde de la partie';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addPlayer();
		}
	}
</script>

<div class="mx-auto min-h-screen max-w-2xl bg-gray-900 p-8 font-sans text-gray-100">
	<h1 class="mb-8 text-center text-3xl font-bold text-gray-100">Ajouter des joueurs</h1>

	<div class="mb-8">
		<div class="mb-2 flex gap-2 max-sm:flex-col">
			<input
				type="text"
				bind:value={playerName}
				on:keydown={handleKeyDown}
				placeholder="Nom du joueur"
				maxlength="50"
				class="flex-1 rounded-lg border-2 border-gray-600 bg-gray-700 px-3 py-3 text-base text-gray-100 transition-colors duration-200 focus:border-green-400 focus:outline-none max-sm:w-full"
			/>
			<button
				on:click={addPlayer}
				disabled={playerName.trim() === ''}
				class="cursor-pointer rounded-lg border-none bg-green-500 px-6 py-3 text-base text-white transition-colors duration-200 hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-600 max-sm:w-full"
			>
				Ajouter
			</button>
		</div>

		{#if errorMessage}
			<p class="m-0 text-sm text-red-400">{errorMessage}</p>
		{/if}

		{#if successMessage}
			<p class="m-0 text-sm text-green-400">{successMessage}</p>
		{/if}
	</div>

	{#if players.length > 0}
		<div class="mb-8 rounded-lg border border-gray-600 bg-gray-800 p-6">
			<h2 class="mb-4 text-xl text-gray-300">Joueurs ajoutés ({players.length})</h2>
			<ul class="m-0 list-none p-0">
				{#each players as player, index}
					<li
						class="mb-2 flex items-center justify-between rounded-md border border-gray-600 bg-gray-700 px-3 py-3 transition-shadow duration-200 hover:shadow-lg hover:shadow-black/30"
					>
						<span class="font-medium text-gray-100">{player}</span>
						<button
							on:click={() => removePlayer(index)}
							title="Supprimer ce joueur"
							class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-red-500 text-lg leading-none text-white transition-colors duration-200 hover:bg-red-600"
						>
							×
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="text-center">
		<button
			on:click={validateForm}
			disabled={players.length === 0 || isLoading}
			class="cursor-pointer rounded-lg border-none bg-blue-500 px-8 py-4 text-lg font-semibold text-white transition-colors duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600"
		>
			{#if isLoading}
				Sauvegarde...
			{:else}
				Valider le formulaire
			{/if}
		</button>
	</div>

	{#if savedGames.length > 0}
		<div class="mt-8 rounded-lg border border-gray-600 bg-gray-800 p-6">
			<h2 class="mb-4 text-xl text-gray-300">Parties sauvegardées ({savedGames.length})</h2>
			<div class="space-y-3">
				{#each savedGames as game}
					<div
						class="group rounded-md border border-gray-600 bg-gray-700 p-4 transition-all duration-200 hover:border-blue-500 hover:bg-gray-600"
					>
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm text-gray-400">ID: {game.id}</span>
							<span class="text-sm text-gray-400">
								{new Date(game.createdAt).toLocaleDateString('fr-FR')} à {new Date(
									game.createdAt
								).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
							</span>
						</div>
						<div class="mb-3">
							<div class="mb-2 text-gray-100">
								<strong>Joueurs ({game.players.length}):</strong>
							</div>
							<div class="space-y-1">
								{#each game.players as player}
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-200">{player.name}</span>
										<div class="flex gap-2 text-xs text-gray-400">
											<span>M: {player.matchesPlayed}</span>
											<span>D: {player.defeats}</span>
											<span>A: {player.hooked || 0}</span>
											{#if player.matchesPlayed > 0}
												<span class="text-blue-400">
													{(
														((player.matchesPlayed - player.defeats) / player.matchesPlayed) *
														100
													).toFixed(0)}% V
												</span>
												<span class="text-red-400">
													{((player.defeats / player.matchesPlayed) * 100).toFixed(0)}% TD
												</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
						<div class="flex items-center justify-between">
							<a
								href="/game/{game.id}"
								class="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors duration-200 hover:bg-blue-700"
							>
								Voir la partie
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</a>
							<button
								on:click={() =>
									navigator.clipboard.writeText(`${window.location.origin}/game/${game.id}`)}
								class="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors duration-200 hover:bg-green-700"
								title="Copier le lien de la partie"
							>
								Copier lien
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
