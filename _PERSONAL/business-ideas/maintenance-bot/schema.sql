-- ============================================
-- Maintenance Reminder Bots - Multi-Vertical Schema
-- ============================================

-- Table: verticals
-- Les différentes verticales/bots
CREATE TABLE IF NOT EXISTS verticals (
    id TEXT PRIMARY KEY,              -- 'maison', 'auto', 'moto', etc.
    name TEXT NOT NULL,               -- "MaisonBot"
    description TEXT,
    icon TEXT,                        -- Emoji
    whatsapp_number TEXT,             -- Numéro WhatsApp Business
    enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: clients
-- Utilisateurs (peuvent s'inscrire à plusieurs verticales)
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identité
    whatsapp_id TEXT UNIQUE,          -- ID WhatsApp
    phone TEXT,                       -- Numéro de téléphone
    name TEXT,                        -- Nom/Prénom
    email TEXT,                       -- Email (optionnel)
    
    -- Préférences globales
    timezone TEXT DEFAULT 'Europe/Paris',
    language TEXT DEFAULT 'fr',
    notification_hour INTEGER DEFAULT 9,
    
    -- Métadonnées
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME
);

-- Table: client_subscriptions
-- Abonnements par verticale
CREATE TABLE IF NOT EXISTS client_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    vertical_id TEXT NOT NULL,
    
    -- Abonnement
    status TEXT DEFAULT 'trial',      -- trial, active, expired, cancelled
    plan TEXT DEFAULT 'free',         -- free, annual, lifetime, bundle
    
    subscription_start DATE,
    subscription_end DATE,
    trial_ends_at DATE,
    
    -- Paiement
    stripe_subscription_id TEXT,
    
    -- Stats
    reminders_count INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vertical_id) REFERENCES verticals(id),
    UNIQUE(client_id, vertical_id)
);

-- Table: reminder_templates
-- Templates par verticale
CREATE TABLE IF NOT EXISTS reminder_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vertical_id TEXT NOT NULL,
    
    -- Identification
    code TEXT NOT NULL,               -- 'oil_change', 'boiler_service'
    name TEXT NOT NULL,               -- "Vidange huile"
    description TEXT,
    icon TEXT,
    
    -- Récurrence par défaut
    default_interval_days INTEGER,
    default_interval_months INTEGER,
    default_interval_km INTEGER,      -- Pour auto/moto
    
    -- Config
    requires_date BOOLEAN DEFAULT TRUE,   -- Nécessite date de référence
    requires_mileage BOOLEAN DEFAULT FALSE, -- Nécessite kilométrage
    
    -- Saisonnalité
    seasonal BOOLEAN DEFAULT FALSE,
    season_months TEXT,               -- JSON: [3,4] pour printemps
    
    -- Légal
    is_mandatory BOOLEAN DEFAULT FALSE,
    legal_reference TEXT,
    
    -- Contenu
    tips TEXT,
    estimated_cost_min INTEGER,
    estimated_cost_max INTEGER,
    
    display_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vertical_id) REFERENCES verticals(id),
    UNIQUE(vertical_id, code)
);

-- Table: client_reminders
-- Rappels configurés par client (personnalisables)
CREATE TABLE IF NOT EXISTS client_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    vertical_id TEXT NOT NULL,
    template_id INTEGER,              -- NULL si custom
    
    -- Identification
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    
    -- Configuration utilisateur
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Intervalle (l'utilisateur peut ajuster)
    interval_days INTEGER,
    interval_months INTEGER,
    interval_km INTEGER,              -- Pour véhicules
    
    -- Dates de référence (saisies par l'utilisateur)
    reference_date DATE,              -- Ex: date dernière vidange
    reference_mileage INTEGER,        -- Ex: km dernière vidange
    current_mileage INTEGER,          -- Km actuel (mis à jour par user)
    
    -- Calcul échéance
    next_due_date DATE,               -- Calculé automatiquement
    next_due_mileage INTEGER,         -- Pour véhicules
    
    -- Notifications
    notify_days_before INTEGER DEFAULT 7,
    notify_count INTEGER DEFAULT 2,   -- Nombre de rappels
    
    -- État
    status TEXT DEFAULT 'pending',    -- pending, notified, completed, snoozed
    last_notified_at DATETIME,
    completed_at DATETIME,
    snooze_until DATE,
    
    -- Notes utilisateur
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vertical_id) REFERENCES verticals(id),
    FOREIGN KEY (template_id) REFERENCES reminder_templates(id)
);

