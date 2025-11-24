# Tam Kurulum Rehberi - Sıfırdan Başlayanlar İçin

## Adım 1: Turso Veritabanı Oluşturma

### 1.1. Turso Hesabı Oluşturma

1. [https://turso.tech](https://turso.tech) adresine gidin
2. Sağ üstte **"Sign up"** veya **"Get started"** butonuna tıklayın
3. GitHub hesabınızla giriş yapabilirsiniz (önerilir) veya e-posta ile kayıt olun
4. Hesabınızı doğrulayın

### 1.2. Yeni Veritabanı Oluşturma

1. Turso dashboard'a giriş yaptıktan sonra
2. **"Create database"** veya **"New database"** butonuna tıklayın
3. Veritabanı adını girin (örn: `iade-kargo-db`)
4. Region seçin (Avrupa için `eu-central-1` veya size yakın bir bölge)
5. **"Create"** butonuna tıklayın

### 1.3. Database URL ve Token Alma

1. Oluşturduğunuz veritabanına tıklayın
2. **"Connect"** veya **"Connection"** sekmesine gidin
3. **"Connection string"** bölümünden **Database URL**'i kopyalayın
   - Örnek: `libsql://iade-kargo-db-xxxxx.turso.io`
4. **"Auth tokens"** veya **"Tokens"** sekmesine gidin
5. **"Create token"** butonuna tıklayın
6. Token adı verin (örn: `netlify-token`)
7. Token'ı kopyalayın (sadece bir kez gösterilir, kaydedin!)

**ÖNEMLİ**: Bu bilgileri güvenli bir yere kaydedin:
- Database URL: `libsql://iade-kargo-db-xxxxx.turso.io`
- Auth Token: `eyJ...` (uzun bir string)

## Adım 2: Netlify'da Proje Oluşturma

### 2.1. GitHub Repository'yi Netlify'a Bağlama

1. Netlify dashboard'da sol menüden **"Projects"** sekmesine tıklayın
2. Sağ üstte **"Add new site"** butonuna tıklayın
3. **"Import an existing project"** seçeneğini seçin
4. **"Deploy with GitHub"** butonuna tıklayın
5. GitHub hesabınızı bağlayın (eğer bağlı değilse)
6. Repository listesinden **"iadeDegisimKargoPanel"** repository'sini seçin

### 2.2. Build Ayarları

Netlify otomatik olarak şu ayarları algılayacak:
- **Build command**: `npm run build` ✅
- **Publish directory**: `.next` ✅
- **Node version**: 20 ✅

Eğer görmüyorsanız, **"Show advanced"** butonuna tıklayın ve kontrol edin.

### 2.3. Environment Variables Ekleme

**Deploy butonuna tıklamadan önce** environment variables ekleyin:

1. **"Show advanced"** veya **"Advanced"** butonuna tıklayın
2. **"Environment variables"** bölümüne gidin
3. **"New variable"** butonuna tıklayın
4. Aşağıdaki değişkenleri tek tek ekleyin:

#### Zorunlu Değişkenler:

| Key | Value | Açıklama |
|-----|-------|----------|
| `TURSO_DATABASE_URL` | Turso'dan kopyaladığınız URL | `libsql://iade-kargo-db-xxxxx.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso'dan kopyaladığınız token | `eyJ...` (uzun string) |
| `JWT_SECRET` | Rastgele güçlü string | Aşağıdaki yöntemle oluşturun |

#### JWT_SECRET Oluşturma

**Windows PowerShell'de:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Veya online araç kullanın:**
- [https://www.random.org/strings/](https://www.random.org/strings/)
- 32 karakter, alfanumerik seçin

#### Opsiyonel Değişkenler (İsterseniz ekleyin):

| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `admin123` (production'da değiştirin!) |

### 2.4. Deploy Başlatma

1. Tüm environment variables'ları ekledikten sonra
2. **"Deploy site"** butonuna tıklayın
3. Build işlemi başlayacak (2-5 dakika sürebilir)
4. Build loglarını izleyebilirsiniz

## Adım 3: İlk Deploy Sonrası

### 3.1. Veritabanını Başlatma

Deploy tamamlandıktan sonra:

1. Netlify size bir URL verecek (örn: `https://random-name-123.netlify.app`)
2. Bu URL'yi kopyalayın
3. Tarayıcınızda şu adrese gidin:
   ```
   https://your-site-name.netlify.app/api/init
   ```
4. Bu sayfayı açın - veritabanı tabloları otomatik oluşturulacak
5. Şu mesajı göreceksiniz:
   ```json
   {"success":true,"message":"Veritabanı başarıyla başlatıldı"}
   ```

### 3.2. İlk Giriş

1. Ana sayfaya gidin: `https://your-site-name.netlify.app`
2. **Admin girişi** yapın:
   - **Kullanıcı adı**: `admin`
   - **Şifre**: `admin123`
3. Giriş yaptıktan sonra şifrenizi değiştirmeniz önerilir

## Sorun Giderme

### Turso Veritabanı Sorunları

- **Database URL bulamıyorum**: Turso dashboard'da veritabanınıza tıklayın → "Connect" sekmesi
- **Token oluşturamıyorum**: Turso dashboard'da "Tokens" sekmesine gidin → "Create token"
- **Bağlantı hatası**: URL ve token'ın doğru kopyalandığından emin olun (boşluk olmamalı)

### Netlify Deploy Sorunları

- **Build başarısız**: Deploy logs sekmesine gidin ve hata mesajını kontrol edin
- **Environment variables görünmüyor**: "Show advanced" butonuna tıklayın
- **Site çalışmıyor**: `/api/init` endpoint'ini çağırdığınızdan emin olun

### Veritabanı Başlatma Sorunları

- **404 hatası**: Deploy'un tamamlandığından emin olun (birkaç dakika bekleyin)
- **500 hatası**: Environment variables'ların doğru olduğunu kontrol edin
- **Bağlantı hatası**: Turso veritabanınızın aktif olduğunu kontrol edin

## Özet Checklist

- [ ] Turso hesabı oluşturuldu
- [ ] Turso veritabanı oluşturuldu
- [ ] Database URL kopyalandı
- [ ] Auth Token oluşturuldu ve kopyalandı
- [ ] JWT_SECRET oluşturuldu
- [ ] Netlify'da proje oluşturuldu
- [ ] Environment variables eklendi (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET)
- [ ] Deploy tamamlandı
- [ ] `/api/init` endpoint'i çağrıldı
- [ ] İlk giriş yapıldı

## Önemli Notlar

⚠️ **Güvenlik**:
- `JWT_SECRET` için güçlü bir anahtar kullanın
- Production'da `ADMIN_PASSWORD`'ü mutlaka değiştirin
- Environment variables'ları asla commit etmeyin

💰 **Maliyet**:
- Turso: Ücretsiz plan (1 veritabanı, 500MB storage)
- Netlify: Ücretsiz plan (100GB bandwidth, 300 build dakikası)

🔄 **Güncellemeler**:
- Her GitHub push'unda otomatik deploy yapılır
- Environment variables'ları Netlify dashboard'dan güncelleyebilirsiniz

