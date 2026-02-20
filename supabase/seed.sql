-- Seed Data for MaxHealth Coaching Demo
-- Run this AFTER creating the tables (schema.sql)
-- NOTE: You must first create users via Supabase Auth or the app signup flow
-- Then update the user_id values below with real UUIDs

-- Demo Coach Settings (update coach_id after creating coach account)
-- INSERT INTO public.coach_settings (coach_id, max_clients, spots_remaining, welcome_message)
-- VALUES ('COACH_USER_ID_HERE', 20, 15, 'Welcome to MaxHealth Coaching! I''m Max, and I''m excited to help you transform your body and health. Let''s get started!');

-- Sample Blog Posts (update author_id after creating coach account)
-- INSERT INTO public.blog_posts (title, slug, content, excerpt, published, author_id) VALUES
-- ('The Complete Guide to Calculating Your Macros', 'complete-guide-calculating-macros',
--  'Understanding your macros is the foundation of any successful nutrition plan...',
--  'Learn how to calculate your ideal protein, carbs, and fat intake for any fitness goal.',
--  true, 'COACH_USER_ID_HERE'),
-- ('5 Common Mistakes People Make When Cutting', 'common-cutting-mistakes',
--  'Cutting can be simple, but many people overcomplicate it or fall into common traps...',
--  'Avoid these pitfalls that sabotage fat loss and learn what to do instead.',
--  true, 'COACH_USER_ID_HERE'),
-- ('How to Build Muscle on a Budget', 'build-muscle-on-budget',
--  'You don''t need expensive supplements or specialty foods to build muscle...',
--  'High-protein meals that won''t break the bank.',
--  true, 'COACH_USER_ID_HERE');

-- Sample Transformations
INSERT INTO public.transformations (client_name, weight_lost, duration, quote, featured, approved) VALUES
('Alex M.', 'Lost 25 lbs', '12 weeks', 'The AI meal plan made it so easy to stay on track. I never felt like I was dieting.', true, true),
('Sarah K.', 'Lost 18 lbs', '8 weeks', 'The training program was perfect for my home gym setup. I saw results within the first month.', true, true),
('James R.', 'Gained 12 lbs muscle', '12 weeks', 'As a hard gainer, finally having a structured plan with the right calories made all the difference.', true, true),
('Maria L.', 'Lost 30 lbs', '16 weeks', 'The weekly check-ins and photo tracking kept me accountable. Best investment in myself.', true, true);
