require('dotenv').config();
const { Connection } = require('node-z3950');

async function testZ3950() {
  console.log('🔍 Z39.50 Servisini Test Ediyorum...\n');

  const config = {
    host: process.env.Z3950_HOST || 'z3950.loc.gov',
    port: parseInt(process.env.Z3950_PORT) || 7090,
    database: process.env.Z3950_DATABASE || 'VOYAGER',
    user: process.env.Z3950_USER || 'anonymous',
    password: process.env.Z3950_PASSWORD || 'anonymous',
    elementSetName: 'F',
    preferredRecordSyntax: 'USMARC'
  };

  console.log('Bağlantı Ayarları:', config);

  try {
    console.log('\nKütüphane sunucusuna bağlanılıyor...');
    const connection = new Connection(config);

    connection.on('error', (err) => {
      console.error('❌ Bağlantı hatası:', err);
    });

    connection.on('connect', () => {
      console.log('✅ Bağlantı başarılı!');
      console.log('\nArama yapılıyor: "computer science"...');

      connection.search('computer science', 1, 5, (err, result) => {
        if (err) {
          console.error('❌ Arama hatası:', err);
          connection.close();
          return;
        }

        console.log(`\nBulunan toplam kayıt: ${result.size}`);
        console.log('İlk 5 kayıt getiriliyor...\n');

        result.records.forEach((record, index) => {
          record.parse((err, data) => {
            if (err) {
              console.error(`❌ Kayıt ${index + 1} ayrıştırma hatası:`, err);
              return;
            }

            const title = data.fields.find(f => f.tag === '245')?.subfields?.map(sf => sf.value).join(' ') || 'Başlık bulunamadı';
            const author = data.fields.find(f => f.tag === '100')?.subfields?.map(sf => sf.value).join(' ') || 'Yazar bulunamadı';
            const year = data.fields.find(f => f.tag === '260')?.subfields?.find(sf => sf.value.match(/\d{4}/))?.value.match(/\d{4}/)[0] || 'Yıl bulunamadı';

            console.log(`Kayıt ${index + 1}:`);
            console.log('Başlık:', title);
            console.log('Yazar:', author);
            console.log('Yayın Yılı:', year);
            console.log('----------------------------------------\n');

            if (index === result.records.length - 1) {
              console.log('Test tamamlandı!');
              connection.close();
              process.exit(0);
            }
          });
        });
      });
    });

    connection.connect();

  } catch (error) {
    console.error('❌ Genel hata:', error);
    process.exit(1);
  }
}

testZ3950();
