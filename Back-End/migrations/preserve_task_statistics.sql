-- Migration: Préservation des statistiques après suppression de tâches
-- Fichier: preserve_task_statistics.sql
-- Date: 2025-01-10

-- ATTENTION: Exécuter ces commandes une par une et vérifier les résultats

-- 1. Ajouter la colonne task_name_snapshot si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'task_name_snapshot'
    ) THEN
        ALTER TABLE sessions ADD COLUMN task_name_snapshot VARCHAR(255);
        RAISE NOTICE 'Colonne task_name_snapshot ajoutée à la table sessions';
    ELSE
        RAISE NOTICE 'Colonne task_name_snapshot existe déjà';
    END IF;
END $$;

-- 2. Remplir les snapshots pour les sessions existantes
UPDATE sessions 
SET task_name_snapshot = t.name 
FROM tasks t 
WHERE sessions.task_id = t.id AND sessions.task_name_snapshot IS NULL;

-- Vérifier combien de sessions ont été mises à jour
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM sessions 
    WHERE task_name_snapshot IS NOT NULL;
    
    RAISE NOTICE 'Sessions avec snapshot: %', updated_count;
END $$;

-- 3. Supprimer l'ancienne contrainte de clé étrangère
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_task_id_fkey;

-- 4. Modifier task_id pour permettre NULL
ALTER TABLE sessions ALTER COLUMN task_id DROP NOT NULL;

-- 5. Ajouter la nouvelle contrainte qui préserve les sessions
ALTER TABLE sessions ADD CONSTRAINT sessions_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- 6. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_created_at ON sessions(user_id, created_at);

-- 7. Créer la fonction trigger pour sauvegarder automatiquement le nom de la tâche
CREATE OR REPLACE FUNCTION save_task_name_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- Si task_id n'est pas NULL, récupérer le nom de la tâche
    IF NEW.task_id IS NOT NULL THEN
        SELECT name INTO NEW.task_name_snapshot 
        FROM tasks 
        WHERE id = NEW.task_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger pour les nouvelles sessions
DROP TRIGGER IF EXISTS trigger_save_task_name_snapshot ON sessions;
CREATE TRIGGER trigger_save_task_name_snapshot
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION save_task_name_snapshot();

-- 9. Créer la fonction pour mettre à jour les snapshots quand une tâche est renommée
CREATE OR REPLACE FUNCTION update_task_name_snapshots()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour tous les snapshots des sessions liées à cette tâche
    UPDATE sessions 
    SET task_name_snapshot = NEW.name
    WHERE task_id = NEW.id;
    
    RAISE NOTICE 'Snapshots mis à jour pour la tâche: % -> %', OLD.name, NEW.name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Créer le trigger pour les modifications de noms de tâches
DROP TRIGGER IF EXISTS trigger_update_task_name_snapshots ON tasks;
CREATE TRIGGER trigger_update_task_name_snapshots
    AFTER UPDATE OF name ON tasks
    FOR EACH ROW
    WHEN (OLD.name IS DISTINCT FROM NEW.name)
    EXECUTE FUNCTION update_task_name_snapshots();

-- 11. Vérifications finales
DO $$
DECLARE
    orphan_sessions INTEGER;
    sessions_with_snapshots INTEGER;
BEGIN
    -- Compter les sessions orphelines (task_id = NULL)
    SELECT COUNT(*) INTO orphan_sessions 
    FROM sessions 
    WHERE task_id IS NULL;
    
    -- Compter les sessions avec snapshots
    SELECT COUNT(*) INTO sessions_with_snapshots 
    FROM sessions 
    WHERE task_name_snapshot IS NOT NULL;
    
    RAISE NOTICE '=== RAPPORT DE MIGRATION ===';
    RAISE NOTICE 'Sessions orphelines (tâche supprimée): %', orphan_sessions;
    RAISE NOTICE 'Sessions avec snapshot de nom: %', sessions_with_snapshots;
    RAISE NOTICE 'Migration terminée avec succès!';
END $$;

-- TEST: Afficher quelques exemples de sessions pour vérification
SELECT 
    id,
    task_id,
    task_name_snapshot,
    total_work_time,
    created_at::date
FROM sessions 
ORDER BY created_at DESC 
LIMIT 5; 