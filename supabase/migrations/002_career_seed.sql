-- Initial career data. Only facts provided by Felipe; anything phrased beyond
-- the source is marked needs_review so it can be refined later.

insert into career.admins (email) values ('fleyva2302@gmail.com');

insert into career.settings (id, full_name, short_name, location_en, location_pt, email, linkedin_url, portfolio_url, default_paper)
values (
  1, 'Felipe Martelo Barbosa', 'Felipe Martelo',
  'São Paulo, SP, Brazil', 'São Paulo, SP, Brasil',
  'fleyva2302@gmail.com',
  'https://www.linkedin.com/in/felipemartelo',
  'https://felipemartelo.netlify.app/site/',
  'A4'
);

insert into career.tags (name_en, name_pt, category, aliases) values
  ('Game Design', 'Game Design', 'design', '{}'),
  ('Game Development', 'Desenvolvimento de Jogos', 'dev', '{Game Dev,GameDev,Professional Game Development}'),
  ('Game Systems', 'Sistemas de Jogo', 'design', '{Systems}'),
  ('Gameplay', 'Gameplay', 'design', '{}'),
  ('Level Design', 'Level Design', 'design', '{}'),
  ('Programming', 'Programação', 'dev', '{Coding}'),
  ('Unity', 'Unity', 'tool', '{}'),
  ('Godot', 'Godot', 'tool', '{}'),
  ('C#', 'C#', 'tool', '{}'),
  ('Python', 'Python', 'tool', '{}'),
  ('Figma', 'Figma', 'tool', '{}'),
  ('UX/UI', 'UX/UI', 'ux', '{UI/UX,UI UX Design}'),
  ('Interface Design', 'Design de Interfaces', 'ux', '{}'),
  ('Prototyping', 'Prototipagem', 'ux', '{}'),
  ('Interaction Design', 'Design de Interação', 'ux', '{}'),
  ('Visual Design', 'Design Visual', 'ux', '{}'),
  ('Game Interfaces', 'Interfaces de Jogos', 'ux', '{}'),
  ('2D', '2D', 'art', '{}'),
  ('3D', '3D', 'art', '{}'),
  ('Pixel Art', 'Pixel Art', 'art', '{}'),
  ('Game Art', 'Arte para Jogos', 'art', '{}'),
  ('Technical Art', 'Arte Técnica', 'art', '{}'),
  ('Tools', 'Ferramentas', 'dev', '{}'),
  ('Teaching', 'Ensino', 'edu', '{}'),
  ('Education', 'Educação', 'edu', '{}'),
  ('Higher Education', 'Ensino Superior', 'edu', '{}'),
  ('Project-Based Learning', 'Aprendizagem Baseada em Projetos', 'edu', '{}'),
  ('Curriculum', 'Currículo', 'edu', '{}'),
  ('Mentoring', 'Mentoria', 'edu', '{}'),
  ('Technology Education', 'Educação Tecnológica', 'edu', '{}'),
  ('Robotics', 'Robótica', 'domain', '{}'),
  ('Digital Games', 'Jogos Digitais', 'domain', '{}'),
  ('Roguelike', 'Roguelike', 'domain', '{}'),
  ('MMORPG', 'MMORPG', 'domain', '{}'),
  ('Interactive Experiences', 'Experiências Interativas', 'domain', '{}'),
  ('Leadership', 'Liderança', 'soft', '{}'),
  ('Project Management', 'Gestão de Projetos', 'soft', '{}'),
  ('Coordination', 'Coordenação', 'soft', '{}'),
  ('Customer Service', 'Atendimento ao Cliente', 'soft', '{}'),
  ('Communication', 'Comunicação', 'soft', '{}'),
  ('Problem Solving', 'Resolução de Problemas', 'soft', '{Technical Problem Solving}');

do $$
declare
  e_unnamed uuid;
  e_fecaf uuid;
  e_sg_coord uuid;
  e_sg_inst uuid;
  e_avenues uuid;
  e_sercom uuid;
  p_born uuid;
  pr uuid;
  nr constant jsonb := '{"en": "", "pt": "", "status": "needs_review"}';
