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
