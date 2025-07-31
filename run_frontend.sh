# cd akademiradar-ui
# npm start
#!/bin/bash

echo "🚀 Frontend Yayın Güncellemesi Başladı..."

cd /root/Workspace/yayinpinari/akademiradar-ui || exit 1

echo "📦 Bağımlılıklar yükleniyor..."
npm install

echo "🏗️ Derleme (build) işlemi başlıyor..."
npm run build

# echo "📂 Üretim dosyaları web dizinine kopyalanıyor..."
# sudo cp -r build/* /var/www/html/

echo "✅ Frontend başarıyla güncellendi ve yayına alındı."
