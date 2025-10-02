-- Insert family-specific themes directly into the database
-- Run this in Supabase SQL Editor after applying the migration

INSERT INTO themes (name, description, prompt, category, session_type, is_active) VALUES
(
  'Holiday Magic',
  'Festive family moments with holiday decorations and warm lighting',
  'Professional family holiday portrait, festive decorations, warm golden lighting, cozy winter atmosphere, Christmas tree background, elegant holiday outfits, joyful expressions, family gathered together',
  'holiday',
  'family',
  true
),
(
  'Beach Vacation',
  'Relaxed family beach portraits with ocean backdrop',
  'Family beach portrait, golden hour lighting, ocean waves in background, casual beach attire, natural windswept hair, genuine laughter, sandy beach setting, sunset colors',
  'outdoor',
  'family',
  true
),
(
  'Formal Family Portrait',
  'Classic elegant family portraits in formal attire',
  'Formal family portrait, studio lighting, elegant formal attire, classic poses, sophisticated backdrop, professional composition, timeless style, refined expressions',
  'formal',
  'family',
  true
),
(
  'Casual Home Life',
  'Natural family moments in comfortable home setting',
  'Casual family portrait at home, natural lighting, comfortable everyday clothes, genuine interactions, cozy living room setting, authentic family moments, relaxed poses',
  'lifestyle',
  'family',
  true
),
(
  'Garden Party',
  'Elegant outdoor family gathering in beautiful garden',
  'Family garden party portrait, lush green garden background, soft natural lighting, spring/summer atmosphere, elegant casual attire, blooming flowers, outdoor celebration vibes',
  'outdoor',
  'family',
  true
),
(
  'Autumn Harvest',
  'Warm family portraits with fall colors and seasonal elements',
  'Family autumn portrait, fall foliage background, warm orange and red colors, cozy sweaters, pumpkins and harvest elements, golden hour lighting, seasonal family gathering',
  'seasonal',
  'family',
  true
),
(
  'Sports Family',
  'Active family portraits with sports and recreation theme',
  'Active family portrait, sports equipment, athletic wear, outdoor field or court setting, dynamic poses, team spirit, healthy lifestyle theme, energetic expressions',
  'sports',
  'family',
  true
),
(
  'Vintage Classic',
  'Timeless family portraits with vintage styling',
  'Vintage style family portrait, classic 1950s aesthetic, retro clothing, sepia tones, old-fashioned props, timeless composition, nostalgic atmosphere, elegant vintage styling',
  'vintage',
  'family',
  true
),
(
  'Adventure Family',
  'Outdoor adventure family portraits in natural settings',
  'Adventure family portrait, hiking trail or mountain background, outdoor gear, natural wilderness setting, family bonding in nature, rugged landscape, adventure spirit',
  'adventure',
  'family',
  true
),
(
  'Cozy Winter',
  'Warm indoor family portraits with winter comfort theme',
  'Cozy winter family portrait, fireplace background, warm blankets, hot cocoa, comfortable winter clothing, indoor warmth, family snuggled together, soft lighting',
  'seasonal',
  'family',
  true
);

-- Verify the themes were inserted
SELECT name, category, session_type FROM themes WHERE session_type = 'family' ORDER BY name;
