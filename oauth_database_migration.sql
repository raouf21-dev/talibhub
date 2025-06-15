-- Migration OAuth pour TalibHub - Compatible DBeaver
-- Exécutez ces commandes une par une dans DBeaver

-- 1. Ajouter les colonnes OAuth à la table users
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255);
ALTER TABLE users ADD COLUMN oauth_email VARCHAR(320);
ALTER TABLE users ADD COLUMN oauth_profile_data JSONB;
ALTER TABLE users ADD COLUMN is_oauth_user BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- 2. Modifier la colonne password pour la rendre nullable (pour les utilisateurs OAuth)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- 3. Ajouter des contraintes pour assurer l'intégrité des données
-- Contrainte unique sur oauth_provider + oauth_id
ALTER TABLE users ADD CONSTRAINT unique_oauth_provider_id 
    UNIQUE (oauth_provider, oauth_id);

-- 4. Ajouter des index pour améliorer les performances
CREATE INDEX idx_users_oauth_provider ON users(oauth_provider);
CREATE INDEX idx_users_oauth_id ON users(oauth_id);
CREATE INDEX idx_users_oauth_email ON users(oauth_email);
CREATE INDEX idx_users_is_oauth_user ON users(is_oauth_user);

-- 5. Mettre à jour les utilisateurs existants (non-OAuth)
UPDATE users 
SET is_oauth_user = FALSE, 
    email_verified = TRUE 
WHERE is_oauth_user IS NULL 
   OR email_verified IS NULL;

-- 6. Vérifier que les modifications ont été appliquées
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('oauth_provider', 'oauth_id', 'oauth_email', 'oauth_profile_data', 'is_oauth_user', 'email_verified');

-- 7. Afficher la structure finale de la table
\d users; 