-- Script de vérification pour DBeaver
-- Système de mémorisation des sourates

-- 1. Vérifier l'existence des tables principales
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ Table users existe'
        ELSE '❌ Table users manquante'
    END as users_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sourates') 
        THEN '✅ Table sourates existe'
        ELSE '❌ Table sourates manquante'
    END as sourates_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'surah_memorization') 
        THEN '✅ Table surah_memorization existe'
        ELSE '❌ Table surah_memorization manquante'
    END as surah_memorization_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'known_sourates') 
        THEN '✅ Table known_sourates existe'
        ELSE '❌ Table known_sourates manquante'
    END as known_sourates_status;

-- 2. Structure de la table surah_memorization
SELECT 
    column_name as "Colonne",
    data_type as "Type",
    is_nullable as "Nullable",
    column_default as "Défaut"
FROM information_schema.columns 
WHERE table_name = 'surah_memorization' 
ORDER BY ordinal_position;

-- 3. Vérification des colonnes essentielles
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'is_available_for_revision') 
        THEN '✅ Colonne is_available_for_revision existe'
        ELSE '❌ Colonne is_available_for_revision manquante'
    END as available_for_revision_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'memorization_level') 
        THEN '✅ Colonne memorization_level existe'
        ELSE '❌ Colonne memorization_level manquante'
    END as memorization_level_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'next_revision_date') 
        THEN '✅ Colonne next_revision_date existe'
        ELSE '❌ Colonne next_revision_date manquante'
    END as next_revision_date_status;

-- 4. Vérification de l'ancienne colonne is_known
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'is_known') 
        THEN '⚠️ ATTENTION: Ancienne colonne is_known existe encore - Migration nécessaire'
        ELSE '✅ Ancienne colonne is_known supprimée (normal)'
    END as is_known_status;

-- 5. Vérification des contraintes
SELECT 
    constraint_name as "Contrainte",
    constraint_type as "Type"
FROM information_schema.table_constraints 
WHERE table_name = 'surah_memorization';

-- 6. Vérification des index
SELECT 
    indexname as "Index",
    indexdef as "Définition"
FROM pg_indexes 
WHERE tablename = 'surah_memorization';

-- 7. Vérification des données de base (sourates)
SELECT 
    COUNT(*) as "Nombre total de sourates",
    MIN(number) as "Première sourate",
    MAX(number) as "Dernière sourate"
FROM sourates;

-- 8. Statistiques du système de mémorisation
SELECT 
    COUNT(*) as "Nombre d'entrées de mémorisation",
    COUNT(CASE WHEN is_available_for_revision = true THEN 1 END) as "Sourates disponibles pour révision",
    COUNT(CASE WHEN memorization_level IS NOT NULL THEN 1 END) as "Sourates avec niveau évalué"
FROM surah_memorization;

-- 9. Répartition par niveau de mémorisation
SELECT 
    COALESCE(memorization_level, 'Non évalué') as "Niveau",
    COUNT(*) as "Nombre"
FROM surah_memorization 
GROUP BY memorization_level
ORDER BY 
    CASE memorization_level
        WHEN 'Strong' THEN 1
        WHEN 'Good' THEN 2
        WHEN 'Moderate' THEN 3
        WHEN 'Weak' THEN 4
        ELSE 5
    END;

-- 10. RÉSUMÉ FINAL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'surah_memorization')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'is_available_for_revision')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'memorization_level')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'next_revision_date')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surah_memorization' AND column_name = 'is_known')
        THEN '🎉 SYSTÈME CORRECTEMENT CONFIGURÉ - Prêt pour utilisation !'
        ELSE '⚠️ CONFIGURATION INCOMPLÈTE - Voir détails ci-dessus'
    END as "STATUT FINAL"; 