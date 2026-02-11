-- RLS POLICY PERFORMANCE OPTIMIZATION (InitPlan pattern)
-- Migrating all policies to use (SELECT auth.uid()) for improved performance at scale.

-- public.reviews
DROP POLICY IF EXISTS "Users can view reviews about them" ON public.reviews;
CREATE POLICY "Users can view reviews about them" ON public.reviews FOR SELECT USING (
  ((reviewee_type = 'human'::text) AND (reviewee_human_id = (SELECT auth.uid()))) OR 
  ((reviewer_type = 'human'::text) AND (reviewer_human_id = (SELECT auth.uid())))
);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  (reviewer_type = 'human'::text) AND (reviewer_human_id = (SELECT auth.uid()))
);

-- public.messages
DROP POLICY IF EXISTS "Users can read messages for their tasks" ON public.messages;
CREATE POLICY "Users can read messages for their tasks" ON public.messages FOR SELECT USING (
  (sender_id = (SELECT auth.uid())) OR (task_id IN ( SELECT tasks.id FROM tasks WHERE ((tasks.agent_id = (SELECT auth.uid()) OR (tasks.assigned_human_id = (SELECT auth.uid()))))))
);

DROP POLICY IF EXISTS "Users can insert messages for their tasks" ON public.messages;
CREATE POLICY "Users can insert messages for their tasks" ON public.messages FOR INSERT WITH CHECK (
  (sender_id = (SELECT auth.uid())) AND (task_id IN ( SELECT tasks.id FROM tasks WHERE ((tasks.agent_id = (SELECT auth.uid()) OR (tasks.assigned_human_id = (SELECT auth.uid()))))))
);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (sender_id = (SELECT auth.uid()));

-- public.agents
DROP POLICY IF EXISTS "agents_select_own" ON public.agents;
CREATE POLICY "agents_select_own" ON public.agents FOR SELECT USING (
  ((SELECT auth.uid())::text = (id)::text) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
);

DROP POLICY IF EXISTS "agents_update_own" ON public.agents;
CREATE POLICY "agents_update_own" ON public.agents FOR UPDATE USING ((SELECT auth.uid())::text = (id)::text);

-- public.humans
DROP POLICY IF EXISTS "humans_select_own" ON public.humans;
CREATE POLICY "humans_select_own" ON public.humans FOR SELECT USING ((SELECT auth.uid()) = auth_user_id OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "humans_update_own" ON public.humans;
CREATE POLICY "humans_update_own" ON public.humans FOR UPDATE USING ((SELECT auth.uid()) = auth_user_id);

-- public.tasks
DROP POLICY IF EXISTS "tasks_select_agent" ON public.tasks;
CREATE POLICY "tasks_select_agent" ON public.tasks FOR SELECT USING ((SELECT auth.uid())::text = (agent_id)::text);

DROP POLICY IF EXISTS "tasks_select_assigned" ON public.tasks;
CREATE POLICY "tasks_select_assigned" ON public.tasks FOR SELECT USING ((SELECT auth.uid())::text = (assigned_human_id)::text);

DROP POLICY IF EXISTS "tasks_update_agent" ON public.tasks;
CREATE POLICY "tasks_update_agent" ON public.tasks FOR UPDATE USING ((SELECT auth.uid())::text = (agent_id)::text);

DROP POLICY IF EXISTS "tasks_insert_agent" ON public.tasks;
CREATE POLICY "tasks_insert_agent" ON public.tasks FOR INSERT WITH CHECK (((SELECT auth.uid())::text = (agent_id)::text) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text));

DROP POLICY IF EXISTS "Users can claim open tasks" ON public.tasks;
CREATE POLICY "Users can claim open tasks" ON public.tasks FOR UPDATE USING (status = 'open'::text) WITH CHECK ((status = 'assigned'::text) AND (assigned_human_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "authenticated_users_can_create_tasks" ON public.tasks;
CREATE POLICY "authenticated_users_can_create_tasks" ON public.tasks FOR INSERT WITH CHECK ((SELECT auth.uid()) = requester_id);

-- public.waitlist
DROP POLICY IF EXISTS "waitlist_service_only" ON public.waitlist;
CREATE POLICY "waitlist_service_only" ON public.waitlist FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- INDEXING REMAINING UNINDEXED FOREIGN KEYS
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_agent_id ON public.agent_api_keys(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_hierarchy_child_agent_id ON public.agent_hierarchy(child_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_hierarchy_parent_agent_id ON public.agent_hierarchy(parent_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_verifications_agent_id ON public.agent_verifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON public.agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_task_proofs_human_id ON public.task_proofs(human_id);
CREATE INDEX IF NOT EXISTS idx_task_proofs_reviewed_by ON public.task_proofs(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_verification_proofs_human_id ON public.verification_proofs(human_id);
CREATE INDEX IF NOT EXISTS idx_verification_proofs_task_id ON public.verification_proofs(task_id);

-- Stripe schema indexing (Corrected column name _account_id)
CREATE INDEX IF NOT EXISTS idx_stripe_charges_account ON stripe.charges(_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_account ON stripe.customers(_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_account ON stripe.invoices(_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_intents_account ON stripe.payment_intents(_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_account ON stripe.subscriptions(_account_id);

-- Resolving "RLS Enabled No Policy" for stripe.charges
DROP POLICY IF EXISTS "Allow service role full access" ON stripe.charges;
CREATE POLICY "Allow service role full access" ON stripe.charges FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
