import { supabase } from '../supabase';
import { getClasses } from './classes';
import { getChildren, deleteChild, deleteClass } from './children';
import { listChatThreads, deleteChatThread } from './chat';
import { dispatchDataChangedEvent } from './common';

/**
 * Kullanıcı hesabını ve tüm verilerini siler.
 * Not: Supabase Auth kullanıcısı client-side'dan silinemez (service_role gerekir),
 * bu yüzden sadece veriler temizlenir ve çıkış yapılır.
 */
export const deleteUserAccount = async (userId: string, onProgress?: (msg: string) => void) => {
    const log = (m: string) => {
        console.log('[AccountDelete]', m);
        onProgress?.(m);
    };

    try {
        // 1. Sohbetleri Sil
        log('Sohbet geçmişi siliniyor...');
        const threads = await listChatThreads(userId);
        for (const thr of threads) {
            await deleteChatThread(thr.id);
        }

        // 2. Sınıfları (ve içindeki çocukları) Sil
        log('Sınıflar ve öğrenci kayıtları siliniyor...');
        const classes = await getClasses(userId);
        const classNames = classes.map(c => c.name);

        for (const clsName of classNames) {
            await deleteClass(userId, clsName, onProgress);
        }

        // 3. Sınıfsız (Orphan) Çocukları Sil
        // deleteClass sadece o sınıftakileri siler. Kalanları bulup silelim.
        log('Diğer kayıtlar temizleniyor...');
        const remainingChildren = await getChildren(userId);
        for (const child of remainingChildren) {
            log(`Siliniyor: ${child.first_name} ${child.last_name}`);
            await deleteChild(child.id);
        }

        // 4. Medya temizliği (Genellikle deleteChild ile hallolur ama yetim dosyalar kalabilir)
        // Şu an için deleteChild yeterli.

        log('Kullanıcı hesabı kalıcı olarak siliniyor...');

        // Edge Function çağırarak kullanıcıyı auth.users'dan tamamen sil
        // Bu işlem aynı e-posta ile tekrar kayıt olunabilmesini sağlar.
        const { error: funcError } = await supabase.functions.invoke('delete-account', {
            method: 'POST',
        });

        if (funcError) {
            console.warn('Edge Function ile silme başarısız (scramble fallback uygulanıyor):', funcError);
            // Fallback: Fonksiyon çalışmazsa (deploy edilmemişse) şifreyi değiştirip çıkış yap
            const { v4: uuidv4 } = await import('uuid');
            await supabase.auth.updateUser({ password: uuidv4() });
        }

        log('Hesap verileri temizlendi. Çıkış yapılıyor...');

        // 5. Çıkış Yap
        await supabase.auth.signOut();

        // Local storage temizle
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch { }

        dispatchDataChangedEvent();

    } catch (error) {
        console.error('Hesap silme hatası:', error);
        throw error;
    }
};
