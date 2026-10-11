import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import * as api from "./api";
import {
	deleteSurvivorProfile,
	getSurvivorProfile,
	upsertSurvivorProfile,
	type SurvivorProfile,
	type SurvivorProfileInput,
} from "./survivor";

const TOKEN_KEY = "labi_access_token";
const USER_KEY = "@labi/user";

export type AuthUser = {
	id: number;
	name: string;
	email: string;
};

export type RegisterInput = { name: string; email: string; password: string };
export type LoginInput = { email: string; password: string };
export type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
	user: AuthUser | null;
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
	};
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
	const [isReady, setIsReady] = useState(false);
	const [needsOnboarding, setNeedsOnboarding] = useState(false);
	const [survivorProfile, setSurvivorProfile] =
		useState<SurvivorProfile | null>(null);

	useEffect(() => {
		let active = true;

		(async () => {
			try {
				const token = await SecureStore.getItemAsync(TOKEN_KEY);
				if (!token) {
					return;
				}

				const cached = await AsyncStorage.getItem(USER_KEY);
				if (cached && active) {
					setUser(JSON.parse(cached) as AuthUser);
				}

				const profile = await api.me(token);
				const nextUser = toAuthUser(profile);
				await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
				const survivor = await getSurvivorProfile(nextUser.email);

				if (active) {
					setUser(nextUser);
					setSurvivorProfile(survivor);
				}
			} catch (error) {
				if (error instanceof api.ApiError && error.status === 401) {
					await clearSession();
					if (active) {
						setUser(null);
						setSurvivorProfile(null);
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
				});
			} catch (error) {
				return { ok: false, error: api.errorMessage(error) };
			}

			try {
				const token = await api.login({
					username: cleanEmail,
					password,
				});
				const profile = await api.me(token.access_token);
				const nextUser = toAuthUser(profile);

				await persistSession(token.access_token, nextUser);

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
				const token = await api.login({
					username: cleanEmail,
					password,
				});
				const profile = await api.me(token.access_token);
				const nextUser = toAuthUser(profile);

				await persistSession(token.access_token, nextUser);

				const survivor = await getSurvivorProfile(nextUser.email);

				setSurvivorProfile(survivor);
				setNeedsOnboarding(false);
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
		setSurvivorProfile(null);
		setNeedsOnboarding(false);
		setUser(null);
	}, []);

	const saveSurvivorProfile = useCallback(
		async (input: SurvivorProfileInput): Promise<AuthResult> => {
			if (!user) {
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

			const profile: SurvivorProfile = {
				...input,
				survivorNickname: nickname,
				companionEmail: user.email,
				updatedAt: new Date().toISOString(),
			};

			try {
				await upsertSurvivorProfile(profile);
			} catch {
				return {
					ok: false,
					error: "Gagal menyimpan data. Coba lagi tanpa menutup halaman.",
				};
			}

			setSurvivorProfile(profile);
			setNeedsOnboarding(false);
			return { ok: true };
		},
		[user],
	);

	const deleteAccount = useCallback(async (): Promise<AuthResult> => {
		if (!user) {
			return { ok: false, error: "Sesi pendamping tidak ditemukan." };
		}

		try {
			await deleteSurvivorProfile(user.email);
			await clearSession();
		} catch {
			return { ok: false, error: "Gagal menghapus data. Coba lagi." };
		}

		setSurvivorProfile(null);
		setNeedsOnboarding(false);
		setUser(null);
		return { ok: true };
	}, [user]);

	const value = useMemo(
		() => ({
			user,
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