-- Table: notification_log
CREATE TABLE IF NOT EXISTS notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    reminder_id INTEGER NOT NULL,
    vertical_id TEXT NOT NULL,
    
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    message_text TEXT,
    whatsapp_message_id TEXT,
    
    status TEXT DEFAULT 'sent',       -- sent, delivered, read, failed
    error_message TEXT,
    
    -- Réaction utilisateur
    user_response TEXT,               -- done, snooze, skip
    response_at DATETIME,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_id) REFERENCES client_reminders(id) ON DELETE CASCADE,
    FOREIGN KEY (vertical_id) REFERENCES verticals(id)
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    
    provider TEXT,                    -- stripe, polar
    provider_payment_id TEXT,
    
    -- Détail
    plan TEXT,                        -- annual, lifetime, bundle
    verticals TEXT,                   -- JSON: ["maison", "auto"]
    
    status TEXT,                      -- pending, completed, failed, refunded
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- ============================================
-- Données initiales : Verticales
-- ============================================

INSERT OR IGNORE INTO verticals (id, name, description, icon) VALUES
('maison', 'MaisonBot', 'Rappels entretien maison', '🏠'),
('auto', 'AutoBot', 'Rappels entretien voiture', '🚗'),
('moto', 'MotoBot', 'Rappels entretien moto', '🏍️'),
('jardin', 'JardinBot', 'Rappels jardinage', '🌱'),
('plantes', 'PlantesBot', 'Rappels plantes intérieur', '🪴'),
('pets', 'PetBot', 'Rappels animaux de compagnie', '🐕');

-- ============================================
-- Templates : MAISON
-- ============================================

INSERT OR IGNORE INTO reminder_templates (vertical_id, code, name, description, default_interval_months, is_mandatory, icon, tips) VALUES
-- Obligatoires
('maison', 'boiler_service', 'Entretien chaudière', 'Révision annuelle obligatoire', 12, TRUE, '🔥', 'Obligatoire pour locataires et propriétaires. Conservez le certificat.'),
('maison', 'chimney_sweep', 'Ramonage cheminée', 'Ramonage obligatoire 1-2x/an', 6, TRUE, '🏠', 'Vérifiez réglementation locale. Certificat exigé par assurances.'),
('maison', 'smoke_detector', 'Test détecteurs fumée', 'Vérification détecteurs', 6, TRUE, '🚨', 'Appuyez sur bouton test. Changez piles si nécessaire.'),

-- Recommandés
('maison', 'radiator_bleed', 'Purge radiateurs', 'Purger avant hiver', 12, FALSE, '🌡️', 'Septembre/octobre avant rallumer chauffage.'),
('maison', 'vmc_clean', 'Nettoyage VMC', 'Nettoyer bouches et filtres', 6, FALSE, '💨', 'Aspirer bouches, laver filtres.'),
('maison', 'water_heater', 'Détartrage chauffe-eau', 'Détartrage ballon', 24, FALSE, '🚿', 'Prolonge durée vie, améliore rendement.'),
('maison', 'gutters', 'Nettoyage gouttières', 'Vider et nettoyer', 6, FALSE, '🍂', 'Printemps et automne.'),
('maison', 'roof_check', 'Vérification toiture', 'Inspection visuelle', 12, FALSE, '🏗️', 'Vérifier tuiles, faîtage, étanchéité.'),
('maison', 'ac_service', 'Entretien climatisation', 'Nettoyage filtres clim', 12, FALSE, '❄️', 'Nettoyer filtres chaque mois en été.'),
('maison', 'electrical_test', 'Test disjoncteur', 'Tester différentiel', 6, FALSE, '⚡', 'Bouton test - le courant doit couper.'),
('maison', 'water_softener', 'Sel adoucisseur', 'Recharger sel adoucisseur', 3, FALSE, '💧', 'Vérifier niveau tous les 2-3 mois.');

-- ============================================
-- Templates : AUTO
-- ============================================

