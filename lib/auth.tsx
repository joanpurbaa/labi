import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import * as api from "./api";
import { clearParticipant } from "./participant";
import type { SurvivorProfile, SurvivorProfileInput } from "./survivor";

const TOKEN_KEY = "labi_access_token";
const USER_KEY = "@labi/user";

export type AuthUser = {
	id: number;
	name: string;
	email: string;
	role: string;
};

export type RegisterInput = { name: string; email: string; password: string };
export type LoginInput = { email: string; password: string };
export type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
	user: AuthUser | null;
	token: string | null;
	isReady: boolean;
	needsOnboarding: boolean;
	survivorProfile: SurvivorProfile | null;
	register: (input: RegisterInput) => Promise<AuthResult>;
	login: (input: LoginInput) => Promise<AuthResult>;
	logout: () => Promise<void>;
	saveSurvivorProfile: (input: SurvivorProfileInput) => Promise<AuthResult>;
	deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(profile: api.UserRead): AuthUser {
	return {
		id: profile.id,
		name: profile.username,
		email: profile.email,
		role: profile.role,
	};
}

async function fetchSurvivorProfile(
	token: string,
	email: string,
): Promise<{ profile: SurvivorProfile | null; needsOnboarding: boolean }> {
	try {
		const profile = await api.getSurvivorProfile(token, email);
		return { profile, needsOnboarding: profile === null };
	} catch {
		return { profile: null, needsOnboarding: false };
	}
}

async function persistSession(token: string, user: AuthUser): Promise<void> {
	await SecureStore.setItemAsync(TOKEN_KEY, token);
	await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearSession(): Promise<void> {
	await SecureStore.deleteItemAsync(TOKEN_KEY);
	await AsyncStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [needsOnboarding, setNeedsOnboarding] = useState(false);
	const [survivorProfile, setSurvivorProfile] =
		useState<SurvivorProfile | null>(null);
	const unauthorizedHandled = useRef(false);

	useEffect(() => {
		let active = true;

		(async () => {
			try {
				const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
				if (!storedToken) {
					return;
				}

				const profile = await api.me(storedToken);
				const nextUser = toAuthUser(profile);
				await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
				if (active) {
					setUser(nextUser);
					setToken(storedToken);
				}

				const survivor = await fetchSurvivorProfile(
					storedToken,
					nextUser.email,
				);
				if (active) {
					setSurvivorProfile(survivor.profile);
					setNeedsOnboarding(survivor.needsOnboarding);
				}
			} catch (error) {
				if (error instanceof api.ApiError && error.status === 401) {
					await clearSession();
					if (active) {
						setUser(null);
						setToken(null);
						setSurvivorProfile(null);
						setNeedsOnboarding(false);
					}
				}
			} finally {
				if (active) {
					setIsReady(true);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, []);

	const register = useCallback(
		async ({ name, email, password }: RegisterInput): Promise<AuthResult> => {
			const cleanName = name.trim();
			const cleanEmail = email.trim().toLowerCase();

			if (!cleanName || !cleanEmail || !password) {
				return { ok: false, error: "Semua kolom wajib diisi." };
			}

			try {
				await api.register({
					username: cleanName,
					email: cleanEmail,
					password,
					role: api.CAREGIVER_ROLE,
				});
			} catch (error) {
				return { ok: false, error: api.errorMessage(error) };
			}

			try {
				const session = await api.login({
					username: cleanEmail,
					password,
				});
				const profile = await api.me(session.access_token);
				const nextUser = toAuthUser(profile);

				await persistSession(session.access_token, nextUser);

				setToken(session.access_token);
				setSurvivorProfile(null);
				setNeedsOnboarding(true);
				setUser(nextUser);
				return { ok: true };
			} catch {
				return {
					ok: false,
					error:
						"Akun berhasil dibuat, tetapi gagal masuk otomatis. Silakan masuk.",
				};
			}
		},
		[],
	);

	const login = useCallback(
		async ({ email, password }: LoginInput): Promise<AuthResult> => {
			const cleanEmail = email.trim().toLowerCase();

			if (!cleanEmail || !password) {
				return { ok: false, error: "Email dan password wajib diisi." };
			}

			try {
				const session = await api.login({
					username: cleanEmail,
					password,
				});
				const profile = await api.me(session.access_token);
				const nextUser = toAuthUser(profile);

				await persistSession(session.access_token, nextUser);

				const survivor = await fetchSurvivorProfile(
					session.access_token,
					nextUser.email,
				);

				setToken(session.access_token);
				setSurvivorProfile(survivor.profile);
				setNeedsOnboarding(survivor.needsOnboarding);
				setUser(nextUser);
				return { ok: true };
			} catch (error) {
				return { ok: false, error: api.errorMessage(error) };
			}
		},
		[],
	);

	const logout = useCallback(async () => {
		await clearSession();
		setToken(null);
		setSurvivorProfile(null);
		setNeedsOnboarding(false);
		setUser(null);
	}, []);

	const saveSurvivorProfile = useCallback(
		async (input: SurvivorProfileInput): Promise<AuthResult> => {
			if (!user || !token) {
				return { ok: false, error: "Sesi pendamping tidak ditemukan." };
			}

			const nickname = input.survivorNickname.trim();
			if (!nickname) {
				return { ok: false, error: "Nama panggilan penyintas wajib diisi." };
			}
			if (!input.personalizationConfirmed) {
				return {
					ok: false,
					error: "Mohon konfirmasi bahwa personalisasi sudah dijelaskan.",
				};
			}

			try {
				const profile = await api.upsertSurvivorProfile(
					token,
					{ ...input, survivorNickname: nickname },
					user.email,
				);
				setSurvivorProfile(profile);
				setNeedsOnboarding(false);
				return { ok: true };
			} catch (error) {
				return { ok: false, error: api.errorMessage(error) };
			}
		},
		[user, token],
	);

	const deleteAccount = useCallback(async (): Promise<AuthResult> => {
		if (!user) {
			return { ok: false, error: "Sesi pendamping tidak ditemukan." };
		}

		try {
			if (token) {
				await api.deleteSurvivorProfile(token);
			}
			await clearParticipant(user.id);
			await clearSession();
		} catch {
			return { ok: false, error: "Gagal menghapus data. Coba lagi." };
		}

		setToken(null);
		setSurvivorProfile(null);
		setNeedsOnboarding(false);
		setUser(null);
		return { ok: true };
	}, [user, token]);

	useEffect(() => {
		if (!user) return;
		const unregister = api.registerUnauthorizedHandler(() => {
			if (unauthorizedHandled.current) return;
			unauthorizedHandled.current = true;
			Alert.alert("Sesi berakhir", "Silakan masuk kembali untuk melanjutkan.");
			void logout();
		});
		return unregister;
	}, [user, logout]);

	useEffect(() => {
		if (!user) unauthorizedHandled.current = false;
	}, [user]);

	const value = useMemo(
		() => ({
			user,
			token,
			isReady,
			needsOnboarding,
			survivorProfile,
			register,
			login,
			logout,
			saveSurvivorProfile,
			deleteAccount,
		}),
		[
			user,
			token,
			isReady,
			needsOnboarding,
			survivorProfile,
			register,
			login,
			logout,
			saveSurvivorProfile,
			deleteAccount,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth harus dipakai di dalam AuthProvider");
	}
	return context;
}
