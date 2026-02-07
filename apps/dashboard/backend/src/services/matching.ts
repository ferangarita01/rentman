import { supabase } from '../lib/supabase.js';

/**
 * ALGORITMO DE MATCHING JUSTO E INCLUSIVO
 * 
 * Filosofía: Todos merecen oportunidad de crecer
 * - Nuevos usuarios reciben tareas sencillas para ganar experiencia
 * - Usuarios experimentados reciben tareas complejas
 * - Sistema de rotación para evitar monopolio de "los mejores"
 * - Bonus por ayudar a crecer a la comunidad
 */
export class MatchingService {
    
    /**
     * Encuentra candidatos usando sistema de NIVELES
     * Cada nivel tiene acceso a diferentes tipos de tareas
     */
    async findCandidatesWithGrowth(taskId: string) {
        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (!task) return [];

        // Clasificar dificultad de la tarea
        const taskLevel = this.classifyTaskDifficulty(task);

        // Buscar humanos según nivel de tarea
        const { data: humans } = await supabase
            .from('humans')
            .select('id, display_name, reputation_score, skills, total_tasks_completed')
            .eq('verification_status', 'verified')
            .gte('reputation_score', this.getMinReputationForLevel(taskLevel))
            .order('total_tasks_completed', { ascending: true }) // Los con menos experiencia primero
            .limit(20);

        if (!humans || humans.length === 0) return [];

        // Asignar scores de oportunidad
        return humans.map(h => ({
            ...h,
            opportunity_score: this.calculateOpportunityScore(h, task, taskLevel)
        })).sort((a, b) => b.opportunity_score - a.opportunity_score);
    }

    /**
     * Clasifica dificultad: EASY, MEDIUM, HARD, EXPERT
     */
    private classifyTaskDifficulty(task: any): string {
        const budget = task.budget_amount || 0;
        const skillsRequired = task.required_skills?.length || 0;

        // Tareas sencillas: bajo presupuesto, pocas skills
        if (budget < 50 && skillsRequired <= 1) return 'EASY';
        
        // Tareas medias: presupuesto medio, algunas skills
        if (budget < 150 && skillsRequired <= 3) return 'MEDIUM';
        
        // Tareas difíciles: alto presupuesto o muchas skills
        if (budget < 300 || skillsRequired <= 5) return 'HARD';
        
        // Tareas expertas: muy alto presupuesto, muchas skills
        return 'EXPERT';
    }

    /**
     * Reputación mínima según nivel de tarea
     */
    private getMinReputationForLevel(level: string): number {
        switch(level) {
            case 'EASY': return 0;      // Todos pueden intentar
            case 'MEDIUM': return 3.0;  // Necesitas experiencia básica
            case 'HARD': return 3.5;    // Necesitas buena reputación
            case 'EXPERT': return 4.0;  // Solo los mejores
            default: return 0;
        }
    }

    /**
     * Score de oportunidad de crecimiento
     * Prioriza a quien MÁS PUEDE APRENDER de esta tarea
     */
    private calculateOpportunityScore(human: any, task: any, taskLevel: string): number {
        let score = 0;

        // 1. BONUS NUEVOS (30 puntos) - Ayudamos a empezar
        if (human.total_tasks_completed === 0) {
            score += 30;
        } else if (human.total_tasks_completed < 5) {
            score += 20;
        } else if (human.total_tasks_completed < 10) {
            score += 10;
        }

        // 2. REPUTACIÓN (40 puntos) - Sigue siendo importante
        score += (human.reputation_score / 5.0) * 40;

        // 3. MATCH DE SKILLS (20 puntos) - ¿Puede aprender algo nuevo?
        const hasAllSkills = task.required_skills?.every((s: string) => 
            human.skills?.includes(s)
        );
        
        if (!hasAllSkills) {
            score += 10; // Bonus por aprender nueva skill
        } else {
            score += 20; // Si ya las tiene, también bien
        }

        // 4. NIVEL APROPIADO (10 puntos) - Tarea adecuada para su nivel
        const humanLevel = this.getHumanLevel(human);
        if (humanLevel === taskLevel) {
            score += 10; // Perfecto para su nivel
        } else if (this.isOneLevelUp(humanLevel, taskLevel)) {
            score += 15; // Bonus por desafío (crecer)
        }

        return score;
    }

