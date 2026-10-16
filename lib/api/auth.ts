import { request } from "./client";
import type {
	LoginPayload,
	RegisterPayload,
	TokenResponse,
	UserRead,
} from "./types";

export function register(payload: RegisterPayload): Promise<UserRead> {
	return request<UserRead>("/auth/register", { method: "POST", body: payload });
}

export function login(payload: LoginPayload): Promise<TokenResponse> {
	return request<TokenResponse>("/auth/login", {
		method: "POST",
		body: {
			email: payload.email,
			password: payload.password,
		},
	});
}

export function me(token: string): Promise<UserRead> {
	return request<UserRead>("/auth/me", { method: "GET", token });
}
