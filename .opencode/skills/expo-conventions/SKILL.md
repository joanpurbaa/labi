---
name: expo-ui-ux-mobile
description: Panduan UI/UX untuk aplikasi mobile React Native + Expo yang ramah semua usia (milenial hingga lansia). Gunakan setiap kali membuat, mengubah, atau merapikan layar, komponen, layout, spacing, navigasi, form, atau copywriting antarmuka. Fokus pada keterbacaan, target sentuh besar, hierarki jelas, satu aksi utama per layar, dan konsistensi. Tidak mengubah fitur, API, atau logika bisnis.
---

# Expo Mobile UI/UX Guidelines (Ramah Semua Usia)

Skill ini dipakai saat mengerjakan sisi frontend. Pengguna aplikasi mencakup caregiver usia produktif (milenial) dan lansia, sehingga semua keputusan UI harus lolos dua uji: **mudah dibaca/disentuh oleh orang berusia lanjut** dan **tetap terasa modern bagi pengguna muda**.

## 0. Aturan utama (baca dulu)

1. **Jangan mengubah** API, kontrak data, state logic, routing, fitur, atau teks/copy yang sudah ada, kecuali diminta eksplisit. Masalah non-UI dicatat di laporan akhir, bukan diperbaiki diam-diam.
2. **Pertahankan identitas visual yang sudah ada** (latar krem hangat, kartu putih sudut membulat, aksen merah-oranye, chip hijau/pink, font sans rounded). Jangan membuat tema baru. Selalu pakai token/theme yang sudah ada; tambahkan token baru hanya bila benar-benar belum ada.
3. **Periksa dulu struktur proyek** sebelum mengubah: komponen bersama, theme, pola navigasi, library yang sudah terpasang. Pakai ulang, jangan duplikasi.
4. **Kompatibel dengan Expo Web dan native (iOS/Android).** Hindari API yang hanya jalan di satu platform tanpa fallback (`Platform.select`, cek `Platform.OS`).
5. **Jangan menambah library UI besar** tanpa alasan kuat. Utamakan yang sudah ada di `package.json`.
6. Kerjakan bertahap, jalankan lint dan type-check setelah tiap perubahan, dan jelaskan apa yang berubah dan kenapa.

## 1. Prinsip UX untuk pengguna lintas usia

- **Satu layar, satu aksi utama.** Tombol utama harus jelas dan terlihat tanpa scroll bila memungkinkan.
- **Hasil → Aksi → Detail.** Tampilkan yang dibutuhkan sebelum bertindak lebih dulu; detail teknis, referensi, dan penjelasan panjang taruh di balik tap (accordion/bottom sheet). Jangan menghapus informasi, hanya atur kapan muncul.
- **Bahasa ajakan, bukan bahasa laporan.** Utamakan kalimat hangat, pendek, dan konkret ("Yuk latihan bareng") daripada istilah klinis.
- **Kurangi beban kognitif.** Maksimal sekitar 5–7 item pilihan sekaligus, kelompokkan yang terkait, jangan menumpuk banyak kartu bertingkat.
- **Jangan mengandalkan warna saja.** Selalu pasangkan warna dengan ikon dan/atau teks (misalnya "✓ Diingat" vs "♡ Belum diingat").
- **Konsisten.** Aksi yang sama punya nama, ikon, dan posisi yang sama di semua layar.
- **Beri umpan balik untuk setiap aksi:** state pressed, loading, sukses, error. Pengguna tidak boleh bertanya-tanya "tadi kepencet atau tidak?".
- **Pemaaf terhadap kesalahan.** Aksi destruktif butuh konfirmasi yang jelas dan bisa dibatalkan bila mungkin. Tombol destruktif dipisahkan dari aksi normal.
- **Nada tenang dan suportif**, terutama untuk topik kesehatan: jangan menakut-nakuti, jangan menghakimi, tetap jujur.

## 2. Ukuran, tipografi, dan kontras (ramah lansia)

