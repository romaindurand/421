<script lang="ts">
	import { onMount } from 'svelte';
	import confetti from 'canvas-confetti';

	interface Group {
		id: string;
		name: string;
		playerNames: string[];
		games: any[];
		createdAt: string;
		updatedAt: string;
	}

	let groupName = '';
	let playerName = '';
	let players: string[] = [];
	let errorMessage = '';
	let successMessage = '';
	let savedGroups: Group[] = [];
	let isLoading = false;
	let showCreateForm = false;

	// Charger les groupes sauvegardés au chargement du composant
	onMount(async () => {
		await loadSavedGroups();
	});

	async function loadSavedGroups() {
		try {
			const response = await fetch('/api/groups');
			const result = await response.json();

			if (result.success) {
				savedGroups = result.data;
			} else {
				console.error('Erreur lors du chargement des groupes:', result.error);
			}
		} catch (error) {
			console.error('Erreur lors du chargement des groupes:', error);
		}
	}

	function addPlayer() {
		if (playerName.trim() === '') {
			errorMessage = 'Veuillez entrer un nom de joueur';
			return;
		}

		if (players.includes(playerName.trim())) {
			errorMessage = 'Ce joueur est déjà dans la liste';
			return;
		}

		players = [...players, playerName.trim()];
		playerName = '';
		errorMessage = '';
	}

	function removePlayer(index: number) {
		players = players.filter((_, i) => i !== index);
	}

	async function createGroup() {
		if (groupName.trim() === '') {
			errorMessage = 'Veuillez entrer un nom de groupe';
			return;
		}

		if (players.length < 2) {
			errorMessage = 'Il faut au moins 2 joueurs pour créer un groupe';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/groups', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: groupName.trim(),
					playerNames: players
				})
			});

			const result = await response.json();

			if (result.success) {
				successMessage = `Groupe "${groupName}" créé avec succès !`;

				// Trigger confetti
				confetti({
					particleCount: 100,
					spread: 70,
					origin: { y: 0.6 }
				});

				// Reset form
				groupName = '';
				players = [];
				showCreateForm = false;

				// Reload groups
				await loadSavedGroups();

				// Clear success message after 3 seconds
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				errorMessage = result.error || 'Erreur lors de la création du groupe';
			}
		} catch (error) {
			console.error('Erreur lors de la création du groupe:', error);
			errorMessage = 'Erreur lors de la création du groupe';
		}

		isLoading = false;
	}

	async function deleteGroup(groupId: string, groupName: string) {
		if (
			!confirm(
				`Êtes-vous sûr de vouloir supprimer le groupe "${groupName}" ? Cette action est irréversible.`
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/groups/${groupId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				successMessage = `Groupe "${groupName}" supprimé avec succès`;
				await loadSavedGroups();

				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				errorMessage = result.error || 'Erreur lors de la suppression du groupe';
			}
		} catch (error) {
			console.error('Erreur lors de la suppression du groupe:', error);
			errorMessage = 'Erreur lors de la suppression du groupe';
		}
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
</script>

<div class="mx-auto min-h-screen max-w-4xl bg-gray-900 p-8 font-sans text-gray-100">
	<h1 class="mb-8 text-center text-3xl font-bold text-gray-100">Mes Groupes de Joueurs</h1>

	<!-- Messages d'erreur et de succès -->
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

	<!-- Bouton pour créer un nouveau groupe -->
	<div class="mb-8 text-center">
		<button
			on:click={() => (showCreateForm = !showCreateForm)}
			class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
		>
			{showCreateForm ? 'Annuler' : 'Créer un nouveau groupe'}
		</button>
	</div>

	<!-- Formulaire de création de groupe -->
	{#if showCreateForm}
		<div class="mb-8 rounded-lg border border-gray-600 bg-gray-800 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-200">Nouveau Groupe</h2>

			<!-- Nom du groupe -->
			<div class="mb-4">
				<label for="groupName" class="mb-2 block text-sm font-medium text-gray-300">
					Nom du groupe
				</label>
				<input
					id="groupName"
					type="text"
					bind:value={groupName}
					placeholder="Entrez le nom du groupe"
					maxlength="50"
					class="w-full rounded-lg border-2 border-gray-600 bg-gray-700 px-3 py-3 text-gray-100 focus:border-blue-400 focus:outline-none"
				/>
			</div>

			<!-- Ajout de joueurs -->
			<div class="mb-4">
				<label for="playerName" class="mb-2 block text-sm font-medium text-gray-300">
					Ajouter des joueurs
				</label>
				<div class="flex gap-2 max-sm:flex-col">
					<input
						id="playerName"
						type="text"
						bind:value={playerName}
						on:keydown={(e) => e.key === 'Enter' && addPlayer()}
						placeholder="Nom du joueur"
						maxlength="50"
						class="flex-1 rounded-lg border-2 border-gray-600 bg-gray-700 px-3 py-3 text-gray-100 focus:border-green-400 focus:outline-none"
					/>
					<button
						on:click={addPlayer}
						disabled={playerName.trim() === ''}
						class="rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-600"
					>
						Ajouter
					</button>
				</div>
			</div>

			<!-- Liste des joueurs -->
			{#if players.length > 0}
				<div class="mb-4">
					<h3 class="mb-2 text-lg font-medium text-gray-300">Joueurs ({players.length})</h3>
					<div class="space-y-2">
						{#each players as player, index}
							<div class="flex items-center justify-between rounded-lg bg-gray-700 px-4 py-2">
								<span class="text-gray-200">{player}</span>
								<button
									on:click={() => removePlayer(index)}
									class="text-red-400 transition-colors hover:text-red-300"
									title="Supprimer ce joueur"
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Boutons d'action -->
			<div class="flex justify-end gap-4">
				<button
					on:click={() => {
						showCreateForm = false;
						groupName = '';
						players = [];
						playerName = '';
						errorMessage = '';
					}}
					class="rounded-lg bg-gray-600 px-6 py-3 text-white transition-colors hover:bg-gray-700"
				>
					Annuler
				</button>
				<button
					on:click={createGroup}
					disabled={isLoading || groupName.trim() === '' || players.length < 2}
					class="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
				>
					{isLoading ? 'Création...' : 'Créer le groupe'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Liste des groupes -->
	<div class="space-y-4">
		{#if savedGroups.length === 0}
			<div class="rounded-lg border border-gray-600 bg-gray-800 p-8 text-center">
				<p class="text-lg text-gray-400">Aucun groupe créé pour l'instant</p>
				<p class="mt-2 text-sm text-gray-500">Créez votre premier groupe pour commencer !</p>
			</div>
		{:else}
			{#each savedGroups as group}
				<div class="rounded-lg border border-gray-600 bg-gray-800 p-6">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex-1">
							<h3 class="mb-2 text-xl font-semibold text-gray-200">{group.name}</h3>
							<div class="flex items-center gap-4 text-sm text-gray-400">
								<span
									>{group.playerNames.length} joueur{group.playerNames.length > 1 ? 's' : ''}</span
								>
								<span>{group.games.length} partie{group.games.length > 1 ? 's' : ''}</span>
								<span>Créé le {new Date(group.createdAt).toLocaleDateString('fr-FR')}</span>
							</div>
						</div>
						<div class="flex gap-2">
							<button
								on:click={() => copyToClipboard(`${window.location.origin}/group/${group.id}`)}
								class="rounded bg-gray-600 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-700"
								title="Copier le lien du groupe"
							>
								📋
							</button>
							<button
								on:click={() => deleteGroup(group.id, group.name)}
								class="rounded bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
								title="Supprimer le groupe"
							>
								🗑️
							</button>
						</div>
					</div>

					<!-- Joueurs du groupe -->
					<div class="mb-4">
						<h4 class="mb-2 text-sm font-medium text-gray-300">Joueurs :</h4>
						<div class="flex flex-wrap gap-2">
							{#each group.playerNames as playerName}
								<span class="rounded-full bg-blue-600 px-3 py-1 text-xs text-white">
									{playerName}
								</span>
							{/each}
						</div>
					</div>

					<!-- Bouton d'accès au groupe -->
					<div class="flex justify-end">
						<a
							href="/group/{group.id}"
							class="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
						>
							Gérer le groupe →
						</a>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
