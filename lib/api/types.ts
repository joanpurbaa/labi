import type { components } from "./schema";

type Schemas = components["schemas"];

export const CAREGIVER_ROLE = "caregiver";

export type AgeRange = Schemas["AgeRange"];
export type PrimaryLanguage = Schemas["PrimaryLanguage"];
export type CommunicationGoal = Schemas["CommunicationGoal"];
export type ConversationTopic = Schemas["ConversationTopic"];
export type InstructionPreference = Schemas["InstructionPreference"];
export type PracticeMode = Schemas["PracticeMode"];
export type PreferredSessionDuration = Schemas["PreferredSessionDuration"];

export type UserRead = Schemas["UserRead"];
export type TokenResponse = Schemas["Token"];
export type RegisterPayload = Schemas["UserCreate"];

export type LoginPayload = {
	username: string;
	password: string;
};

export type SurvivorProfileRead = Schemas["SurvivorProfileRead"];
export type SurvivorProfileUpsert = Schemas["SurvivorProfileUpsert"];

export type ParticipantCreate = Schemas["ParticipantCreate"];
export type ParticipantRead = Schemas["ParticipantRead"];

export type IURead = Schemas["IURead"];
export type StoryDetail = Schemas["StoryDetail"];

export type SessionCreate = Schemas["SessionCreate"];
export type SessionRead = Schemas["SessionRead"];
export type SessionHistoryItem = Schemas["SessionHistoryItem"];

export type Pagination = {
	page?: number;
	page_size?: number;
	total?: number;
	total_items?: number;
	total_pages?: number;
	has_next?: boolean;
};

export type PaginatedSessions = {
	data: SessionHistoryItem[];
	pagination: Pagination;
};

export type RecordingRead = Schemas["RecordingRead"];

export type TranscriptRead = Schemas["TranscriptRead"];
export type TranscriptUpsert = Schemas["TranscriptUpsert"];

export type SpeechMetricsRead = Schemas["SpeechMetricsRead"];
export type SilentPauseRead = Schemas["SilentPauseRead"];
export type IuSuggestionRead = Schemas["IuSuggestionRead"];

export type AnalysisRunIn = Schemas["AnalysisRunIn"];
export type AnalysisRead = Schemas["AnalysisRead"];

export type AssessmentStatus = "met" | "not_met" | "unclear";
export type AssessmentItemIn = Schemas["AssessmentItemIn"];
export type AssessmentUpsert = Schemas["AssessmentUpsert"];
export type AssessmentRead = Schemas["AssessmentRead"];

export type CompleteIn = Schemas["CompleteIn"];
export type CompleteResult = Schemas["CompleteResult"];
export type CompleteOut = Schemas["CompleteOut"];

export type ResultItemRead = Schemas["ResultItemRead"];
export type ResultRead = Schemas["ResultRead"];

export type TrendPoint = Schemas["TrendPoint"];
export type TrendDelta = Schemas["TrendDelta"];
export type ParticipantTrendRead = Schemas["ParticipantTrendRead"];

export type StoryListItem = {
	id: number;
	title: string;
	version?: number;
	status?: string;
};
