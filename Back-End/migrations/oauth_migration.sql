-- Migration OAuth - Ajouter les colonnes nécessaires pour l'authentification OAuth
-- À exécuter dans DBeaver

-- 1. Ajouter les colonnes OAuth à la table users
ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(50),
ADD COLUMN oauth_id VARCHAR(255),
ADD COLUMN oauth_email VARCHAR(255),
ADD COLUMN oauth_profile_data JSONB,
ADD COLUMN is_oauth_user BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- 2. Modifier la colonne password pour la rendre optionnelle (pour les utilisateurs OAuth)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- 3. Ajouter des contraintes pour assurer l'intégrité des données
-- Contrainte : si c'est un utilisateur OAuth, oauth_provider et oauth_id doivent être présents
ALTER TABLE users ADD CONSTRAINT check_oauth_data 
CHECK (
    (is_oauth_user = FALSE) OR 
    (is_oauth_user = TRUE AND oauth_provider IS NOT NULL AND oauth_id IS NOT NULL)
);

-- 4. Contrainte : oauth_id doit être unique par provider
CREATE UNIQUE INDEX idx_oauth_provider_id ON users(oauth_provider, oauth_id) 
WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

-- 5. Index pour améliorer les performances des requêtes OAuth
CREATE INDEX idx_users_oauth_provider ON users(oauth_provider) WHERE oauth_provider IS NOT NULL;
CREATE INDEX idx_users_is_oauth ON users(is_oauth_user);

-- 6. Mettre à jour les utilisateurs existants
UPDATE users SET 
    is_oauth_user = FALSE,
    email_verified = TRUE 
WHERE is_oauth_user IS NULL;

-- 7. Vérification de la migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 