export type UserRead = {
	id: number;
	username: string;
	email: string;
	created_at: string;
	updated_at: string;
};

export type TokenResponse = {
	access_token: string;
	token_type: string;
};

export type RegisterPayload = {
	username: string;
	email: string;
	password: string;
};

export type LoginPayload = {
	username: string;
	password: string;
};