| Elemen | Ketentuan |
|---|---|
| Teks isi (body) | 16px (minimum 15px), line-height ≈ 1.45–1.5 |
| Caption/keterangan | minimum 13px; jangan di bawah 12px |
| Judul layar | 22–24px, bold/semibold |
| Heading section | 17–18px, semibold |
| Tombol utama | tinggi 52–56px, teks 16–17px semibold |
| Tombol sekunder | tinggi 48px |
| Target sentuh minimum | **48×48dp** (absolut minimum 44) |
| Jarak antar target sentuh | minimal 8px |
| Kontras teks normal | minimal **4.5:1** (WCAG AA); teks besar minimal 3:1 |
| Panjang baris | ideal di bawah 70 karakter |

- Hormati pengaturan font sistem: **jangan** matikan `allowFontScaling`. Uji dengan font scale hingga 200%. Pakai `minHeight` bukan `height` fixed untuk kontainer teks, dan biarkan teks wrap.
- Hindari teks abu-abu muda di atas latar krem. Periksa kontras kombinasi teks sekunder, teks merah di atas latar salmon, dan teks pada chip.
- Satu atau dua keluarga font saja. Gunakan bobot (regular/semibold/bold) untuk hierarki, bukan ukuran yang terlalu banyak variasi.
- Hindari ALL CAPS untuk kalimat. Pakai sentence case.
- Jangan memakai teks dalam gambar untuk informasi penting.

## 3. Layout, spacing, dan alignment

### Token spasi
Gunakan skala **4, 8, 12, 16, 20, 24, 32, 40**. Dilarang nilai acak di luar skala. Simpan di theme (`spacing.xs/sm/md/lg/xl`), jangan hardcode.

| Pemakaian | Nilai |
|---|---|
| Padding horizontal halaman | 20 (16 di layar sempit ≤ 360) |
| Jarak antar section | 24 |
| Heading section → konten | 12 |
| Jarak antar kartu dalam list | 12 |
| Padding dalam kartu | 16 (kartu hero 20–24) |
| Radius kartu | konsisten, ikuti token yang ada |

### Aturan alignment
- Gunakan `gap` pada kontainer flex untuk jarak antar elemen, bukan margin tambal sulam per elemen.
- Elemen yang harus center: pakai `alignItems: 'center'` / `justifyContent: 'center'` / `alignSelf: 'center'`. **Jangan** center dengan `left`/`marginLeft` angka manual.
- Teks di dalam ring/lingkaran: kontainer dengan ukuran tetap + `alignItems/justifyContent: 'center'` atau `StyleSheet.absoluteFill`.
- Dalam satu kartu, **satu arah alignment teks**. Bila ilustrasi di atas dicenter, judul dan deskripsi di kartu itu juga dicenter.
- Ikon di samping teks satu baris: `alignItems: 'center'`. Ikon di samping teks multi-baris: `alignItems: 'flex-start'` dan sejajarkan dengan baris pertama.
- Anak flex yang berisi teks panjang butuh `flexShrink: 1` (dan `minWidth: 0` di web) agar tidak mendorong layout keluar layar.
- `position: 'absolute'` hanya untuk dekorasi (sparkle, badge notifikasi), bukan untuk layout normal. Hindari margin negatif.
- Jangan pakai lebar/tinggi fixed untuk kontainer yang berisi teks.
- Untuk layar lebar/tablet/web: batasi lebar konten (`maxWidth: 480–560`, `alignSelf: 'center'`, `width: '100%'`).

### Pola ListRow (sumber bug paling umum)
Baris dengan ikon, teks, dan chevron harus selalu berbentuk satu baris horizontal:

