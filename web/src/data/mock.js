// Same shape as the Supabase tables in supabase/schema.sql.
// Coordinates are approximate: verify them before the demo.

function hoursFromNow(hours) {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

export const courts = [
  { id: 'c1', name: 'UBC Tennis Centre', sport: 'tennis', lat: 49.2622, lng: -123.2453, price_per_hour: 20 },
  { id: 'c2', name: 'Kitsilano Beach Park Courts', sport: 'tennis', lat: 49.2728, lng: -123.1545, price_per_hour: 0 },
  { id: 'c3', name: 'Stanley Park Tennis Courts', sport: 'tennis', lat: 49.2906, lng: -123.1427, price_per_hour: 0 },
  { id: 'c4', name: 'Queen Elizabeth Park Courts', sport: 'tennis', lat: 49.242, lng: -123.114, price_per_hour: 0 },
  { id: 'c5', name: 'UBC Birdcoop Gym', sport: 'badminton', lat: 49.2669, lng: -123.2491, price_per_hour: 5 },
  { id: 'c6', name: 'Hillcrest Community Centre', sport: 'badminton', lat: 49.2437, lng: -123.1076, price_per_hour: 6 },
  { id: 'c7', name: 'Richmond Olympic Oval', sport: 'badminton', lat: 49.1747, lng: -123.1527, price_per_hour: 8 },
  { id: 'c8', name: 'Kerrisdale Community Centre', sport: 'badminton', lat: 49.234, lng: -123.156, price_per_hour: 5 },
  { id: 'c9', name: 'Trout Lake Community Centre', sport: 'badminton', lat: 49.255, lng: -123.061, price_per_hour: 5 },
  { id: 'c10', name: 'Strathcona Community Centre', sport: 'badminton', lat: 49.278, lng: -123.091, price_per_hour: 6 },
  { id: 'c11', name: 'Roundhouse Community Centre', sport: 'badminton', lat: 49.273, lng: -123.122, price_per_hour: 7 },
  { id: 'c12', name: 'Mount Pleasant Community Centre', sport: 'badminton', lat: 49.263, lng: -123.101, price_per_hour: 6 },
  { id: 'c13', name: 'Sunset Community Centre', sport: 'badminton', lat: 49.224, lng: -123.101, price_per_hour: 5 },
  { id: 'c14', name: 'Kitsilano Community Centre', sport: 'tennis', lat: 49.269, lng: -123.158, price_per_hour: 0 },
  { id: 'c15', name: 'Vancouver Racquets Club', sport: 'tennis', lat: 49.267, lng: -123.117, price_per_hour: 18 },
  { id: 'c16', name: 'Burnaby Lake Sports Complex', sport: 'tennis', lat: 49.241, lng: -122.976, price_per_hour: 10 },
  { id: 'c17', name: 'Bonsor Recreation Complex', sport: 'badminton', lat: 49.223, lng: -123.012, price_per_hour: 7 },
  { id: 'c18', name: 'Richmond Community Centre', sport: 'badminton', lat: 49.13, lng: -123.119, price_per_hour: 6 },
]

export const users = [
  { id: 'u1', name: 'Mai', sport: 'badminton', level: 'beginner' },
  { id: 'u2', name: 'Lucas', sport: 'tennis', level: 'intermediate' },
  { id: 'u3', name: 'Priya', sport: 'badminton', level: 'intermediate' },
  { id: 'u4', name: 'Coach Linda', sport: 'tennis', level: 'advanced' },
  { id: 'u5', name: 'Kenji', sport: 'badminton', level: 'advanced' },
]

export const sessions = [
  {
    id: 's1', host_id: 'u3', court_id: 'c5', sport: 'badminton', level: 'beginner',
    start_time: hoursFromNow(3), duration_min: 90, capacity: 4, price: 5, is_coach: false,
    description: 'Chill beginner doubles, rackets provided!',
  },
  {
    id: 's2', host_id: 'u2', court_id: 'c2', sport: 'tennis', level: 'intermediate',
    start_time: hoursFromNow(5), duration_min: 60, capacity: 2, price: 0, is_coach: false,
    description: 'Looking for a hitting partner, rally + a few sets.',
  },
  {
    id: 's3', host_id: 'u4', court_id: 'c1', sport: 'tennis', level: 'beginner',
    start_time: hoursFromNow(20), duration_min: 60, capacity: 6, price: 25, is_coach: true,
    description: 'Group lesson: forehand, backhand and serve basics.',
  },
  {
    id: 's4', host_id: 'u5', court_id: 'c7', sport: 'badminton', level: 'advanced',
    start_time: hoursFromNow(26), duration_min: 120, capacity: 4, price: 8, is_coach: false,
    description: 'Competitive doubles, bring your own shuttles.',
  },
  {
    id: 's5', host_id: 'u1', court_id: 'c6', sport: 'badminton', level: 'beginner',
    start_time: hoursFromNow(28), duration_min: 60, capacity: 4, price: 6, is_coach: false,
    description: 'New to Vancouver, just want to play and meet people :)',
  },
  {
    id: 's6', host_id: 'u2', court_id: 'c3', sport: 'tennis', level: 'advanced',
    start_time: hoursFromNow(44), duration_min: 90, capacity: 4, price: 0, is_coach: false,
    description: 'Doubles by the seawall, NTRP 4.0+.',
  },
  {
    id: 's7', host_id: 'u3', court_id: 'c8', sport: 'badminton', level: 'intermediate',
    start_time: hoursFromNow(50), duration_min: 90, capacity: 6, price: 5, is_coach: false,
    description: 'Rotating doubles, all friendly.',
  },
  {
    id: 's8', host_id: 'u4', court_id: 'c4', sport: 'tennis', level: 'intermediate',
    start_time: hoursFromNow(68), duration_min: 60, capacity: 4, price: 30, is_coach: true,
    description: 'Drills + match play with a certified coach.',
  },
  {
    id: 's9', host_id: 'u1', court_id: 'c9', sport: 'badminton', level: 'beginner',
    start_time: hoursFromNow(4), duration_min: 90, capacity: 6, price: 5, is_coach: false,
    description: 'Friendly doubles and a relaxed pace. Rackets available.',
  },
  {
    id: 's10', host_id: 'u3', court_id: 'c10', sport: 'badminton', level: 'intermediate',
    start_time: hoursFromNow(8), duration_min: 90, capacity: 4, price: 6, is_coach: false,
    description: 'Evening games, all welcome.',
  },
  {
    id: 's11', host_id: 'u5', court_id: 'c11', sport: 'badminton', level: 'beginner',
    start_time: hoursFromNow(12), duration_min: 60, capacity: 4, price: 7, is_coach: false,
    description: 'First-timers welcome. We can show you the basics.',
  },
  {
    id: 's12', host_id: 'u2', court_id: 'c12', sport: 'badminton', level: 'intermediate',
    start_time: hoursFromNow(16), duration_min: 90, capacity: 6, price: 6, is_coach: false,
    description: 'Rotating doubles near Main Street.',
  },
  {
    id: 's13', host_id: 'u1', court_id: 'c13', sport: 'badminton', level: 'beginner',
    start_time: hoursFromNow(22), duration_min: 60, capacity: 4, price: 5, is_coach: false,
    description: 'Easygoing game, bring indoor shoes.',
  },
  {
    id: 's14', host_id: 'u2', court_id: 'c14', sport: 'tennis', level: 'intermediate',
    start_time: hoursFromNow(24), duration_min: 60, capacity: 2, price: 0, is_coach: false,
    description: 'Casual rally at the courts by the beach.',
  },
  {
    id: 's15', host_id: 'u4', court_id: 'c15', sport: 'tennis', level: 'beginner',
    start_time: hoursFromNow(30), duration_min: 60, capacity: 5, price: 22, is_coach: true,
    description: 'Small group lesson covering the fundamentals.',
  },
  {
    id: 's16', host_id: 'u3', court_id: 'c16', sport: 'tennis', level: 'advanced',
    start_time: hoursFromNow(36), duration_min: 90, capacity: 4, price: 10, is_coach: false,
    description: 'Fast doubles session. Bring your own balls.',
  },
  {
    id: 's17', host_id: 'u5', court_id: 'c17', sport: 'badminton', level: 'intermediate',
    start_time: hoursFromNow(40), duration_min: 90, capacity: 6, price: 7, is_coach: false,
    description: 'Weekend doubles. Shuttles provided.',
  },
  {
    id: 's18', host_id: 'u1', court_id: 'c18', sport: 'badminton', level: 'beginner',
    start_time: hoursFromNow(48), duration_min: 60, capacity: 4, price: 6, is_coach: false,
    description: 'Meet new people and learn as you play.',
  },
]

export const sessionParticipants = [
  { session_id: 's1', user_id: 'u3' },
  { session_id: 's1', user_id: 'u5' },
  { session_id: 's2', user_id: 'u2' },
  { session_id: 's3', user_id: 'u4' },
  { session_id: 's3', user_id: 'u1' },
  { session_id: 's3', user_id: 'u2' },
  { session_id: 's4', user_id: 'u5' },
  { session_id: 's4', user_id: 'u3' },
  { session_id: 's4', user_id: 'u2' },
  { session_id: 's5', user_id: 'u1' },
  { session_id: 's6', user_id: 'u2' },
  { session_id: 's7', user_id: 'u3' },
  { session_id: 's8', user_id: 'u4' },
  { session_id: 's9', user_id: 'u1' },
  { session_id: 's9', user_id: 'u3' },
  { session_id: 's10', user_id: 'u3' },
  { session_id: 's10', user_id: 'u5' },
  { session_id: 's11', user_id: 'u5' },
  { session_id: 's12', user_id: 'u2' },
  { session_id: 's12', user_id: 'u3' },
  { session_id: 's13', user_id: 'u1' },
  { session_id: 's14', user_id: 'u2' },
  { session_id: 's15', user_id: 'u4' },
  { session_id: 's15', user_id: 'u1' },
  { session_id: 's16', user_id: 'u3' },
  { session_id: 's17', user_id: 'u5' },
  { session_id: 's17', user_id: 'u2' },
  { session_id: 's18', user_id: 'u1' },
]

export const messages = [
  { id: 'm1', session_id: 's1', user_id: 'u3', text: 'I booked court 2, see you all there!', created_at: hoursFromNow(-2) },
  { id: 'm2', session_id: 's1', user_id: 'u5', text: 'Nice, I can bring extra shuttles.', created_at: hoursFromNow(-1) },
]
