-- Messages tablosuna öğretmenler için DELETE policy ekle (eğer messages tablosu varsa)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can delete child messages') THEN
      CREATE POLICY "Teachers can delete child messages" ON messages
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM children c 
          WHERE c.id = messages.child_id 
          AND c.user_id = auth.uid()
        )
      );
    END IF;
  END IF;
END $$;