```tsx
<Pressable
  onPress={onPress}
  accessibilityRole="button"
  accessibilityLabel={`${title}, ${subtitle}`}
  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
>
  <View style={styles.leading}>{leading}</View>          {/* flexShrink: 0 */}
  <View style={styles.body}>                             {/* flex: 1, flexShrink: 1 */}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
  <ChevronRight />                                       {/* flexShrink: 0, alignSelf: 'center' */}
</Pressable>

// styles.row: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 72, padding: 16 }
```

Chevron navigasi selalu di kanan dan di tengah vertikal, tidak pernah jatuh ke baris baru. Seluruh baris adalah satu area sentuh. Chevron untuk accordion menunjuk ke bawah dan berputar saat terbuka.

### Safe area dan scroll
- Bungkus layar dengan `SafeAreaView`/`useSafeAreaInsets` dari `react-native-safe-area-context`. Hormati inset atas dan bawah (notch, gesture bar).
- Konten di layar yang punya bottom tab/FAB harus punya `paddingBottom` setara tinggi nav + inset + 16, supaya elemen terakhir tidak tertutup.
- Pakai `ScrollView`/`FlatList` dengan `contentContainerStyle` untuk padding, bukan padding pada wrapper luar. Hindari scroll bersarang.
- Form: bungkus dengan `KeyboardAvoidingView` (iOS: `behavior="padding"`, Android sesuaikan) dan pastikan tombol aksi tidak tertutup keyboard. Gunakan `keyboardShouldPersistTaps="handled"`.
- Hindari `Dimensions.get('window')` statis; gunakan `useWindowDimensions()` agar responsif terhadap rotasi dan resize web.

## 4. Komponen dan interaksi

### Tombol
- Satu tombol primer per layar/section. Sekunder berupa outline, tersier berupa text link (tetap tinggi sentuh ≥ 44–48).
- Selalu ada state: normal, pressed (turunkan opacity atau tint, jangan hanya mengandalkan hover), disabled (jelas terlihat dan bukan sekadar pudar), loading (spinner + teks tetap terbaca, cegah double-tap).
- Label tombol berupa kata kerja spesifik: "Mulai latihan", "Simpan perubahan", bukan "OK" atau "Submit".
- Tombol destruktif ("Hapus akun & data") dipisah jaraknya, berwarna destruktif, dan wajib dialog konfirmasi.
- Pakai `Pressable` dengan `hitSlop` bila area visual lebih kecil dari target minimum.

### Kartu dan list
- Hindari terlalu banyak kartu bertumpuk. Gunakan whitespace dan divider tipis dibanding border berlapis.
- List panjang pakai `FlatList` (virtualisasi), bukan `map` di dalam `ScrollView`.
- Item yang bisa ditekan harus **terlihat** bisa ditekan (chevron, tombol, atau affordance jelas).

### Chip dan badge
- Chip read-only tinggi ≥ 32; chip yang bisa ditekan tinggi ≥ 40 dengan target sentuh ≥ 44.
- Chip boleh wrap ke beberapa baris (`flexWrap: 'wrap'`, `gap: 8`); teks panjang jangan terpotong.
- Status selalu: ikon + teks + warna.

### Navigasi
- Bottom tab maksimal 3–5 item. Label selalu tampil di bawah ikon. Item aktif hanya berubah warna/background/bobot, **bukan ukuran**, agar tidak terjadi layout shift.
- Semua layar stack punya header yang seragam (tinggi, posisi judul, tombol kembali ≥ 44).
- Tombol kembali selalu ada dan berfungsi (termasuk tombol back Android).
- Hapus focus ring/outline persegi yang muncul setelah tap di web (`outline: 'none'` hanya bila diganti `:focus-visible` yang rapi).

### Progressive disclosure
- Accordion: header penuh lebar, `accessibilityState={{ expanded }}`, chevron berputar, animasi singkat (≤ 200ms).
- Bottom sheet untuk detail tambahan: bisa ditutup dengan swipe-down, tombol close, dan tombol back Android.

