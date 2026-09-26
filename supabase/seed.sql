-- Mirrors web/src/data/mock.js. Session times are relative to now() so the demo always has upcoming sessions.

insert into courts (id, name, sport, lat, lng, price_per_hour) values
  ('c1', 'UBC Tennis Centre', 'tennis', 49.2622, -123.2453, 20),
  ('c2', 'Kitsilano Beach Park Courts', 'tennis', 49.2728, -123.1545, 0),
  ('c3', 'Stanley Park Tennis Courts', 'tennis', 49.2906, -123.1427, 0),
  ('c4', 'Queen Elizabeth Park Courts', 'tennis', 49.2420, -123.1140, 0),
  ('c5', 'UBC Birdcoop Gym', 'badminton', 49.2669, -123.2491, 5),
  ('c6', 'Hillcrest Community Centre', 'badminton', 49.2437, -123.1076, 6),
  ('c7', 'Richmond Olympic Oval', 'badminton', 49.1747, -123.1527, 8),
  ('c8', 'Kerrisdale Community Centre', 'badminton', 49.2340, -123.1560, 5),
  ('c9', 'Stage 18 Badminton Richmond', 'badminton', 49.197, -123.071, 20);

insert into users (id, name, sport, level) values
  ('u1', 'Mai', 'badminton', 'beginner'),
  ('u2', 'Lucas', 'tennis', 'intermediate'),
  ('u3', 'Priya', 'badminton', 'intermediate'),
  ('u4', 'Coach Linda', 'tennis', 'advanced'),
  ('u5', 'Kenji', 'badminton', 'advanced');

insert into sessions (id, host_id, court_id, sport, level, start_time, duration_min, capacity, price, is_coach, description) values
  ('s1', 'u3', 'c5', 'badminton', 'beginner', date_trunc('hour', now()) + interval '3 hours', 90, 4, 5, false, 'Chill beginner doubles, rackets provided!'),
  ('s2', 'u2', 'c2', 'tennis', 'intermediate', date_trunc('hour', now()) + interval '5 hours', 60, 2, 0, false, 'Looking for a hitting partner, rally + a few sets.'),
  ('s3', 'u4', 'c1', 'tennis', 'beginner', date_trunc('hour', now()) + interval '20 hours', 60, 6, 25, true, 'Group lesson: forehand, backhand and serve basics.'),
  ('s4', 'u5', 'c7', 'badminton', 'advanced', date_trunc('hour', now()) + interval '26 hours', 120, 4, 8, false, 'Competitive doubles, bring your own shuttles.'),
  ('s5', 'u1', 'c6', 'badminton', 'beginner', date_trunc('hour', now()) + interval '28 hours', 60, 4, 6, false, 'New to Vancouver, just want to play and meet people :)'),
  ('s6', 'u2', 'c3', 'tennis', 'advanced', date_trunc('hour', now()) + interval '44 hours', 90, 4, 0, false, 'Doubles by the seawall, NTRP 4.0+.'),
  ('s7', 'u3', 'c8', 'badminton', 'intermediate', date_trunc('hour', now()) + interval '50 hours', 90, 6, 5, false, 'Rotating doubles, all friendly.'),
  ('s8', 'u4', 'c4', 'tennis', 'intermediate', date_trunc('hour', now()) + interval '68 hours', 60, 4, 30, true, 'Drills + match play with a certified coach.');

insert into session_participants (session_id, user_id) values
  ('s1', 'u3'), ('s1', 'u5'),
  ('s2', 'u2'),
  ('s3', 'u4'), ('s3', 'u1'), ('s3', 'u2'),
  ('s4', 'u5'), ('s4', 'u3'), ('s4', 'u2'),
  ('s5', 'u1'),
  ('s6', 'u2'),
  ('s7', 'u3'),
  ('s8', 'u4');

insert into messages (session_id, user_id, text, created_at) values
  ('s1', 'u3', 'I booked court 2, see you all there!', now() - interval '2 hours'),
  ('s1', 'u5', 'Nice, I can bring extra shuttles.', now() - interval '1 hour');
