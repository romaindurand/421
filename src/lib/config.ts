import { dev } from '$app/environment';

interface AppConfig {
	// Sécurité
	requirePasswordInDev: boolean;
	
	// Session
	sessionDurationDays: number;
	
	// Cookies
	cookieSettings: {
		secure: boolean;
		sameSite: 'strict' | 'lax' | 'none';
	};
}

export const config: AppConfig = {
	// En mode dev, on peut désactiver les mots de passe pour faciliter le développement
	requirePasswordInDev: false,
	
	// Durée de session (30 jours par défaut)
	sessionDurationDays: 30,
	
	// Configuration des cookies
	cookieSettings: {
		secure: !dev, // Secure seulement en production
		sameSite: dev ? 'lax' : 'strict' // Plus permissif en dev
	}
};

// Fonction utilitaire pour savoir si les mots de passe sont requis
export function isPasswordRequired(): boolean {
	return !dev || config.requirePasswordInDev;
}

// Fonction utilitaire pour obtenir la durée de session en secondes
export function getSessionDuration(): number {
	return config.sessionDurationDays * 24 * 60 * 60;
}
