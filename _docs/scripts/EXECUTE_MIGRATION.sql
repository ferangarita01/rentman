-- ================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/uoekolfgbbmvhzsfkjef/sql
-- ================================================

-- Paso 1: Verificar tablas existentes
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'humans', 'agents')
ORDER BY tablename;

-- Paso 2: Ejecutar migración completa
-- ============================================
-- MIGRATION: Sistema de Reputación y Matching
-- Fecha: 2026-02-07
-- Descripción: Agrega tablas para reviews bidireccionales
--              y sistema de niveles inclusivo
-- ============================================

-- 1. TABLA DE REVIEWS BIDIRECCIONALES
-- Tanto humanos como agentes pueden calificar
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Quién está dando la review
    reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('agent', 'human')),
    reviewer_agent_id UUID,
    reviewer_human_id UUID,
    
    -- Quién está siendo calificado
    reviewee_type TEXT NOT NULL CHECK (reviewee_type IN ('agent', 'human')),
    reviewee_agent_id UUID,
    reviewee_human_id UUID,
    
    -- Calificación general
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Ratings por categoría (diferentes según dirección)
    -- Agent → Human: punctuality, quality, communication, following_instructions
    -- Human → Agent: clarity, fairness, payment_speed, support_quality
    category_ratings JSONB NOT NULL,
    
    -- Comentario opcional
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (
        (reviewer_type = 'agent' AND reviewer_agent_id IS NOT NULL) OR
        (reviewer_type = 'human' AND reviewer_human_id IS NOT NULL)
    ),
    CHECK (
        (reviewee_type = 'agent' AND reviewee_agent_id IS NOT NULL) OR
        (reviewee_type = 'human' AND reviewee_human_id IS NOT NULL)
    )
);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_agent ON reviews(reviewer_agent_id) WHERE reviewer_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_human ON reviews(reviewer_human_id) WHERE reviewer_human_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_agent ON reviews(reviewee_agent_id) WHERE reviewee_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_human ON reviews(reviewee_human_id) WHERE reviewee_human_id IS NOT NULL;

-- 2. TABLA DE RESUMEN DE RATINGS (CACHE)
-- Para consultas rápidas sin calcular cada vez
CREATE TABLE IF NOT EXISTS rating_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo de entidad (agent o human)
    entity_type TEXT NOT NULL CHECK (entity_type IN ('agent', 'human')),
    entity_id UUID NOT NULL,
    
    -- Métricas agregadas
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Promedios por categoría
    category_averages JSONB DEFAULT '{}',
    
    -- Distribución de ratings (cuántos 1★, 2★, etc.)
    rating_distribution JSONB DEFAULT '{
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0
    }',
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint único por entidad
    UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_rating_summaries_entity ON rating_summaries(entity_type, entity_id);

-- 3. AGREGAR CAMPOS A TABLA HUMANS
-- Para sistema de niveles
ALTER TABLE humans ADD COLUMN IF NOT EXISTS current_level TEXT DEFAULT 'BEGINNER' 
    CHECK (current_level IN ('BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'));

ALTER TABLE humans ADD COLUMN IF NOT EXISTS category_scores JSONB DEFAULT '{}';

-- 4. AGREGAR CAMPOS A TABLA TASKS
-- Para clasificación de dificultad
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'EASY'
    CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_human_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- 5. FUNCIÓN PARA ACTUALIZAR RATING SUMMARY AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_rating_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_entity_type TEXT;
    v_entity_id UUID;
    v_total_reviews INTEGER;
    v_avg_rating DECIMAL(3,2);
    v_category_avgs JSONB;
    v_distribution JSONB;
