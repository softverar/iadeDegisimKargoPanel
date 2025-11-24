# Netlify'a Deploy Etme Rehberi

Bu projeyi Netlify'a deploy etmek için aşağıdaki adımları izleyin.

## 1. Netlify Hesabı ve Proje Oluşturma

1. [Netlify](https://www.netlify.com) hesabınıza giriş yapın
2. "Add new site" > "Import an existing project" seçeneğini seçin
3. GitHub, GitLab veya Bitbucket hesabınızı bağlayın
4. Bu repository'yi seçin

## 2. Build Ayarları

Netlify otomatik olarak `netlify.toml` dosyasındaki ayarları kullanacaktır:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20

## 3. Environment Variables (Ortam Değişkenleri) Ayarlama

Netlify dashboard'da **Site settings** > **Environment variables** bölümüne gidin ve aşağıdaki değişkenleri ekleyin:

### Zorunlu Değişkenler:

```
TURSO_DATABASE_URL=your-turso-database-url
TURSO_AUTH_TOKEN=your-turso-auth-token
JWT_SECRET=your-secret-key-here
```

### Opsiyonel Değişkenler:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**Önemli**: `JWT_SECRET` için güçlü bir rastgele string kullanın. Örnek:
```bash
openssl rand -base64 32
```

## 4. Turso Veritabanı Kurulumu

1. [Turso](https://turso.tech) hesabı oluşturun
2. Yeni bir veritabanı oluşturun
3. Database URL ve Auth Token'ı Netlify environment variables'a ekleyin

## 5. Deploy

1. Netlify otomatik olarak ilk deploy'u başlatacaktır
2. Deploy tamamlandıktan sonra siteniz canlıya alınacaktır
3. İlk deploy'dan sonra `/api/init` endpoint'ini çağırarak veritabanını başlatın:
   - `https://your-site.netlify.app/api/init`

## 6. İlk Kullanım

Deploy tamamlandıktan sonra:

1. Sitenize gidin
2. Admin girişi yapın:
   - **Kullanıcı adı**: `admin` (veya `ADMIN_USERNAME` değişkeninde belirttiğiniz)
   - **Şifre**: `admin123` (veya `ADMIN_PASSWORD` değişkeninde belirttiğiniz)
3. İlk girişten sonra şifrenizi değiştirmeniz önerilir

## Sorun Giderme

### Build Hatası
- Node.js versiyonunun 20 olduğundan emin olun
- `npm install` komutunun başarıyla çalıştığından emin olun

### Veritabanı Bağlantı Hatası
- `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` değişkenlerinin doğru olduğundan emin olun
- Turso veritabanınızın aktif olduğundan emin olun

### API Route Hataları
- Netlify Functions'ın düzgün çalıştığından emin olun
- Build loglarını kontrol edin

## Notlar

- Netlify ücretsiz planında bazı limitler vardır (build dakikaları, bandwidth vb.)
- Production için environment variables'ları production ortamına eklemeyi unutmayın
- Branch deploy'ları için ayrı environment variables tanımlayabilirsiniz

