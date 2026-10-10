# Laporan Bug — Fokus `TextInput` Lompat/Berputar Otomatis (Android, Expo Go)

## 1. Ringkasan

Di halaman **Login** dan **Register**, fokus kolom input berpindah sendiri tanpa disentuh:

- **Login** (2 kolom: Email, Password): tap **Email** → kursor langsung pindah ke **Password** (maju 1 field), tanpa mengetuk apa pun.
- **Register** (3 kolom: Nama lengkap, Email, Password): fokus **berputar terus** Nama → Email → Password → Nama → … (loop tanpa henti).

Perilaku normal yang diharapkan: tap satu kolom → fokus bertahan di kolom itu.

Bug hanya terjadi di **device fisik**, tidak di emulator. Hanya di **Android**. iOS normal.

## 2. Environment

```
expo-env-info 2.1.0
System:
  OS: macOS 27.0
  Shell: zsh
Binaries:
  Node: 24.19.0
  npm: 11.17.0
IDEs:
  Android Studio: 2026.1
npmPackages:
  expo: ~57.0.27 => 57.0.27
  expo-router: ~57.0.25 => 57.0.25
  react: 19.2.3
  react-dom: 19.2.3
  react-native: 0.86.3
```

Runtime: **Expo Go** (scan QR), bukan development build.
Package terkait input: `react-native` 0.86.3, `react-native-screens` ~4.26.0, `expo-router` ~57.0.25.

> TODO (isi dari device yang repro): merek/model HP, versi Android, keyboard (Gboard/Samsung/…), apakah ada Bluetooth/OTG keyboard, apakah ada aplikasi accessibility/auto-click aktif.

## 3. Langkah reproduksi

1. `npx expo start -c`, buka proyek di **Expo Go** pada HP Android fisik.
2. Dari halaman auth, buka **Login**.
3. Tap kolom **Email** dan amati: kursor pindah sendiri ke **Password**.
4. Buka **Register**, tap salah satu kolom: fokus berputar Nama → Email → Password → Nama tanpa henti.
5. (Pembanding) Di emulator Android, bug **tidak** muncul.

## 4. Struktur kode yang relevan

Tidak ada satu pun pemanggilan fokus di kode aplikasi (sudah diverifikasi menyeluruh):

- `components/TextField.tsx:20` — komponen input; hanya men-`spread` props ke `TextInput`, `onFocus`/`onBlur` hanya `setState`. Tidak ada `autoFocus`, tidak ada `focus()`.
- `app/(auth)/register.tsx` — 3 `TextField`. `returnKeyType="next"`, `"next"`, `"done"`; `onSubmitEditing={handleSubmit}` di password. Tidak ada ref fokus.
- `app/(auth)/login.tsx` — 2 `TextField`, pola sama.
- `components/AuthScreen.tsx` — wrapper; dulu `ScrollView` (Android), kini diubah menjadi `View` polos di Android.
- `components/Icon.tsx`, `components/ui/Button.tsx`, `components/PrimaryButton.tsx` — bersih.
- `lib/auth.tsx`, `app/_layout.tsx` — bersih, tidak ada render loop.

Kesimpulan: **pemicu bukan di kode aplikasi, melainkan perilaku native React Native/Android.**

## 5. Analisis akar masalah (bukti dari source RN 0.86.3)

Pola "fokus maju satu field saat input difokuskan" adalah lintasan `focusSearch(FOCUS_FORWARD)` yang dijalankan native.

a. `returnKeyType="next"` memasang `IME_ACTION_NEXT` di EditText:
`node_modules/react-native/ReactAndroid/.../textinput/ReactEditText.kt:894-913` (`updateImeOptions`) — `"next" -> EditorInfo.IME_ACTION_NEXT`.

b. Saat `TextInput` membuat input connection (setiap kali difokuskan), Android `TextView.onCreateInputConnection` memanggil `focusSearch()`; RN override di `ReactScrollView`/Fabric:
- `ReactEditText.kt:342-360` — `onCreateInputConnection` (memanggil `super`, yang men-trigger `focusSearch`).
- `ReactScrollView.java:487-506` — `focusSearch()` → `findNextFocusableView(...)`.
- `ReactScrollViewHelper.kt:543-569` — `findNextFocusableView(...)` → `FabricUIManager.findNextFocusableElement(...)`.

c. Handler editor action RN:
`ReactTextInputManager.kt:915-956` — `setOnEditorActionListener`; ada komentar yang menyebut `IME_ACTION_NEXT` dan `IME_ACTION_PREVIOUS` bisa dipicu Android, dan RN mencoba mencegahnya.

d. `clearFocusAndMaybeRefocus()`:
`ReactEditText.kt:371-385` — mengonfirmasi ada masalah "refocusing to a new view" di Android tertentu, dengan komentar bahwa pada versi Android lama, `clearFocus()` bisa memindah fokus ke view lain.

