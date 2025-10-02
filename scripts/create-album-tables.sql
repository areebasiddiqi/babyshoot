-- Albums table
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Album images junction table
CREATE TABLE album_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(album_id, image_id)
);

-- Album orders table
CREATE TABLE album_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shipping_name VARCHAR(255) NOT NULL,
  shipping_address TEXT NOT NULL,
  album_size VARCHAR(50) DEFAULT '8x10',
  cover_type VARCHAR(50) DEFAULT 'hardcover',
  base_price DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 9.99,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_albums_user_id ON albums(user_id);
CREATE INDEX idx_album_images_album_id ON album_images(album_id);
CREATE INDEX idx_album_orders_user_id ON album_orders(user_id);
