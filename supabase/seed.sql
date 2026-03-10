
-- Insert sample partners
INSERT INTO public.partners (id, name, description, contact_email) VALUES
('b0e2d1c0-3f4a-4b5c-8d9e-1f2a3b4c5d6e', 'Cines del Centro', 'Cadena de cines líder en la región central.', 'contacto@cinesdelcentro.com'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Teatro Municipal', 'El teatro más antiguo y prestigioso de la ciudad.', 'administracion@teatromunicipal.org'),
('f7e6d5c4-3b2a-1f0e-9d8c-7b6a5f4e3d2c', 'Museo de Arte Moderno', 'Un espacio dedicado al arte contemporáneo.', 'info@mam.org');

-- Insert sample rewards
INSERT INTO public.rewards (id, partner_id, title, description, cost_e4c, image_url, is_featured, featured_until) VALUES
-- Featured Rewards (prioritized)
('reward-featured-1', 'b0e2d1c0-3f4a-4b5c-8d9e-1f2a3b4c5d6e', 'Entrada VIP Cines del Centro', 'Entrada doble VIP para cualquier película, incluyendo estrenos, canjeable en Cines del Centro. Validez de 6 meses.', 200, 'https://example.com/cine_vip.jpg', TRUE, NOW() + INTERVAL '1 month'),
('reward-featured-2', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Noche de Teatro Exclusiva', 'Acceso a la función de gala en el Teatro Municipal, con copa de bienvenida. Validez de 3 meses.', 500, 'https://example.com/teatro_gala.jpg', TRUE, NOW() + INTERVAL '2 months'),

-- Regular Rewards
('reward-1', 'b0e2d1c0-3f4a-4b5c-8d9e-1f2a3b4c5d6e', 'Entrada 2D - Cines del Centro', 'Válido para cualquier función de lunes a jueves en salas seleccionadas de Cines del Centro.', 100, 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80', FALSE, NULL),
('reward-2', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Obra: "El Método" (General)', 'Pase para 1 persona en el Teatro Municipal. Funciones de fin de semana.', 250, 'https://images.unsplash.com/photo-1503095396549-80705bc06179?auto=format&fit=crop&w=800&q=80', FALSE, NULL),
('reward-3', 'f7e6d5c4-3b2a-1f0e-9d8c-7b6a5f4e3d2c', 'Membresía MALBA (1 mes)', 'Acceso ilimitado por 1 mes y catálogo digital de exposiciones en el Museo de Arte Moderno.', 400, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', FALSE, NULL),
('reward-4', 'b0e2d1c0-3f4a-4b5c-8d9e-1f2a3b4c5d6e', 'Combo Pochoclos Grandes', 'Canjea por un combo grande de pochoclos y gaseosa en Cines del Centro.', 50, 'https://example.com/pochoclos.jpg', FALSE, NULL),
('reward-5', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Backstage Tour Teatral', 'Visita guiada al backstage del Teatro Municipal para 1 persona.', 300, 'https://example.com/backstage.jpg', FALSE, NULL);