INSERT OR IGNORE INTO reminder_templates (vertical_id, code, name, description, default_interval_months, default_interval_km, is_mandatory, icon, tips, requires_mileage) VALUES
('auto', 'oil_change', 'Vidange huile', 'Vidange huile moteur', 12, 15000, FALSE, '🛢️', 'Tous les 15-30 000 km selon véhicule.', TRUE),
('auto', 'technical_inspection', 'Contrôle technique', 'CT obligatoire', 24, NULL, TRUE, '🔍', 'Tous les 2 ans après 4 ans du véhicule.', FALSE),
('auto', 'tire_rotation', 'Permutation pneus', 'Rotation pneus', 12, 10000, FALSE, '🔧', 'Équilibre usure des pneus.', TRUE),
('auto', 'winter_tires', 'Pneus hiver', 'Monter pneus hiver', NULL, NULL, FALSE, '❄️', 'Novembre. En dessous de 7°C.', FALSE),
('auto', 'summer_tires', 'Pneus été', 'Remonter pneus été', NULL, NULL, FALSE, '☀️', 'Mars/Avril quand T°>7°C stable.', FALSE),
('auto', 'brake_check', 'Contrôle freins', 'Vérifier plaquettes/disques', 12, 30000, FALSE, '🛑', 'Plaquettes ~30-50k km, disques ~80k km.', TRUE),
('auto', 'coolant', 'Liquide refroidissement', 'Contrôler/remplacer', 24, 60000, FALSE, '🌡️', 'Vérifier niveau et état.', TRUE),
('auto', 'air_filter', 'Filtre à air', 'Remplacer filtre air', 12, 20000, FALSE, '💨', 'Améliore performances et conso.', TRUE),
('auto', 'battery_check', 'Contrôle batterie', 'Vérifier batterie', 24, NULL, FALSE, '🔋', 'Durée vie ~4-5 ans.', FALSE),
('auto', 'insurance', 'Assurance auto', 'Renouvellement assurance', 12, NULL, TRUE, '📋', 'Comparer les offres avant renouvellement.', FALSE);

-- ============================================
-- Templates : MOTO
-- ============================================

INSERT OR IGNORE INTO reminder_templates (vertical_id, code, name, description, default_interval_months, default_interval_km, is_mandatory, icon, tips, requires_mileage) VALUES
('moto', 'oil_change', 'Vidange huile', 'Vidange huile moteur', 6, 6000, FALSE, '🛢️', 'Plus fréquent que voiture.', TRUE),
('moto', 'chain_maintenance', 'Entretien chaîne', 'Graissage et tension chaîne', 1, 500, FALSE, '⛓️', 'Tous les 500km ou après pluie.', TRUE),
('moto', 'chain_replacement', 'Remplacement chaîne/kit', 'Chaîne + pignons + couronne', 24, 20000, FALSE, '🔗', 'Kit complet recommandé.', TRUE),
('moto', 'tire_check', 'Contrôle pneus', 'Vérifier usure et pression', 1, 1000, FALSE, '🏍️', 'Pression à froid, usure témoin.', TRUE),
('moto', 'brake_fluid', 'Liquide frein', 'Remplacer liquide frein', 24, NULL, FALSE, '🛑', 'Absorbe humidité, perd efficacité.', FALSE),
('moto', 'winterization', 'Hivernage moto', 'Préparer pour hiver', NULL, NULL, FALSE, '❄️', 'Batterie, essence, pneus, bâche.', FALSE),
('moto', 'spring_prep', 'Remise en route', 'Préparer pour saison', NULL, NULL, FALSE, '🌸', 'Vérifier tout après hivernage.', FALSE),
('moto', 'technical_inspection', 'Contrôle technique', 'CT obligatoire (si applicable)', 24, NULL, TRUE, '🔍', 'Obligatoire depuis 2024.', FALSE);

-- ============================================
-- Templates : JARDIN
-- ============================================