BEGIN
    -- Determinar qué entidad actualizar
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_entity_type := NEW.reviewee_type;
        v_entity_id := CASE 
            WHEN NEW.reviewee_type = 'agent' THEN NEW.reviewee_agent_id
            WHEN NEW.reviewee_type = 'human' THEN NEW.reviewee_human_id
        END;
    ELSIF TG_OP = 'DELETE' THEN
        v_entity_type := OLD.reviewee_type;
        v_entity_id := CASE 
            WHEN OLD.reviewee_type = 'agent' THEN OLD.reviewee_agent_id
            WHEN OLD.reviewee_type = 'human' THEN OLD.reviewee_human_id
        END;
    END IF;

    -- Calcular métricas
    SELECT 
        COUNT(*),
        COALESCE(AVG(overall_rating), 0)::DECIMAL(3,2)
    INTO v_total_reviews, v_avg_rating
    FROM reviews
    WHERE reviewee_type = v_entity_type
      AND (
          (reviewee_type = 'agent' AND reviewee_agent_id = v_entity_id) OR
          (reviewee_type = 'human' AND reviewee_human_id = v_entity_id)
      );

    -- Calcular promedios por categoría
    SELECT jsonb_object_agg(
        key,
        ROUND(AVG((value)::numeric), 2)
    )
    INTO v_category_avgs
    FROM reviews,
    LATERAL jsonb_each_text(category_ratings)
    WHERE reviewee_type = v_entity_type
      AND (
          (reviewee_type = 'agent' AND reviewee_agent_id = v_entity_id) OR
          (reviewee_type = 'human' AND reviewee_human_id = v_entity_id)
      )
    GROUP BY key;

    -- Calcular distribución
    SELECT jsonb_object_agg(
        rating::text,
        count
    )
    INTO v_distribution
    FROM (
        SELECT overall_rating as rating, COUNT(*) as count
        FROM reviews
        WHERE reviewee_type = v_entity_type
          AND (
              (reviewee_type = 'agent' AND reviewee_agent_id = v_entity_id) OR
              (reviewee_type = 'human' AND reviewee_human_id = v_entity_id)
          )
        GROUP BY overall_rating
    ) sub;

    -- Insertar o actualizar summary
    INSERT INTO rating_summaries (
        entity_type,
        entity_id,
        total_reviews,
        average_rating,
        category_averages,
        rating_distribution,
        last_updated
    ) VALUES (
        v_entity_type,
        v_entity_id,
        v_total_reviews,
        v_avg_rating,
        COALESCE(v_category_avgs, '{}'::jsonb),
        COALESCE(v_distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb),
        NOW()
    )
    ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        category_averages = EXCLUDED.category_averages,
        rating_distribution = EXCLUDED.rating_distribution,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER PARA AUTO-ACTUALIZAR RATING SUMMARIES
DROP TRIGGER IF EXISTS trigger_update_rating_summary ON reviews;
CREATE TRIGGER trigger_update_rating_summary
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_rating_summary();

-- 7. FUNCIÓN PARA CALCULAR NIVEL DE HUMANO AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION calculate_human_level()
RETURNS TRIGGER AS $$
DECLARE
    v_tasks_completed INTEGER;
    v_reputation DECIMAL(3,2);
    v_new_level TEXT;
BEGIN
    v_tasks_completed := NEW.total_tasks_completed;
    v_reputation := NEW.reputation_score;

    -- Determinar nivel según tareas completadas y reputación
    IF v_tasks_completed = 0 THEN
        v_new_level := 'BEGINNER';
    ELSIF v_tasks_completed < 10 AND v_reputation >= 3.0 THEN
        v_new_level := 'EASY';
    ELSIF v_tasks_completed < 25 AND v_reputation >= 3.5 THEN
        v_new_level := 'MEDIUM';
    ELSIF v_tasks_completed < 50 AND v_reputation >= 4.0 THEN
        v_new_level := 'HARD';
    ELSIF v_tasks_completed >= 50 AND v_reputation >= 4.0 THEN
        v_new_level := 'EXPERT';
    ELSE
        v_new_level := 'BEGINNER'; -- Default fallback
    END IF;

    NEW.current_level := v_new_level;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGER PARA AUTO-CALCULAR NIVEL
DROP TRIGGER IF EXISTS trigger_calculate_human_level ON humans;
CREATE TRIGGER trigger_calculate_human_level
    BEFORE INSERT OR UPDATE OF total_tasks_completed, reputation_score ON humans
    FOR EACH ROW
    EXECUTE FUNCTION calculate_human_level();

-- 9. FUNCIÓN PARA CLASIFICAR DIFICULTAD DE TAREA AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION classify_task_difficulty()
RETURNS TRIGGER AS $$
DECLARE
    v_budget DECIMAL(10,2);
    v_skills_count INTEGER;
    v_difficulty TEXT;
BEGIN
    v_budget := NEW.budget_amount;
    v_skills_count := COALESCE(array_length(NEW.required_skills, 1), 0);

    -- Clasificar según presupuesto y skills
    IF v_budget < 50 AND v_skills_count <= 1 THEN
        v_difficulty := 'EASY';
    ELSIF v_budget < 150 AND v_skills_count <= 3 THEN
        v_difficulty := 'MEDIUM';
    ELSIF v_budget < 300 OR v_skills_count <= 5 THEN
        v_difficulty := 'HARD';
    ELSE
        v_difficulty := 'EXPERT';
    END IF;

    NEW.difficulty_level := v_difficulty;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. TRIGGER PARA AUTO-CLASIFICAR DIFICULTAD
DROP TRIGGER IF EXISTS trigger_classify_task_difficulty ON tasks;
CREATE TRIGGER trigger_classify_task_difficulty
    BEFORE INSERT OR UPDATE OF budget_amount, required_skills ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION classify_task_difficulty();

-- 11. ROW LEVEL SECURITY (RLS) POLICIES

