import React from 'react';
import { t } from '../constants.clean';

interface Props {
  navigate: (page: string, params?: any) => void;
}

const GettingStarted: React.FC<Props> = ({ navigate }) => {
  const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="mt-3 text-gray-700 text-sm leading-relaxed">{children}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('gettingStarted')}</h1>
        <p className="text-gray-600 mt-1">PortfoAI ile hızlı bir başlangıç yapmanız için kısa bir kullanım kılavuzu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="1) Sınıf Oluştur ve Çocuk Ekle">
          <p>
            Sol menüde <strong>Sınıflar</strong> bölümünden yeni sınıf oluşturun. Ardından <strong>Çocuklar</strong>
            sayfasından her sınıfa çocuk kartları ekleyin. Çocuk bilgilerini daha sonra dilediğiniz gibi
            güncelleyebilirsiniz.
          </p>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1.5 rounded bg-primary text-white" onClick={() => navigate('classes')}>Sınıflar</button>
            <button className="px-3 py-1.5 rounded bg-gray-200" onClick={() => navigate('children')}>Çocuklar</button>
          </div>
        </Card>

        <Card title="2) Gözlem Ekle ve Alanları Seç">
          <p>
            Bir çocuğun kartına girip <strong>Gözlem Ekle</strong> deyin. Davranışı kısa bir notla yazın,
            gözlemin geçtiği <em>ortamı</em> ve ilgili <em>gelişim alanlarını</em> seçin. Kaydettikten sonra yapay zekâ
            arka planda özeti ve önerileri hazırlar.
          </p>
        </Card>

        <Card title="3) Ürün/Medya Yükle (Portfolyo)">
          <p>
            Çocuğun sayfasındaki <strong>Medya</strong> sekmesinden ürün fotoğraflarını yükleyin. Her ürüne ad ve kısa bir
            açıklama verin; isterseniz ilgili gelişim alanını seçin. Dosyalar güvenli olarak saklanır ve sınıf/rapor
            görünümlerinde kullanılır.
          </p>
        </Card>

        <Card title="4) Rapor ve PDF Alma">
          <p>
            Çocuk veya sınıf sayfalarındaki <strong>Rapor</strong> bölümünden gelişim özetlerini görüntüleyebilir,
            PDF olarak indirebilirsiniz. Yapay zekâ tarafından oluşturulan özetler karar desteği amaçlıdır; öğretmen
            değerlendirmesi esastır.
          </p>
        </Card>

        <Card title="İpucu: Demo Veri ile Hızlı Keşif">
          <p>
            Uygulamayı danışmanınıza göstermek için örnek bir içerik seti oluşturabilirsiniz. <strong>Ayarlar → Demo Verisi
              Oluştur</strong> butonuna tıklayın; iki sınıf, çocuklar, gözlemler ve örnek ürünler otomatik eklenir. Dilediğinizde
            aynı bölümden <strong>Geri Al</strong> ile temizleyebilirsiniz.
          </p>
          <div className="mt-3">
            <button className="px-3 py-1.5 rounded bg-gray-200" onClick={() => navigate('settings')}>Ayarlar'a Git</button>
          </div>
        </Card>

        <Card title="Sık Kullanılan İşlemler">
          <ul className="list-disc pl-5 space-y-1">
            <li>Çocuk ara: üst kısımdaki arama kutusunu kullanın.</li>
            <li>Veri aktarımı: Ayarlar → Verileri Dışa Aktar.</li>
            <li>Tema: Sol panel altından açık/koyu temayı değiştirin.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default GettingStarted;