INSERT OR IGNORE INTO reminder_templates (vertical_id, code, name, description, default_interval_months, seasonal, season_months, icon, tips) VALUES
('jardin', 'hedge_trim', 'Taille haies', 'Tailler les haies', 6, TRUE, '[2,9]', '🌳', 'Février et septembre.'),
('jardin', 'lawn_scarify', 'Scarification pelouse', 'Scarifier la pelouse', 12, TRUE, '[3,4]', '🌱', 'Au printemps après gelées.'),
('jardin', 'lawn_fertilize', 'Engrais pelouse', 'Fertiliser gazon', 4, FALSE, NULL, '🧪', '3x/an: printemps, été, automne.'),
('jardin', 'irrigation_winterize', 'Hivernage arrosage', 'Vidanger système', 12, TRUE, '[10,11]', '💧', 'Avant premières gelées.'),
('jardin', 'irrigation_startup', 'Remise en route arrosage', 'Remettre système', 12, TRUE, '[3,4]', '💦', 'Après dernières gelées.'),
('jardin', 'fruit_tree_prune', 'Taille fruitiers', 'Tailler arbres fruitiers', 12, TRUE, '[1,2]', '🍎', 'Hiver, hors gel.'),
('jardin', 'rose_prune', 'Taille rosiers', 'Tailler les rosiers', 12, TRUE, '[2,3]', '🌹', 'Fin hiver, avant reprise.'),
('jardin', 'compost_turn', 'Retourner compost', 'Brasser le compost', 2, FALSE, NULL, '♻️', 'Aération pour décomposition.');

-- ============================================
-- Templates : PLANTES (intérieur)
-- ============================================

INSERT OR IGNORE INTO reminder_templates (vertical_id, code, name, description, default_interval_days, icon, tips) VALUES
('plantes', 'watering_weekly', 'Arrosage hebdo', 'Arroser plantes classiques', 7, '💧', 'La plupart des plantes vertes.'),
('plantes', 'watering_biweekly', 'Arrosage bi-mensuel', 'Plantes peu gourmandes', 14, '💧', 'Succulentes, cactus, ZZ, snake plant.'),
('plantes', 'fertilize', 'Engrais', 'Fertiliser plantes', 14, '🧪', 'Printemps-été uniquement.'),
('plantes', 'repot', 'Rempotage', 'Rempoter si nécessaire', 365, '🪴', 'Quand racines sortent du pot.'),
('plantes', 'dust_leaves', 'Dépoussiérer feuilles', 'Nettoyer feuilles', 30, '🍃', 'Améliore photosynthèse.'),
('plantes', 'rotate', 'Rotation', 'Tourner les plantes', 14, '🔄', 'Croissance uniforme vers lumière.'),
('plantes', 'pest_check', 'Inspection parasites', 'Vérifier insectes', 14, '🔍', 'Dessous feuilles, tiges.');

-- ============================================
-- Templates : PETS (animaux)
-- ============================================

INSERT OR IGNORE INTO reminder_templates (vertical_id, code, name, description, default_interval_months, is_mandatory, icon, tips) VALUES
('pets', 'vaccination', 'Vaccins annuels', 'Rappel vaccins', 12, TRUE, '💉', 'Carnet de santé obligatoire.'),
('pets', 'deworming', 'Vermifuge', 'Traitement vermifuge', 3, FALSE, '💊', 'Tous les 3-6 mois selon mode de vie.'),
('pets', 'flea_treatment', 'Anti-puces/tiques', 'Traitement antiparasitaire', 1, FALSE, '🐜', 'Mensuel en saison (mars-novembre).'),
('pets', 'grooming', 'Toilettage', 'Toilettage complet', 2, FALSE, '✂️', 'Selon race et pelage.'),
('pets', 'dental_check', 'Contrôle dentaire', 'Vérifier dents', 12, FALSE, '🦷', 'Détartrage si nécessaire.'),
('pets', 'vet_checkup', 'Visite véto annuelle', 'Bilan de santé', 12, FALSE, '🩺', 'Même si tout va bien.'),
('pets', 'nail_trim', 'Coupe griffes', 'Couper les griffes', 1, FALSE, '✂️', 'Si le chien ne les use pas assez.'),
('pets', 'food_stock', 'Stock croquettes', 'Réapprovisionner', 1, FALSE, '🍖', 'Ne pas tomber en rade!');

-- ============================================
-- Index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_reminders_client ON client_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_vertical ON client_reminders(vertical_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_next_due ON client_reminders(next_due_date);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client ON client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_client ON notification_log(client_id);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_vertical ON reminder_templates(vertical_id);
