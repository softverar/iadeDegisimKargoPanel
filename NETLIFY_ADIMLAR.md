# Netlify'a Deploy Adımları

## 1. Netlify Hesabı Oluşturma/Giriş

1. [https://www.netlify.com](https://www.netlify.com) adresine gidin
2. "Sign up" veya "Log in" yapın (GitHub hesabınızla giriş yapabilirsiniz)

## 2. Yeni Site Oluşturma

1. Netlify dashboard'da **"Add new site"** butonuna tıklayın
2. **"Import an existing project"** seçeneğini seçin
3. **"Deploy with GitHub"** butonuna tıklayın
4. GitHub hesabınızı bağlayın (eğer bağlı değilse)
5. Repository listesinden **"iadeDegisimKargoPanel"** repository'sini seçin

## 3. Build Ayarları

Netlify otomatik olarak şu ayarları algılayacak:
- **Build command**: `npm run build` (otomatik algılanır)
- **Publish directory**: `.next` (netlify.toml'dan alınır)
- **Node version**: 20 (netlify.toml'dan alınır)

**Önemli**: Build ayarlarını kontrol edin ve şunların olduğundan emin olun:
- Build command: `npm run build`
- Publish directory: `.next`

## 4. Environment Variables (Ortam Değişkenleri) Ekleme

**Deploy butonuna tıklamadan önce** environment variables ekleyin:

1. **"Show advanced"** veya **"Advanced"** butonuna tıklayın
2. **"New variable"** butonuna tıklayın
3. Aşağıdaki değişkenleri tek tek ekleyin:

### Zorunlu Değişkenler:

| Key | Value |
|-----|-------|
| `TURSO_DATABASE_URL` | Turso veritabanı URL'iniz |
| `TURSO_AUTH_TOKEN` | Turso auth token'ınız |
| `JWT_SECRET` | Güçlü bir rastgele string (örn: `openssl rand -base64 32` komutuyla oluşturun) |

### Opsiyonel Değişkenler:

| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | `admin` (varsayılan) |
| `ADMIN_PASSWORD` | `admin123` (varsayılan - production'da değiştirin!) |

**Not**: JWT_SECRET için güçlü bir anahtar oluşturmak için terminal'de şu komutu çalıştırabilirsiniz:
```bash
openssl rand -base64 32
```

## 5. Deploy Başlatma

1. Tüm environment variables'ları ekledikten sonra
2. **"Deploy site"** butonuna tıklayın
3. Netlify build işlemini başlatacak (2-5 dakika sürebilir)

## 6. İlk Deploy Sonrası

### Veritabanını Başlatma

Deploy tamamlandıktan sonra:

1. Netlify size bir URL verecek (örn: `https://random-name-123.netlify.app`)
2. Bu URL'ye gidin ve sonuna `/api/init` ekleyin:
   ```
   https://your-site-name.netlify.app/api/init
   ```
3. Bu sayfayı açın - veritabanı tabloları otomatik oluşturulacak
4. Başarılı mesaj göreceksiniz: `{"success":true,"message":"Veritabanı başarıyla başlatıldı"}`

### İlk Giriş

1. Ana sayfaya gidin: `https://your-site-name.netlify.app`
2. Admin girişi yapın:
   - **Kullanıcı adı**: `admin` (veya `ADMIN_USERNAME` değişkeninde belirttiğiniz)
   - **Şifre**: `admin123` (veya `ADMIN_PASSWORD` değişkeninde belirttiğiniz)

## 7. Site Ayarları (Opsiyonel)

### Özel Domain Ekleme

1. Netlify dashboard'da sitenize gidin
2. **"Domain settings"** sekmesine tıklayın
3. **"Add custom domain"** butonuna tıklayın
4. Domain adresinizi girin

### Environment Variables Güncelleme

1. **Site settings** → **Environment variables**
2. Değişkenleri ekleyebilir, düzenleyebilir veya silebilirsiniz
3. Production, Deploy preview ve Branch deploy için ayrı değişkenler tanımlayabilirsiniz

## Sorun Giderme

### Build Başarısız Olursa

1. **Deploy logs** sekmesine gidin
2. Hata mesajını kontrol edin
3. Genellikle şu sorunlar olabilir:
   - Environment variables eksik
   - Node.js versiyonu uyumsuz
   - Bağımlılık hataları

### Veritabanı Bağlantı Hatası

1. Environment variables'ların doğru olduğundan emin olun
2. Turso veritabanınızın aktif olduğunu kontrol edin
3. Turso dashboard'dan URL ve token'ı tekrar kontrol edin

### API Route'lar Çalışmıyorsa

1. Netlify Functions loglarını kontrol edin
2. `/api/init` endpoint'ini çağırdığınızdan emin olun
3. Build loglarında hata olup olmadığını kontrol edin

## Önemli Notlar

⚠️ **Güvenlik**:
- Production'da `ADMIN_PASSWORD`'ü mutlaka değiştirin
- `JWT_SECRET` için güçlü bir anahtar kullanın
- Environment variables'ları asla commit etmeyin

📊 **Limitler**:
- Netlify ücretsiz planında aylık 100GB bandwidth
- 300 build dakikası
- 125K serverless function çağrısı

🔄 **Otomatik Deploy**:
- Her push'ta otomatik deploy yapılır
- Branch'ler için preview deploy'lar oluşturulur

