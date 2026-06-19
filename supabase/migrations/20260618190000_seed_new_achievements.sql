-- Insere novas conquistas (ignora se já existirem)
insert into public.achievements (key, name_key, description_key, icon, criteria)
values
  ('speed_demon_easy',  'achievements.speedDemonEasy.name',  'achievements.speedDemonEasy.description',   'zap',      '{"type": "win_time", "value": 30, "difficulty": "easy"}'),
  ('medium_win',        'achievements.mediumWin.name',        'achievements.mediumWin.description',         'star',     '{"type": "win_difficulty", "value": "medium"}'),
  ('win_50',            'achievements.win50.name',            'achievements.win50.description',              'map',      '{"type": "win_count", "value": 50}'),
  ('win_100',           'achievements.win100.name',           'achievements.win100.description',             'map',      '{"type": "win_count", "value": 100}'),
  ('speed_demon_medium','achievements.speedDemonMedium.name','achievements.speedDemonMedium.description',  'zap',      '{"type": "win_time", "value": 60, "difficulty": "medium"}'),
  ('speed_demon_hard',  'achievements.speedDemonHard.name',  'achievements.speedDemonHard.description',    'zap',      '{"type": "win_time", "value": 120, "difficulty": "hard"}'),
  ('level_25',          'achievements.level25.name',          'achievements.level25.description',           'level-up', '{"type": "level", "value": 25}')
on conflict (key) do nothing;
