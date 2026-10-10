import AsyncStorage from "@react-native-async-storage/async-storage";

const SURVIVOR_PROFILES_KEY = "@labi/survivor-profiles";

export type CommunicationGoal =
	| "everyday_storytelling"
	| "answering_questions"
	| "retelling_story"
	| "expressing_needs"
	| "explore_first";

export type InstructionPreference =
	| "independent"
	| "short_simple"
	| "companion_assistance"
	| "unknown";

export type PreferredSessionDuration = "3" | "5" | "10" | "unknown";

export type ConversationTopic =
	| "family"
	| "hobbies"
	| "food"
	| "daily_activities"
	| "memories"
	| "other";

export type PracticeMode = "independent" | "companion" | "both";

export type SurvivorProfile = {
	companionEmail: string;
	survivorNickname: string;
	ageRange?: string;
	primaryLanguage?: string;
	communicationGoals: CommunicationGoal[];
	instructionPreference?: InstructionPreference;
	preferredSessionDuration?: PreferredSessionDuration;
	preferredTopics: ConversationTopic[];
	practiceMode?: PracticeMode;
	personalizationConfirmed: boolean;
	updatedAt: string;
};

export type SurvivorProfileInput = Omit<
	SurvivorProfile,
	"companionEmail" | "updatedAt"
>;

async function readProfiles(): Promise<SurvivorProfile[]> {
	try {
		const raw = await AsyncStorage.getItem(SURVIVOR_PROFILES_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as SurvivorProfile[]) : [];
	} catch {
		return [];
	}
}

export async function getSurvivorProfile(
	companionEmail: string,
): Promise<SurvivorProfile | null> {
	const profiles = await readProfiles();
	return (
		profiles.find((profile) => profile.companionEmail === companionEmail) ??
		null
	);
}

export async function upsertSurvivorProfile(
	profile: SurvivorProfile,
): Promise<void> {
	const profiles = await readProfiles();
	const nextProfiles = profiles.filter(
		(entry) => entry.companionEmail !== profile.companionEmail,
	);
	nextProfiles.push(profile);
	await AsyncStorage.setItem(
		SURVIVOR_PROFILES_KEY,
		JSON.stringify(nextProfiles),
	);
}

export async function deleteSurvivorProfile(
	companionEmail: string,
): Promise<void> {
	const profiles = await readProfiles();
	const nextProfiles = profiles.filter(
		(entry) => entry.companionEmail !== companionEmail,
	);
	await AsyncStorage.setItem(
		SURVIVOR_PROFILES_KEY,
		JSON.stringify(nextProfiles),
	);
}
