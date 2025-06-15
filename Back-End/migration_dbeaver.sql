-- Migration pour DBeaver - Système de mémorisation des sourates
-- Exécuter ligne par ligne ou par bloc selon les besoins

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS surah_memorization (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    surah_number INT REFERENCES sourates(number) ON DELETE CASCADE,
    memorization_level VARCHAR(20), -- Strong, Good, Moderate, Weak
    last_revision_date DATE DEFAULT CURRENT_DATE,
    next_revision_date DATE,
    is_available_for_revision BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ajouter la contrainte unique si elle n'existe pas
-- Si vous obtenez une erreur "relation already exists", ignorez-la
ALTER TABLE surah_memorization 
ADD CONSTRAINT unique_user_surah UNIQUE (user_id, surah_number);

-- 3. Ajouter la colonne is_available_for_revision si elle n'existe pas
ALTER TABLE surah_memorization 
ADD COLUMN IF NOT EXISTS is_available_for_revision BOOLEAN DEFAULT FALSE;

-- 4. Si vous avez une ancienne colonne is_known, migrer les données
-- Décommentez les lignes suivantes si nécessaire :
-- UPDATE surah_memorization SET is_available_for_revision = is_known WHERE is_known IS NOT NULL;
-- ALTER TABLE surah_memorization DROP COLUMN IF EXISTS is_known;

-- 5. Ajouter les colonnes de timestamp si elles n'existent pas
ALTER TABLE surah_memorization 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE surah_memorization 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 6. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_surah_memorization_user_id 
ON surah_memorization(user_id);

CREATE INDEX IF NOT EXISTS idx_surah_memorization_next_revision 
ON surah_memorization(next_revision_date) 
WHERE is_available_for_revision = TRUE;

-- 7. Vérifier la structure finale
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'surah_memorization' 
ORDER BY ordinal_position; 