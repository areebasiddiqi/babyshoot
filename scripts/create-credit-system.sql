-- Credit System Migration
-- Run this in your Supabase SQL Editor

-- Step 1: Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Step 2: Create credit_transactions table for tracking purchases and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
  description TEXT,
  stripe_payment_intent_id TEXT, -- For purchase transactions
  photoshoot_session_id UUID REFERENCES photoshoot_sessions(id), -- For usage transactions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create credit_packages table for different credit packages
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL, -- Price in cents (e.g., 1000 = $10.00)
  stripe_price_id TEXT NOT NULL, -- Stripe Price ID
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert default credit packages
INSERT INTO credit_packages (name, credits, price_cents, stripe_price_id, description) VALUES
('Starter Pack', 10, 999, 'price_starter_pack', '10 credits for $9.99 - Perfect for trying out our service'),
('Popular Pack', 25, 1999, 'price_popular_pack', '25 credits for $19.99 - Most popular choice'),
('Pro Pack', 50, 3499, 'price_pro_pack', '50 credits for $34.99 - Best value for regular users'),
('Ultimate Pack', 100, 5999, 'price_ultimate_pack', '100 credits for $59.99 - Maximum savings');

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Step 6: Create function to update user credits
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for updating timestamps
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits();

-- Step 8: Create function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(credits, 0) INTO balance
  FROM user_credits
  WHERE user_id = user_uuid;
  
  -- If no record exists, create one with 0 credits
  IF balance IS NULL THEN
    INSERT INTO user_credits (user_id, credits) VALUES (user_uuid, 0);
    balance := 0;
  END IF;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create function to add/subtract credits with transaction logging
CREATE OR REPLACE FUNCTION modify_user_credits(
  user_uuid UUID,
  credit_amount INTEGER,
  transaction_type TEXT,
  transaction_description TEXT DEFAULT NULL,
  stripe_payment_id TEXT DEFAULT NULL,
  session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT get_user_credit_balance(user_uuid) INTO current_balance;
  
  -- Calculate new balance
  new_balance := current_balance + credit_amount;
  
  -- Prevent negative balance for usage transactions
  IF transaction_type = 'usage' AND new_balance < 0 THEN
    RETURN FALSE; -- Insufficient credits
  END IF;
  
  -- Update user credits
  INSERT INTO user_credits (user_id, credits)
  VALUES (user_uuid, new_balance)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    credits = new_balance,
    updated_at = NOW();
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id, 
    type, 
    amount, 
    description, 
    stripe_payment_intent_id, 
    photoshoot_session_id
  ) VALUES (
    user_uuid,
    transaction_type,
    credit_amount,
    transaction_description,
    stripe_payment_id,
    session_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Add RLS (Row Level Security) policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Everyone can view active credit packages
CREATE POLICY "Anyone can view active packages" ON credit_packages
  FOR SELECT USING (is_active = true);

-- Step 11: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON credit_packages TO anon, authenticated;
GRANT SELECT ON user_credits TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;

-- Verify the setup
SELECT 'Credit system setup completed successfully!' as status;
