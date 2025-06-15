-- Migration script pour le système de mémorisation des sourates
-- Exécuter ce script pour migrer d'un système existant vers le nouveau

-- 1. Vérifier si la table existe et créer si nécessaire
DO $$
BEGIN
    -- Créer la table si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'surah_memorization') THEN
        CREATE TABLE surah_memorization (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            surah_number INT REFERENCES sourates(number) ON DELETE CASCADE,
            memorization_level VARCHAR(20), -- Strong, Good, Moderate, Weak
            last_revision_date DATE DEFAULT CURRENT_DATE,
            next_revision_date DATE,
            is_available_for_revision BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, surah_number)
        );
        
        -- Créer les index
        CREATE INDEX idx_surah_memorization_user_id ON surah_memorization(user_id);
        CREATE INDEX idx_surah_memorization_next_revision ON surah_memorization(next_revision_date) WHERE is_available_for_revision = TRUE;
        
        RAISE NOTICE 'Table surah_memorization créée avec succès';
    ELSE
        RAISE NOTICE 'Table surah_memorization existe déjà';
    END IF;
END
$$;

-- 2. Migrer la colonne is_known vers is_available_for_revision si nécessaire
DO $$
BEGIN
    -- Vérifier si l'ancienne colonne is_known existe
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'surah_memorization' AND column_name = 'is_known') THEN
        
        -- Ajouter la nouvelle colonne si elle n'existe pas
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'surah_memorization' AND column_name = 'is_available_for_revision') THEN
            ALTER TABLE surah_memorization ADD COLUMN is_available_for_revision BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Copier les données de is_known vers is_available_for_revision
        UPDATE surah_memorization SET is_available_for_revision = is_known;
        
        -- Supprimer l'ancienne colonne
        ALTER TABLE surah_memorization DROP COLUMN is_known;
        
        RAISE NOTICE 'Migration de is_known vers is_available_for_revision terminée';
    ELSE
        -- Vérifier si la nouvelle colonne existe, sinon la créer
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'surah_memorization' AND column_name = 'is_available_for_revision') THEN
            ALTER TABLE surah_memorization ADD COLUMN is_available_for_revision BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Colonne is_available_for_revision ajoutée';
        ELSE
            RAISE NOTICE 'Colonne is_available_for_revision existe déjà';
        END IF;
    END IF;
END
$$;

-- 3. Ajouter les colonnes manquantes si nécessaire
DO $$
BEGIN
    -- Ajouter created_at si manquante
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'surah_memorization' AND column_name = 'created_at') THEN
        ALTER TABLE surah_memorization ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Colonne created_at ajoutée';
    END IF;
    
    -- Ajouter updated_at si manquante
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'surah_memorization' AND column_name = 'updated_at') THEN
        ALTER TABLE surah_memorization ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Colonne updated_at ajoutée';
    END IF;
END
$$;

-- 4. Créer les index s'ils n'existent pas
DO $$
BEGIN
    -- Index sur user_id
    IF NOT EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                   WHERE c.relname = 'idx_surah_memorization_user_id' AND n.nspname = 'public') THEN
        CREATE INDEX idx_surah_memorization_user_id ON surah_memorization(user_id);
        RAISE NOTICE 'Index idx_surah_memorization_user_id créé';
    END IF;
    
    -- Index sur next_revision_date avec condition
    IF NOT EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                   WHERE c.relname = 'idx_surah_memorization_next_revision' AND n.nspname = 'public') THEN
        CREATE INDEX idx_surah_memorization_next_revision ON surah_memorization(next_revision_date) 
        WHERE is_available_for_revision = TRUE;
        RAISE NOTICE 'Index idx_surah_memorization_next_revision créé';
    END IF;
END
$$;

-- 5. Afficher le résumé de la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'surah_memorization' 
ORDER BY ordinal_position;

RAISE NOTICE 'Migration terminée avec succès !'; 