### Form dan input
- Label selalu terlihat (bukan hanya placeholder). Font input minimal 16px.
- Pakai `keyboardType`, `autoComplete`, `textContentType`, `returnKeyType` yang tepat.
- Validasi saat blur/submit, bukan tiap ketikan. Pesan error di dekat field, menjelaskan **apa yang salah dan cara memperbaikinya**.
- Pilihan sedikit (≤ 5): pakai segmented control/radio/chip, bukan dropdown.
- Toggle/Switch: area sentuh ≥ 44, label menjelaskan efeknya, warna mengikuti token (on = primary, off = netral).

## 5. State yang wajib ditangani di setiap layar

- **Loading:** skeleton yang menyerupai layout asli, bukan spinner layar penuh (kecuali proses singkat).
- **Empty:** pesan ramah + satu aksi yang jelas ("Belum ada sesi. Mulai sesi pertama").
- **Error:** jelaskan apa yang terjadi dan solusinya, sediakan tombol "Coba lagi". Jangan tampilkan stack trace atau pesan teknis mentah.
- **Offline/lambat:** beri tahu dengan tenang dan jangan menghilangkan data yang sudah ada.
- **Data parsial:** bagian yang datanya tidak ada **tidak dirender** (tanpa heading kosong). Bila format data tak dikenali, tampilkan teks asli, jangan crash.
- **Sukses:** konfirmasi singkat (toast/animasi kecil) dengan kata yang sama dengan aksinya.

## 6. Aksesibilitas (wajib, bukan tambahan)

- Setiap elemen interaktif punya `accessibilityRole`, `accessibilityLabel` yang bermakna, dan `accessibilityState` bila relevan (selected, expanded, disabled, busy).
- Ikon tanpa teks wajib punya label. Elemen dekoratif: `accessible={false}` / `importantForAccessibility="no"`.
- Urutan fokus mengikuti urutan visual. Gabungkan elemen terkait dalam satu `accessible` group (misal kartu = satu fokus).
- Informasi penting yang berubah dinamis (timer, hasil, error) diumumkan dengan `accessibilityLiveRegion` / `AccessibilityInfo.announceForAccessibility`, dengan frekuensi wajar (bukan tiap detik).
- Hormati **reduce motion** (`AccessibilityInfo.isReduceMotionEnabled`): matikan animasi non-esensial.
- Dukung mode gelap bila token tema sudah ada; jangan hardcode warna.
- Di web: pastikan bisa dioperasikan dengan keyboard dan `:focus-visible` terlihat jelas.

## 7. Motion dan feedback

- Animasi hanya untuk menjelaskan perubahan (buka/tutup, berpindah, berhasil), durasi 150–300ms, easing halus. Jangan animasi dekoratif yang berulang-ulang.
- Gunakan `react-native-reanimated` bila sudah terpasang; gunakan `useNativeDriver: true` untuk Animated API.
- Haptic ringan (`expo-haptics`) untuk aksi penting (mulai, selesai, error). Hormati preferensi pengguna (mis. toggle "Getaran saat menekan") dan jangan dipakai di web.
- Jangan ada konten yang bergerak otomatis dan tak bisa dihentikan.

## 8. Copywriting UI (Bahasa Indonesia)

- Sapaan hangat, kalimat aktif, pendek: satu ide per kalimat.
- Nama hal sesuai yang dipahami pengguna, bukan istilah sistem. Istilah teknis/klinis boleh ada tetapi sertakan penjelasan awam (tooltip/sheet) dan taruh di level detail.
- Konsisten: satu konsep, satu istilah di seluruh app. Waspadai inkonsistensi (misal "Penyintas" vs nama panggilan).
- Error tidak meminta maaf berlebihan dan tidak menyalahkan pengguna; jelaskan masalah dan langkah perbaikan.
- Topik kesehatan: jangan membuat klaim medis baru. Copy baru hanya merangkum data yang ada. Pertahankan disclaimer ("Ini bukan diagnosis") dan peringatan medis asli, hanya atur penyajiannya agar lebih tenang dan jelas langkah lanjutnya.
- Konten tentang kesehatan yang disederhanakan ditandai `// TODO(review-konten)` agar divalidasi pihak yang berwenang sebelum rilis.

