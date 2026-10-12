# Kredit & Lisensi Foto

Semua foto di `assets/photos/` berasal dari berkas yang disediakan pengguna di
`assets/image/` dan **belum diverifikasi** asal, lisensi, maupun izin modelnya.
Isi kolom **Sumber**, **Lisensi**, dan **Izin model** sengaja dibiarkan `TODO`
agar tidak ada klaim yang tidak benar. Lengkapi sebelum aplikasi dirilis publik.

Aturan pakai: foto hanya sebagai aset editorial pendukung. Tidak dipakai sebagai
stimulus sesi bicara, tidak menjadi avatar tokoh, tidak muncul di layar alur
rekaman penyintas, dan tidak menampilkan suasana negatif di layar penyintas.

## Foto yang dipakai

| File | Sumber | Lisensi | Izin model | Penempatan |
| --- | --- | --- | --- | --- |
| `lansia2.webp` | TODO | TODO | TODO | Hero onboarding/login/register; empty state Riwayat (guard) |
| `lansia3.webp` | TODO | TODO | TODO | Kartu Panduan "Memulai percakapan nyaman"; thumbnail Hobi "Bermain catur"; empty state Riwayat (guard) |
| `lansia5.webp` | TODO | TODO | TODO | Kartu Panduan "Kegiatan yang enak diobrolkan"; thumbnail Hobi "Main rubik" |
| `lansia10.webp` | TODO | TODO | TODO | Header "Persiapan konsultasi" di Beranda; kartu Panduan "Menemani saat ke dokter" |
| `lansia4.webp` | TODO | TODO | TODO | Kartu Panduan "Saat lansia tampak cemas" (khusus pendamping) |

## Foto yang sengaja tidak dipakai

| File | Alasan |
| --- | --- |
| `lansia1.webp` | Crop wajah/latar (tulisan "SAMSUNG", jaket ojol hijau) belum dapat diverifikasi tanpa penglihatan; butuh crop manual sebelum dipakai. |
| `lansia6.webp` | Kesan scan otak/diagnosis, tidak cocok di layar penyintas. |
| `lansia7.webp` | Kesan permainan/"CAO", tidak cocok. |
| `lansia8.webp` | Suasana distress dengan sofa hijau dominan. |
| `lansia9.webp` | Botol obat, bernuansa medis/negatif. |

## Catatan optimasi

- Skrip: `scripts/optimize-photos.mjs` (WebP; sisi terpanjang ≤1080 untuk hero,
> = 640 untuk kartu; target per file ≤150 KB; total ≤1,2 MB).
- Ukuran hasil: lansia2 46.268 B, lansia10 28.812 B, lansia3 22.274 B,
  lansia4 13.724 B, lansia5 14.180 B (total ±136 KB).
- `lansia1.webp` tidak dioptimasi karena tidak dipakai (lihat tabel di atas).
