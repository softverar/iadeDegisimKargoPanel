# Kurye Barkod İşleme ve Takip Paneli

Modern bir kurye barkod işleme ve admin takip sistemi. Next.js, TypeScript, Turso (SQLite) ve Tailwind CSS kullanılarak geliştirilmiştir.

## Özellikler

### Kurye Paneli
- Firma seçimi (Aras Kargo, PTT, Yurtiçi, Sürat, Kargoist vb.)
- Barkod okutma (el terminali desteği)
- Kesintisiz barkod okutma (otomatik focus)
- Barkod listesi görüntüleme
- Toplu kaydetme

### Admin Paneli
- Tüm işlemleri görüntüleme
- Detaylı barkod listesi
- Filtreleme ve arama (gelecek güncellemelerde)

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyası oluşturun:

```env
# Turso Database Configuration
TURSO_DATABASE_URL=your-turso-database-url
TURSO_AUTH_TOKEN=your-turso-auth-token

# JWT Secret
JWT_SECRET=your-secret-key-here

# Default Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Turso Veritabanı Kurulumu

1. [Turso](https://turso.tech) hesabı oluşturun
2. Yeni bir veritabanı oluşturun
3. Database URL ve Auth Token'ı `.env.local` dosyasına ekleyin

### 4. Veritabanını Başlatın

İlk çalıştırmada veritabanı tabloları otomatik olarak oluşturulacaktır.

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Kullanım

### İlk Giriş

- **Admin**: Varsayılan kullanıcı adı: `admin`, Şifre: `admin123`
- **Kurye**: Admin panelinden yeni kurye kullanıcıları oluşturulabilir (gelecek güncellemelerde)

### Kurye İşlemleri

1. Kurye girişi yapın
2. Kargo firmasını seçin
3. Barkodları okutun veya manuel girin
4. "Kaydet" butonuna tıklayın

### Admin İşlemleri

1. Admin girişi yapın
2. İşlem listesini görüntüleyin
3. Detay görmek için göz ikonuna tıklayın

## Teknolojiler

- **Next.js 14** - React framework
- **TypeScript** - Tip güvenliği
- **Turso** - SQLite tabanlı veritabanı
- **Tailwind CSS** - Stil framework'ü
- **JWT** - Kimlik doğrulama
- **bcryptjs** - Şifre hashleme

## Proje Yapısı

```
├── app/
│   ├── api/          # API routes
│   ├── admin/        # Admin paneli
│   ├── kurye/        # Kurye paneli
│   └── page.tsx      # Ana sayfa (giriş)
├── components/        # React bileşenleri
├── lib/              # Yardımcı fonksiyonlar
└── package.json
```

## Netlify'a Deploy Etme

Bu projeyi Netlify'a deploy etmek için detaylı rehber için [NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md) dosyasına bakın.

Kısa özet:
1. Netlify hesabınıza giriş yapın ve yeni site oluşturun
2. Repository'nizi bağlayın
3. Environment variables'ları ekleyin (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET)
4. Deploy'u başlatın
5. İlk deploy'dan sonra `/api/init` endpoint'ini çağırarak veritabanını başlatın

## Güvenlik Notları

- İlk kurulumdan sonra admin şifresini mutlaka değiştirin
- JWT_SECRET için güçlü bir anahtar kullanın
- Production ortamında HTTPS kullanın

## Lisans

Bu proje özel kullanım içindir.