-- Reviews - Los usuarios pueden ver sus propias reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews about them" ON reviews
    FOR SELECT USING (
        (reviewee_type = 'human' AND reviewee_human_id = auth.uid()) OR
        (reviewer_type = 'human' AND reviewer_human_id = auth.uid())
    );

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        reviewer_type = 'human' AND reviewer_human_id = auth.uid()
    );

-- Rating summaries - Todos pueden leer (son públicas)
ALTER TABLE rating_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rating summaries" ON rating_summaries
    FOR SELECT USING (true);

-- 12. FUNCIÓN HELPER PARA OBTENER PROGRESO DE NIVEL
CREATE OR REPLACE FUNCTION get_level_progress(p_human_id UUID)
RETURNS TABLE(
    current_level TEXT,
    tasks_completed INTEGER,
    tasks_needed_for_next INTEGER,
    next_level TEXT,
    reputation_current DECIMAL(3,2),
    reputation_needed DECIMAL(3,2),
    progress_percentage INTEGER
) AS $$
DECLARE
    v_human RECORD;
    v_tasks_needed INTEGER;
    v_next_level TEXT;
    v_reputation_needed DECIMAL(3,2);
BEGIN
    -- Obtener info del humano
    SELECT 
        h.current_level,
        h.total_tasks_completed,
        h.reputation_score
    INTO v_human
    FROM humans h
    WHERE h.id = p_human_id;

    -- Determinar siguiente nivel y requisitos
    CASE v_human.current_level
        WHEN 'BEGINNER' THEN
            v_next_level := 'EASY';
            v_tasks_needed := 1;
            v_reputation_needed := 3.0;
        WHEN 'EASY' THEN
            v_next_level := 'MEDIUM';
            v_tasks_needed := 10;
            v_reputation_needed := 3.5;
        WHEN 'MEDIUM' THEN
            v_next_level := 'HARD';
            v_tasks_needed := 25;
            v_reputation_needed := 4.0;
        WHEN 'HARD' THEN
            v_next_level := 'EXPERT';
            v_tasks_needed := 50;
            v_reputation_needed := 4.0;
        ELSE
            v_next_level := 'MAX_LEVEL';
            v_tasks_needed := 0;
            v_reputation_needed := 0;
    END CASE;

    RETURN QUERY SELECT
        v_human.current_level,
        v_human.total_tasks_completed,
        v_tasks_needed - v_human.total_tasks_completed AS tasks_needed_for_next,
        v_next_level,
        v_human.reputation_score,
        v_reputation_needed,
        CASE 
            WHEN v_tasks_needed > 0 THEN 
                LEAST(100, (v_human.total_tasks_completed::FLOAT / v_tasks_needed * 100)::INTEGER)
            ELSE 100
        END AS progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL - Comentar si no se necesita)
-- ============================================

-- Ejemplo de review de humano a agente
/*
INSERT INTO reviews (
    task_id,
    reviewer_type,
    reviewer_human_id,
    reviewee_type,
    reviewee_agent_id,
    overall_rating,
    category_ratings,
    comment
) VALUES (
    '<task-uuid>',
    'human',
    '<human-uuid>',
    'agent',
    '<agent-uuid>',
    5,
    '{"clarity": 5, "fairness": 5, "payment_speed": 5, "support_quality": 4}',
    'Excelente agente, muy claras las instrucciones'
);
*/

-- Ejemplo de review de agente a humano
/*
INSERT INTO reviews (
    task_id,
    reviewer_type,
    reviewer_agent_id,
    reviewee_type,
    reviewee_human_id,
    overall_rating,
    category_ratings,
    comment
) VALUES (
    '<task-uuid>',
    'agent',
    '<agent-uuid>',
    'human',
    '<human-uuid>',
    5,
    '{"punctuality": 5, "quality": 5, "communication": 5, "following_instructions": 5}',
    'Trabajo perfecto, muy profesional'
);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
    RAISE NOTICE '✅ Verificando tablas creadas...';
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'reviews') THEN
        RAISE NOTICE '  ✅ reviews';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'rating_summaries') THEN
        RAISE NOTICE '  ✅ rating_summaries';
    END IF;
    
    RAISE NOTICE '✅ Verificando columnas agregadas...';
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'humans' AND column_name = 'current_level'
    ) THEN
        RAISE NOTICE '  ✅ humans.current_level';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'difficulty_level'
    ) THEN
        RAISE NOTICE '  ✅ tasks.difficulty_level';
    END IF;
    
    RAISE NOTICE '✅ Migración completada exitosamente!';
END $$;


-- Paso 3: Verificar que se crearon las nuevas tablas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reviews', 'rating_summaries')
ORDER BY tablename;

-- Paso 4: Verificar nuevas columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'humans' 
AND column_name IN ('current_level', 'category_scores');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('difficulty_level', 'assigned_human_id', 'assigned_at');

-- ✅ Si ves resultados en todos los pasos, la migración fue exitosa
