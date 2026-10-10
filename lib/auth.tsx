import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	getSurvivorProfile,
	upsertSurvivorProfile,
	deleteSurvivorProfile,
	type SurvivorProfile,
	type SurvivorProfileInput,
} from "./survivor";

const USERS_KEY = "@labi/users";
const SESSION_KEY = "@labi/session";

export type AuthUser = {
	name: string;
	email: string;
};

type StoredUser = AuthUser & {
	password: string;
};

export type RegisterInput = {
	name: string;
	email: string;
	password: string;
};

export type LoginInput = {
	email: string;
	password: string;
};

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

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function readUsers(): Promise<StoredUser[]> {
	try {
		const raw = await AsyncStorage.getItem(USERS_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
	} catch {
		return [];
	}
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
				const sessionEmail = await AsyncStorage.getItem(SESSION_KEY);
				if (sessionEmail) {
					const users = await readUsers();
					const found = users.find(
						(entry) => entry.email === normalizeEmail(sessionEmail),
					);
					if (found && active) {
						setUser({ name: found.name, email: found.email });
						const profile = await getSurvivorProfile(found.email);
						if (active) {
							setSurvivorProfile(profile);
						}
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
			const cleanEmail = normalizeEmail(email);

			if (!cleanName || !cleanEmail || !password) {
				return { ok: false, error: "Semua kolom wajib diisi." };
			}

			const users = await readUsers();
			if (users.some((entry) => entry.email === cleanEmail)) {
				return { ok: false, error: "Email sudah terdaftar." };
			}

			const nextUser: StoredUser = {
				name: cleanName,
				email: cleanEmail,
				password,
			};

			await AsyncStorage.setItem(
				USERS_KEY,
				JSON.stringify([...users, nextUser]),
			);
			await AsyncStorage.setItem(SESSION_KEY, cleanEmail);
			setSurvivorProfile(null);
			setNeedsOnboarding(true);
			setUser({ name: cleanName, email: cleanEmail });
			return { ok: true };
		},
		[],
	);

	const login = useCallback(
		async ({ email, password }: LoginInput): Promise<AuthResult> => {
			const cleanEmail = normalizeEmail(email);
			const users = await readUsers();
			const found = users.find(
				(entry) => entry.email === cleanEmail && entry.password === password,
			);

			if (!found) {
				return { ok: false, error: "Email atau password salah." };
			}

			await AsyncStorage.setItem(SESSION_KEY, found.email);
			const profile = await getSurvivorProfile(found.email);
			setSurvivorProfile(profile);
			setNeedsOnboarding(false);
			setUser({ name: found.name, email: found.email });
			return { ok: true };
		},
		[],
	);

	const logout = useCallback(async () => {
		await AsyncStorage.removeItem(SESSION_KEY);
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

		const email = user.email;

		try {
			const users = await readUsers();
			const remaining = users.filter((entry) => entry.email !== email);
			await AsyncStorage.setItem(USERS_KEY, JSON.stringify(remaining));
			await deleteSurvivorProfile(email);
			await AsyncStorage.removeItem(SESSION_KEY);
		} catch {
			return { ok: false, error: "Gagal menghapus akun. Coba lagi." };
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