    /**
     * Determina nivel del humano según experiencia
     */
    private getHumanLevel(human: any): string {
        const tasks = human.total_tasks_completed;
        const reputation = human.reputation_score;

        if (tasks === 0) return 'BEGINNER';
        if (tasks < 10 && reputation >= 3.0) return 'EASY';
        if (tasks < 25 && reputation >= 3.5) return 'MEDIUM';
        if (tasks < 50 && reputation >= 4.0) return 'HARD';
        return 'EXPERT';
    }

    /**
     * Verifica si la tarea es un nivel arriba (oportunidad de crecimiento)
     */
    private isOneLevelUp(humanLevel: string, taskLevel: string): boolean {
        const levels = ['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'];
        const humanIndex = levels.indexOf(humanLevel);
        const taskIndex = levels.indexOf(taskLevel);
        return taskIndex === humanIndex + 1;
    }

    /**
     * Sistema de ROTACIÓN - Evita que siempre ganen los mismos
     */
    async assignWithRotation(taskId: string, agentId: string) {
        // Verificar reputación del agente
        const { data: agent } = await supabase
            .from('agents')
            .select('reputation_score')
            .eq('id', agentId)
            .single();

        if (!agent || agent.reputation_score < 2.5) {
            return { 
                success: false, 
                reason: 'Agent reputation too low' 
            };
        }

        // Obtener candidatos con sistema de oportunidad
        const candidates = await this.findCandidatesWithGrowth(taskId);

        if (candidates.length === 0) {
            return { 
                success: false, 
                reason: 'No qualified humans available' 
            };
        }

        // Seleccionar top 3 y rotar entre ellos
        const topCandidates = candidates.slice(0, 3);
        
        // Selección aleatoria ponderada entre top 3
        // El #1 tiene 50% chance, #2 tiene 30%, #3 tiene 20%
        const weights = [0.5, 0.3, 0.2];
        const randomValue = Math.random();
        let selectedIndex = 0;
        let cumulativeWeight = 0;

        for (let i = 0; i < topCandidates.length; i++) {
            cumulativeWeight += weights[i];
            if (randomValue <= cumulativeWeight) {
                selectedIndex = i;
                break;
            }
        }

        const selectedHuman = topCandidates[selectedIndex];

        // Asignar tarea
        const { error } = await supabase
            .from('tasks')
            .update({ 
                status: 'ASSIGNED',
                assigned_human_id: selectedHuman.id,
                assigned_at: new Date().toISOString()
            })
            .eq('id', taskId);

        if (error) {
            return { success: false, reason: error.message };
        }

        return { 
            success: true, 
            human_id: selectedHuman.id,
            human_name: selectedHuman.display_name,
            reputation: selectedHuman.reputation_score,
            tasks_completed: selectedHuman.total_tasks_completed,
            opportunity_score: selectedHuman.opportunity_score,
            message: this.getEncouragingMessage(selectedHuman)
        };
    }

    /**
     * Mensajes motivacionales según nivel
     */
    private getEncouragingMessage(human: any): string {
        if (human.total_tasks_completed === 0) {
            return '🎉 ¡Tu primera tarea! Estamos emocionados de verte crecer.';
        }
        if (human.total_tasks_completed < 5) {
            return '💪 Sigue así, cada tarea te acerca al siguiente nivel.';
        }
        if (human.total_tasks_completed < 10) {
            return '⭐ Vas por buen camino, tu reputación está creciendo.';
        }
        if (human.total_tasks_completed < 25) {
            return '🚀 Ya eres parte de la comunidad, ¡sigue ayudando!';
        }
        return '👑 Gracias por ser parte activa de Rentman.';
    }

    /**
     * Sistema de RECOMPENSAS por ayudar a nuevos
     * Si un experto acepta mentoría de principiantes
     */
    async createMentorshipBonus(expertHumanId: string, beginnerHumanId: string) {
        // Verificar que el experto tenga buena reputación
        const { data: expert } = await supabase
            .from('humans')
            .select('reputation_score, total_tasks_completed')
            .eq('id', expertHumanId)
            .single();

        if (!expert || expert.total_tasks_completed < 25 || expert.reputation_score < 4.0) {
            return null;
        }

        // Crear bonus en transacciones
        await supabase
            .from('transactions')
            .insert({
                user_id: expertHumanId,
                type: 'bonus',
                amount: 5.00, // $5 por mentoría
                currency: 'USD',
                status: 'completed',
                description: `Mentorship bonus - helping new member grow`
            });

        return { bonus_awarded: true, amount: 5.00 };
    }
}

export const matchingService = new MatchingService();