begin
  -- Experiences -------------------------------------------------------------
  insert into career.experiences (company, role_en, role_pt, start_date, is_current, company_url,
    description_en, description_pt, focus_descriptions, priority, review_status, source, sort)
  values ('Unnamed Studios', 'Game Designer', 'Game Designer', '2024-03-01', true, 'https://unnamedstudios.co/',
    'Game Designer and Game Artist working on Born Again, a roguelike MMORPG, contributing to game development and the creation and refinement of gameplay-related content and visual assets.',
    'Game Designer e Game Artist em Born Again, um MMORPG roguelike, contribuindo com o desenvolvimento do jogo e com a criação e o refinamento de conteúdo de gameplay e assets visuais.',
    jsonb_build_object('game_design', nr, 'game_dev', nr, 'game_art', nr, 'pixel_art', nr, 'technical', nr),
    5, 'needs_review', 'Felipe, career spec (Oct 2026)', 10)
  returning id into e_unnamed;

  insert into career.experiences (company, role_en, role_pt, start_date, is_current, location, company_url,
    description_en, description_pt, focus_descriptions, priority, review_status, source, notes, sort)
  values ('UniFECAF', 'University Professor', 'Professor Universitário', '2024-08-01', true,
    'Taboão da Serra, SP, Brazil', 'https://www.unifecaf.com.br/',
    'University professor focused on Game Development, Game Design and digital production, teaching practical project-based courses involving game engines, programming, interface design and interactive experiences.',
    'Professor universitário com foco em Desenvolvimento de Jogos, Game Design e produção digital, lecionando disciplinas práticas baseadas em projetos que envolvem engines de jogos, programação, design de interfaces e experiências interativas.',
    jsonb_build_object(
      'game_dev', nr, 'game_design', nr, 'programming', nr,
      'ux_ui', jsonb_build_object(
        'en', 'University professor teaching UI/UX and interface design in the Agile Software Design course: low- and high-fidelity interfaces, prototyping in Figma, grids, alignment, navigation, visual consistency, components, plugins, moodboards, color styles and design adapted to software and client needs.',
        'pt', 'Professor universitário de UI/UX e design de interfaces na disciplina de Agile Software Design: interfaces de baixa e alta fidelidade, prototipagem no Figma, grids, alinhamento, navegação, consistência visual, componentes, plugins, moodboards, estilos de cor e design adaptado às necessidades do software e do cliente.',
        'status', 'ok'),
      'education', nr),
    5, 'needs_review', 'Felipe, career spec (Oct 2026)',
    'Agile Software Design is an interface design / UI-UX course. Do not describe it as generic Agile methodologies.', 20)
  returning id into e_fecaf;

  insert into career.experiences (company, group_key, role_en, role_pt, start_date, end_date, description_en, description_pt,
    focus_descriptions, priority, review_status, source, sort)
  values ('SuperGeeks', 'supergeeks', 'Pedagogical Coordinator', 'Coordenador Pedagógico', '2023-01-01', '2023-07-01',
    'Pedagogical coordinator at SuperGeeks, a programming and robotics school for children and teenagers.',
    'Coordenador pedagógico na SuperGeeks, escola de programação e robótica para crianças e adolescentes.',
    jsonb_build_object('education', nr, 'coordination', nr),
    3, 'needs_review', 'Felipe, career spec (Oct 2026)', 30)
  returning id into e_sg_coord;

  insert into career.experiences (company, group_key, role_en, role_pt, start_date, end_date, description_en, description_pt,
    focus_descriptions, priority, review_status, source, sort)
  values ('SuperGeeks', 'supergeeks', 'Game and Robotics Instructor', 'Instrutor de Games e Robótica', '2019-08-01', '2022-12-01',
    'Game and robotics instructor at SuperGeeks, a programming and robotics school for children and teenagers.',
    'Instrutor de games e robótica na SuperGeeks, escola de programação e robótica para crianças e adolescentes.',
    jsonb_build_object('game_dev', nr, 'programming', nr, 'education', nr),
    3, 'needs_review', 'Felipe, career spec (Oct 2026)', 40)
  returning id into e_sg_inst;

  insert into career.experiences (company, role_en, role_pt, start_date, end_date, location, company_url,
    description_en, description_pt, focus_descriptions, priority, review_status, source, sort)
  values ('Avenues The World School', 'Coding Teacher', 'Professor de Programação', '2023-01-01', '2023-07-01',
    'São Paulo, SP, Brazil', 'https://www.avenues.org/pt/sp/',
    'Coding teacher at Avenues The World School.',
    'Professor de programação na Avenues The World School.',
    jsonb_build_object('programming', nr, 'education', nr),
    2, 'needs_review', 'Felipe, career spec (Oct 2026)', 50)
  returning id into e_avenues;

  insert into career.experiences (company, role_en, role_pt, start_date, end_date,
    description_en, description_pt, priority, visibility, review_status, source, notes, sort)
  values ('Sercom Contact Center', 'Call Center Operator', 'Teleoperador', '2018-06-01', '2019-08-01',
    'Call center operator providing customer service by phone.',
    'Teleoperador em atendimento ao cliente por telefone.',
    1, 'manual_only', 'needs_review', 'Felipe, career spec (Oct 2026)',
    'Excluded from creative/technical resumes by default. Enable manually for complete employment history.', 60)
  returning id into e_sercom;

  -- Bullets (safe, derived only from the stated facts) ------------------------
  insert into career.experience_bullets (experience_id, text_en, text_pt, focus, sort) values
    (e_unnamed, 'Work as Game Designer and Game Artist on Born Again, a roguelike MMORPG available on Steam, iOS and Android.',
      'Atuo como Game Designer e Game Artist em Born Again, um MMORPG roguelike disponível na Steam, iOS e Android.', '{}', 1),
    (e_unnamed, 'Contribute to the creation and refinement of gameplay-related content.',
      'Contribuo com a criação e o refinamento de conteúdo de gameplay.', '{game_design,game_dev,technical}', 2),
    (e_unnamed, 'Create and refine visual assets for the game.',
      'Crio e refino assets visuais para o jogo.', '{game_art,pixel_art,technical}', 3),

    (e_fecaf, 'Teach Game Development and Game Design through practical, project-based courses.',
      'Leciono Desenvolvimento de Jogos e Game Design em disciplinas práticas baseadas em projetos.', '{}', 1),
    (e_fecaf, 'Teach game development with the Unity and Godot engines.',
      'Ensino desenvolvimento de jogos com as engines Unity e Godot.', '{game_dev,game_design,programming,technical,education}', 2),
    (e_fecaf, 'Teach UI/UX and interface design in the Agile Software Design course, from low- to high-fidelity prototypes in Figma.',
      'Leciono UI/UX e design de interfaces na disciplina de Agile Software Design, de protótipos de baixa a alta fidelidade no Figma.', '{ux_ui,education}', 3),
    (e_fecaf, 'Cover grids, alignment, navigation, visual consistency, components, moodboards and color styles, with design adapted to software and client needs.',
      'Abordo grids, alinhamento, navegação, consistência visual, componentes, moodboards e estilos de cor, com design adaptado às necessidades do software e do cliente.', '{ux_ui}', 4),

    (e_sg_coord, 'Coordinated pedagogical activities at a programming and robotics school for children and teenagers.',
      'Coordenei as atividades pedagógicas de uma escola de programação e robótica para crianças e adolescentes.', '{}', 1),
    (e_sg_coord, 'Worked on curriculum organization and coordination of the teaching team.',
      'Atuei na organização do currículo e na coordenação da equipe de ensino.', '{education,coordination}', 2),

    (e_sg_inst, 'Taught game development, programming and robotics to children and teenagers.',
      'Ensinei desenvolvimento de jogos, programação e robótica para crianças e adolescentes.', '{}', 1),
    (e_sg_inst, 'Mentored students through the creation of their own games.',
      'Orientei alunos na criação dos próprios jogos.', '{game_dev,game_design,education}', 2),

    (e_avenues, 'Taught coding classes at an international school.',
      'Lecionei aulas de programação em uma escola internacional.', '{}', 1),

    (e_sercom, 'Provided customer service by phone.',
      'Realizei atendimento ao cliente por telefone.', '{}', 1);

  -- Experience tags -----------------------------------------------------------
  insert into career.experience_tags (experience_id, tag_id)
  select e_unnamed, id from career.tags where name_en in
    ('Game Design', 'Game Development', 'Game Art', 'Pixel Art', 'Game Systems', 'Roguelike', 'MMORPG', '2D', 'Gameplay');
  insert into career.experience_tags (experience_id, tag_id)
  select e_fecaf, id from career.tags where name_en in
    ('Game Development', 'Game Design', 'Programming', 'Unity', 'Godot', 'Figma', 'UX/UI', 'Interface Design', 'Prototyping',
     'Higher Education', 'Teaching', 'Project-Based Learning', 'Digital Games', 'Interactive Experiences');
  insert into career.experience_tags (experience_id, tag_id)
  select e_sg_coord, id from career.tags where name_en in
    ('Education', 'Coordination', 'Curriculum', 'Leadership', 'Project Management', 'Teaching');
  insert into career.experience_tags (experience_id, tag_id)
  select e_sg_inst, id from career.tags where name_en in
    ('Game Development', 'Programming', 'Game Design', 'Teaching', 'Mentoring', 'Robotics', 'Education');
  insert into career.experience_tags (experience_id, tag_id)
  select e_avenues, id from career.tags where name_en in
    ('Programming', 'Education', 'Teaching', 'Game Development', 'Technology Education');
  insert into career.experience_tags (experience_id, tag_id)
  select e_sercom, id from career.tags where name_en in
    ('Customer Service', 'Communication', 'Problem Solving');

  -- Project -------------------------------------------------------------------
  insert into career.projects (name, role_en, role_pt, description_en, description_pt,
    resume_description_en, resume_description_pt, platforms, company, year, links, priority, review_status, sort)
  values ('Born Again', 'Game Designer & Game Artist', 'Game Designer e Game Artist',
    'Roguelike MMORPG with permadeath and pixel art, developed by Unnamed Studios.',
    'MMORPG roguelike com morte permanente e pixel art, desenvolvido pela Unnamed Studios.',
    'Roguelike MMORPG with pixel art, available on Steam, iOS and Android.',
    'MMORPG roguelike em pixel art, disponível na Steam, iOS e Android.',
    '{Steam,iOS,Android}', 'Unnamed Studios', 2023,
    '{"steam": "https://store.steampowered.com/app/2332210/Born_Again/"}', 5, 'needs_review', 10)
  returning id into p_born;

  insert into career.experience_projects values (e_unnamed, p_born);
  insert into career.project_tags (project_id, tag_id)
  select p_born, id from career.tags where name_en in
    ('Game Design', 'Game Development', 'Game Art', 'Pixel Art', 'Roguelike', 'MMORPG', '2D', 'Gameplay', 'Game Systems');

  -- Education -----------------------------------------------------------------
  insert into career.education (institution, degree_en, degree_pt, start_year, end_year, priority, review_status, notes, sort) values
    ('Universidade Anhembi Morumbi', 'Postgraduate Studies in Games', 'Pós-graduação em Games', 2020, 2021, 4, 'needs_review',
      'Confirm the exact title of the specialization.', 10),
    ('UNINOVE', 'Technologist Degree in Digital Games', 'Tecnólogo em Jogos Digitais', 2017, 2019, 4, 'ok', null, 20);

  -- Profiles ------------------------------------------------------------------
  insert into career.profiles (slug, name_en, name_pt, focus, headline_en, headline_pt, summary_en, summary_pt, default_template, review_status, sort)
  values ('game-designer', 'Game Designer', 'Game Designer', 'game_design',
    'Game Designer | Game Development | Interactive Experiences',
    'Game Designer | Desenvolvimento de Jogos | Experiências Interativas',
    'Game Designer and university professor with professional experience on Born Again, a roguelike MMORPG, and hands-on work across game design, game development and game art.',
    'Game Designer e professor universitário com experiência profissional em Born Again, um MMORPG roguelike, e atuação prática em game design, desenvolvimento de jogos e arte para jogos.',
    'ats', 'needs_review', 10)
  returning id into pr;
  insert into career.profile_tag_weights (profile_id, tag_id, weight)
  select pr, t.id, w.weight from (values
    ('Game Design', 5), ('Game Development', 5), ('Game Systems', 4), ('Gameplay', 4), ('Level Design', 3),
    ('Programming', 3), ('Unity', 3), ('Godot', 3), ('Prototyping', 3), ('Game Art', 2), ('Pixel Art', 2), ('2D', 2),
    ('Roguelike', 2), ('MMORPG', 2), ('UX/UI', 1)) w(name, weight)
  join career.tags t on t.name_en = w.name;
  insert into career.profile_experiences (profile_id, experience_id, include, rank) values
    (pr, e_unnamed, 'include', 1), (pr, e_fecaf, 'include', 2), (pr, e_sercom, 'exclude', 0);
  insert into career.profile_projects (profile_id, project_id, include, rank) values (pr, p_born, 'include', 1);

  insert into career.profiles (slug, name_en, name_pt, focus, headline_en, headline_pt, summary_en, summary_pt, default_template, review_status, sort)
  values ('game-developer', 'Game Developer', 'Desenvolvedor de Jogos', 'game_dev',
    'Game Developer | Game Design | Interactive Experiences',
    'Desenvolvedor de Jogos | Game Design | Experiências Interativas',
    'Game developer and university professor teaching Game Development with Unity and Godot, with professional experience on Born Again, a roguelike MMORPG, and several years teaching programming and game creation.',
    'Desenvolvedor de jogos e professor universitário de Desenvolvimento de Jogos com Unity e Godot, com experiência profissional em Born Again, um MMORPG roguelike, e anos de ensino de programação e criação de jogos.',
    'ats', 'needs_review', 20)
  returning id into pr;
  insert into career.profile_tag_weights (profile_id, tag_id, weight)
  select pr, t.id, w.weight from (values
    ('Game Development', 5), ('Programming', 5), ('Unity', 4), ('Godot', 4), ('Game Design', 4), ('Gameplay', 4),
    ('Game Systems', 4), ('Prototyping', 3), ('C#', 3), ('Python', 2), ('2D', 2), ('Pixel Art', 1)) w(name, weight)
  join career.tags t on t.name_en = w.name;
  insert into career.profile_experiences (profile_id, experience_id, include, rank) values
    (pr, e_fecaf, 'include', 1), (pr, e_unnamed, 'include', 2), (pr, e_sg_inst, 'include', 3), (pr, e_avenues, 'include', 4),
    (pr, e_sercom, 'exclude', 0);
  insert into career.profile_projects (profile_id, project_id, include, rank) values (pr, p_born, 'include', 1);

  insert into career.profiles (slug, name_en, name_pt, focus, headline_en, headline_pt, summary_en, summary_pt, default_template, review_status, sort)
  values ('game-artist', 'Game Artist / 2D Artist', 'Game Artist / Artista 2D', 'game_art',
    'Game Artist | 2D & Pixel Art', 'Game Artist | 2D e Pixel Art',
    'Game Artist with professional experience creating visual assets for Born Again, a pixel art roguelike MMORPG, and a background in digital games.',
    'Game Artist com experiência profissional na criação de assets visuais para Born Again, um MMORPG roguelike em pixel art, e formação em jogos digitais.',
    'creative', 'needs_review', 30)
  returning id into pr;
  insert into career.profile_tag_weights (profile_id, tag_id, weight)
  select pr, t.id, w.weight from (values
    ('Game Art', 5), ('Pixel Art', 5), ('2D', 5), ('Visual Design', 3), ('Game Design', 2), ('Game Development', 2),
    ('Roguelike', 1), ('MMORPG', 1)) w(name, weight)
  join career.tags t on t.name_en = w.name;
  insert into career.profile_experiences (profile_id, experience_id, include, rank) values
    (pr, e_unnamed, 'include', 1), (pr, e_sercom, 'exclude', 0);
  insert into career.profile_projects (profile_id, project_id, include, rank) values (pr, p_born, 'include', 1);

  insert into career.profiles (slug, name_en, name_pt, focus, headline_en, headline_pt, summary_en, summary_pt, default_template, review_status, sort)
  values ('3d-artist', '3D Artist / Modeling', 'Artista 3D / Modelagem', '3d',
    '3D Artist / 3D Generalist', 'Artista 3D / Generalista 3D', null, null, 'creative', 'needs_content', 40)
  returning id into pr;
  insert into career.profile_tag_weights (profile_id, tag_id, weight)
  select pr, t.id, w.weight from (values ('3D', 5), ('Game Art', 3), ('Technical Art', 2)) w(name, weight)
  join career.tags t on t.name_en = w.name;
  insert into career.profile_experiences (profile_id, experience_id, include, rank) values (pr, e_sercom, 'exclude', 0);

  insert into career.profiles (slug, name_en, name_pt, focus, headline_en, headline_pt, summary_en, summary_pt, default_template, review_status, sort)
  values ('technical-artist', 'Technical Artist', 'Technical Artist', 'technical',
    'Technical Artist | Game Development & 2D Art', 'Technical Artist | Desenvolvimento de Jogos e Arte 2D',
    'Game developer and artist combining game development, programming and 2D/pixel art, with professional experience on Born Again and teaching game engines such as Unity and Godot.',
    'Desenvolvedor de jogos e artista que une desenvolvimento de jogos, programação e arte 2D/pixel art, com experiência profissional em Born Again e no ensino de engines como Unity e Godot.',
    'ats', 'needs_review', 50)
  returning id into pr;
  insert into career.profile_tag_weights (profile_id, tag_id, weight)
  select pr, t.id, w.weight from (values
    ('Technical Art', 5), ('Game Development', 5), ('Game Art', 4), ('Programming', 4), ('2D', 4), ('Pixel Art', 4),
    ('Tools', 3), ('Unity', 3), ('Godot', 3), ('Problem Solving', 2)) w(name, weight)
  join career.tags t on t.name_en = w.name;
  insert into career.profile_experiences (profile_id, experience_id, include, rank) values
    (pr, e_unnamed, 'include', 1), (pr, e_fecaf, 'include', 2), (pr, e_sercom, 'exclude', 0);
  insert into career.profile_projects (profile_id, project_id, include, rank) values (pr, p_born, 'include', 1);

  insert into career.profiles (slug, name_en, name_pt, focus, headline_en, headline_pt, summary_en, summary_pt, default_template, review_status, sort)
  values ('ux-ui-designer', 'UX/UI Designer', 'Designer UX/UI', 'ux_ui',
    'UX/UI Designer | Interactive Experiences', 'Designer UX/UI | Experiências Interativas',
    'UX/UI designer and university professor teaching interface design, prototyping and Figma, with a background in game development and interactive experiences.',
    'Designer UX/UI e professor universitário de design de interfaces, prototipagem e Figma, com formação em desenvolvimento de jogos e experiências interativas.',
    'ats', 'needs_review', 60)
  returning id into pr;
  insert into career.profile_tag_weights (profile_id, tag_id, weight)
  select pr, t.id, w.weight from (values
    ('UX/UI', 5), ('Interface Design', 5), ('Figma', 5), ('Prototyping', 5), ('Interaction Design', 4), ('Visual Design', 4),
    ('Game Interfaces', 3), ('Interactive Experiences', 3), ('Game Design', 1)) w(name, weight)
  join career.tags t on t.name_en = w.name;
  insert into career.profile_experiences (profile_id, experience_id, include, rank) values
    (pr, e_fecaf, 'include', 1), (pr, e_sercom, 'exclude', 0);

  insert into career.profiles (slug, name_en, name_pt, focus, headline_en, headline_pt, summary_en, summary_pt, default_template, review_status, sort)
  values ('professor', 'University Professor / Game Development Educator', 'Professor Universitário / Educador em Desenvolvimento de Jogos', 'education',
    'University Professor | Game Development & Game Design', 'Professor Universitário | Desenvolvimento de Jogos e Game Design',
    'University professor of Game Development, Game Design and UI/UX, teaching programming, game creation and robotics since 2019 in higher education and schools.',
    'Professor universitário de Desenvolvimento de Jogos, Game Design e UI/UX, ensinando programação, criação de jogos e robótica desde 2019 no ensino superior e em escolas.',
    'academic', 'needs_review', 70)
  returning id into pr;
  insert into career.profile_tag_weights (profile_id, tag_id, weight)
  select pr, t.id, w.weight from (values
    ('Teaching', 5), ('Higher Education', 5), ('Education', 5), ('Game Development', 5), ('Game Design', 4),
    ('Project-Based Learning', 4), ('Curriculum', 4), ('Programming', 4), ('UX/UI', 3), ('Unity', 3), ('Godot', 3),
    ('Figma', 3), ('Mentoring', 3), ('Coordination', 3), ('Robotics', 2), ('Technology Education', 2)) w(name, weight)
  join career.tags t on t.name_en = w.name;
  insert into career.profile_experiences (profile_id, experience_id, include, rank) values
    (pr, e_fecaf, 'include', 1), (pr, e_sg_coord, 'include', 2), (pr, e_sg_inst, 'include', 3), (pr, e_avenues, 'include', 4),
    (pr, e_unnamed, 'include', 5), (pr, e_sercom, 'exclude', 0);
end;
$$;