## 9. Struktur kode

- Pisahkan **presenter/mapper** (mengubah respons API menjadi view-model siap tampil) dari komponen UI. Komponen hanya membaca view-model, bukan respons mentah. Sediakan fallback bila field tidak ada.
- Komponen kecil, bernama jelas, dan dipakai ulang: `Screen`, `AppHeader`, `Card`, `Section`, `ListRow`, `Chip`, `Badge`, `Button`, `InfoNote`, `AccordionRow`, `EmptyState`, `ErrorState`, `Skeleton`.
- Style lewat `StyleSheet.create` dan token theme. Tidak ada angka ajaib atau warna hardcode di komponen.
- TypeScript jika proyek memakainya: tipe props eksplisit, hindari `any`.
- Gunakan `memo`/`useCallback` secukupnya untuk item list; jangan optimasi prematur.

## 10. Alur kerja saat diminta mengerjakan UI

1. **Audit:** baca layar/komponen terkait, catat token dan komponen bersama yang ada.
2. **Rencana singkat:** tulis perubahan yang akan dilakukan (hierarki, layout, state) sebelum mengubah kode.
3. **Implementasi bertahap**, mulai dari fondasi (token, shell, safe area), lalu primitif komponen, lalu layar.
4. **Verifikasi:** uji di lebar 320, 360, 390, 412, dan 430; font scale 130% dan 200%; mode gelap bila ada; Android dan iOS (atau Expo Web bila hanya itu yang tersedia).
5. **Laporkan:** ringkasan perubahan, asumsi, hal di luar UI yang ditemukan (bug logika, inkonsistensi data/copy), dan hal yang butuh perubahan backend.

## 11. Checklist sebelum selesai

- [ ] Margin kiri-kanan sama di semua layar; tidak ada overflow horizontal.
- [ ] Elemen yang harus center benar-benar center (ring skor, avatar, tombol tengah nav, ilustrasi hero, grid ikon).
- [ ] Chevron/ikon trailing di kanan dan tengah vertikal; tidak jatuh ke baris baru.
- [ ] Tidak ada tombol/teks yang menempel ke elemen lain; jarak hanya dari skala spasi.
- [ ] Semua target sentuh ≥ 44–48dp; teks body ≥ 15–16px; kontras ≥ 4.5:1.
- [ ] Konten paling bawah tidak tertutup bottom nav, keyboard, atau gesture bar.
- [ ] Satu aksi utama jelas di tiap layar; detail sekunder tersembunyi di balik tap.
- [ ] Loading, empty, dan error state ada dan ramah.
- [ ] Label aksesibilitas, role, dan state terpasang; reduce motion dihormati.
- [ ] Layout tetap rapi pada font scale 200%.
- [ ] Tidak ada perubahan API, fitur, routing, atau copy yang tidak diminta.
- [ ] Lint, type-check, dan test yang ada tetap lulus.

## 12. Hal yang dilarang

- Mengubah API, kontrak data, logika bisnis, atau routing tanpa diminta.
- Menghapus informasi dari tampilan (boleh dilipat, tidak boleh dibuang) atau memperhalus makna peringatan medis.
- Menghapus disclaimer kesehatan.
- Teks kecil (< 12px), kontras rendah, atau target sentuh kecil.
- Hanya mengandalkan warna untuk makna.
- Menonaktifkan scaling font sistem atau zoom.
- `Dimensions` statis untuk layout responsif, ukuran fixed untuk kontainer teks, margin negatif, atau center manual dengan angka piksel.
- Animasi dekoratif berlebihan, atau konten yang bergerak otomatis tanpa kontrol.
- Menambahkan library besar tanpa alasan, atau membuat sistem desain baru di luar token yang sudah ada.