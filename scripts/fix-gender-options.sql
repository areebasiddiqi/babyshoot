-- Fix gender options to match database constraint
-- The children table has: CHECK (gender IN ('boy', 'girl', 'other'))
-- But the app config was providing: ["Male", "Female", "Non-binary", "Prefer not to say"]

UPDATE app_config 
SET config_value = '{
   "hair_styles": [
     "Straight", "Wavy", "Curly", "Coily", "Short", "Long", "Medium",
     "Braided", "Ponytail", "Pigtails", "Bun", "Buzz Cut", "Bob Cut"
   ],
   "hair_colors": [
     "Black", "Brown", "Blonde", "Red", "Auburn", "Gray", "White",
     "Dark Brown", "Light Brown", "Dirty Blonde", "Strawberry Blonde",
     "Chestnut", "Platinum", "Silver", "Ginger"
   ],
   "eye_colors": [
     "Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Black",
     "Light Brown", "Dark Brown", "Blue-Green", "Blue-Gray", "Green-Gray"
   ],
   "skin_tones": [
     "Fair", "Light", "Medium", "Olive", "Tan", "Dark", "Deep",
     "Porcelain", "Ivory", "Beige", "Golden", "Bronze", "Ebony"
   ],
   "genders": [
     "Boy", "Girl", "Other"
   ],
   "relations": [
     "Parent", "Child", "Grandparent", "Grandchild", "Sibling", 
     "Spouse", "Partner", "Uncle", "Aunt", "Cousin", "Other"
   ]
}'::jsonb
WHERE config_key = 'profile_field_options';