Feature flag terkait (mengaktifkan jalur `focusSearch` custom RN):
`ReactScrollView.java:491` — `ReactNativeFeatureFlags.enableCustomFocusSearchOnClippedElementsAndroid()`.

## 6. Referensi issue upstream (identik/terkait)

- expo/expo **#38029** — "TextInput Refocus Bug On Android": beberapa input, input di atas "merampas" fokus setelah keyboard ditutup; hanya device fisik (Samsung Galaxy S8). Ditutup dengan arahan: lapor ke repo React Native.
- facebook/react-native **#53188** — "Text Input Refocus Bug SDK 53": sama, muncul di SDK 53, hilang di SDK 52.
- facebook/react-native **#53046** — NullPointer/kekacauan fokus di `ReactScrollViewHelper.findNextFocusableView` saat banyak `TextInput` dalam `KeyboardAvoidingView` + `ScrollView`.
- facebook/react-native **#57951** — crash native di `ReactScrollView.focusSearch` → `FabricUIManager.findNextFocusableElement`; mitigasi resmi = **matikan flag native** `enableCustomFocusSearchOnClippedElementsAndroid = false` (butuh binari Android baru, tidak bisa via JS/OTA).
- Commit RN **bbff754 / PR #50826** — memperkenalkan delegasi focus-search ke Shadow Tree untuk `ReactScrollView` (asal jalur di atas).
- facebook/react-native **#48547** — "TextInputs can now receive focus via external keyboard" (perubahan penanganan fokus TextInput Android).

## 7. Yang sudah dicoba (belum menyelesaikan)

1. `autoComplete="off"` + `importantForAutofill="no"` di semua field Login & Register → tidak mempan (bukan Autofill).
2. `keyboardShouldPersistTaps="always"` pada ScrollView → tidak mempan.
3. Menghapus `ScrollView` dari jalur input di Android (`AuthScreen` pakai `View` polos) → masih berulang.
4. **Focus guard** JS (`lib/focusGuard.ts`) — mendeteksi field yang benar-benar di-`onPressIn`, dan jika sebuah input mendapat fokus tanpa tap, langsung `blur()`; hanya Android. Dipasang di Login & Register via `ref` + `onFocus` + `onPressIn`. → **Masih ada masalah.**

Kesimpulan sementara: bukan Autofill, bukan ScrollView. Tampaknya murni jalur fokus native Android RN pada device ini.

## 8. Pertanyaan / hal yang perlu bantuan

1. Kenapa hanya di device fisik tertentu dan tidak di emulator? Apakah tergantung API level / OEM (MIUI, One UI, dll.)?
2. Apakah `focusSearch(FOCUS_FORWARD)` di `onCreateInputConnection` memang **memindahkan** fokus, atau hanya memeriksa? Jika memindahkan, di jalur mana `requestFocus()` dipanggil?
3. Apakah ada solusi **tanpa** menyentuh native (mis. `android:windowSoftInputMode`, `disableFullscreenUI`, atau prop TextInput tertentu) yang benar-benar mematikan jalur ini?
4. Apakah upgrade/downgrade versi RN, atau menonaktifkan New Architecture (Fabric), menghilangkan bug ini?
5. Apakah flag `enableCustomFocusSearchOnClippedElementsAndroid=false` benar satu-satunya fix andal (butuh dev build)?

## 9. Rekomendasi perbaikan

- **Development build** (`npx expo run:android`) lalu set `enableCustomFocusSearchOnClippedElementsAndroid = false` (atau upgrade/patch RN sesuai #57951). Ini fix paling andal; tidak bisa lewat Expo Go.
- Uji pembanding: jalankan di emulator vs device, dan coba ganti IME (Gboard ⇄ Samsung) serta tanpa Autofill service.
- Sertakan rekaman video + `adb logcat` saat fokus berpindah, plus `adb shell dumpsys input_method` untuk melihat koneksi IME.

## 10. Minimal repro (untuk dilampirkan)

Buat proyek Expo kosong dengan satu screen berisi 2–3 `TextInput` dalam `View` (tanpa ScrollView), `returnKeyType="next"`, lalu:
- Android device fisik: tap input pertama → amati fokus pindah/loop.
- Android emulator: normal.

Kode inti yang dipakai di proyek ini (disederhanakan):

```tsx
// TextField: meneruskan props ke TextInput
<TextInput
  ref={ref}
  {...rest}
  onFocus={(e) => { setFocused(true); onFocus?.(e); }}
  onBlur={(e) => { setFocused(false); onBlur?.(e); }}
/>

// Login
<TextField label="Email" value={email} onChangeText={setEmail}
  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
  autoComplete="off" importantForAutofill="no" returnKeyType="next" />
<TextField label="Password" value={password} onChangeText={setPassword}
  secure autoCapitalize="none" autoComplete="off" importantForAutofill="no"
  returnKeyType="done" onSubmitEditing={handleSubmit} />
```

---

*Dibuat untuk diteruskan ke asisten/issue tracker. Bagian yang perlu dilengkapi: detail device (bagian 2).*
