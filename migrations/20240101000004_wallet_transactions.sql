-- Migration: Create wallet transactions table
-- This creates a comprehensive wallet transaction system

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    type TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    description TEXT,
    payment_id TEXT,
    payment_order JSONB,
    fees JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add wallet_balance column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'wallet_balance') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);

-- Create function to increment wallet balance
CREATE OR REPLACE FUNCTION increment_wallet_balance(user_id UUID, amount DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance DECIMAL;
BEGIN
    -- Get current balance
    SELECT wallet_balance INTO current_balance 
    FROM profiles 
    WHERE id = user_id;
    
    -- Update balance
    UPDATE profiles 
    SET wallet_balance = COALESCE(current_balance, 0) + amount,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return new balance
    RETURN COALESCE(current_balance, 0) + amount;
END;
$$;

-- Create function to decrement wallet balance
CREATE OR REPLACE FUNCTION decrement_wallet_balance(user_id UUID, amount DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance DECIMAL;
    new_balance DECIMAL;
BEGIN
    -- Get current balance
    SELECT wallet_balance INTO current_balance 
    FROM profiles 
    WHERE id = user_id;
    
    -- Check if sufficient balance
    IF COALESCE(current_balance, 0) < amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
    
    -- Calculate new balance
    new_balance := COALESCE(current_balance, 0) - amount;
    
    -- Update balance
    UPDATE profiles 
    SET wallet_balance = new_balance,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return new balance
    RETURN new_balance;
END;
$$;

-- Create RLS policies for wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own transactions
DROP POLICY IF EXISTS "Users can create own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can create own wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own transactions
DROP POLICY IF EXISTS "Users can update own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can update own wallet transactions" ON public.wallet_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update all transactions
DROP POLICY IF EXISTS "Admins can update all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can update all wallet transactions" ON public.wallet_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for profiles wallet_balance
-- Policy: Users can view their own wallet balance
DROP POLICY IF EXISTS "Users can view own wallet balance" ON public.profiles;
CREATE POLICY "Users can view own wallet balance" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own wallet balance (for admin operations)
DROP POLICY IF EXISTS "Users can update own wallet balance" ON public.profiles;
CREATE POLICY "Users can update own wallet balance" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all wallet balances
DROP POLICY IF EXISTS "Admins can view all wallet balances" ON public.profiles;
CREATE POLICY "Admins can view all wallet balances" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update all wallet balances
DROP POLICY IF EXISTS "Admins can update all wallet balances" ON public.profiles;
CREATE POLICY "Admins can update all wallet balances" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_transactions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER trigger_wallet_transactions_updated_at
    BEFORE UPDATE ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_transactions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.wallet_transactions IS 'Wallet transactions for user payments and top-ups';
COMMENT ON COLUMN public.wallet_transactions.amount IS 'Base amount before fees';
COMMENT ON COLUMN public.wallet_transactions.total_amount IS 'Total amount including fees';
COMMENT ON COLUMN public.wallet_transactions.payment_order IS 'Payment gateway order details';
COMMENT ON COLUMN public.wallet_transactions.fees IS 'Breakdown of processing fees, GST, etc.';
COMMENT ON COLUMN public.wallet_transactions.metadata IS 'Additional transaction metadata';

COMMENT ON TABLE public.profiles IS 'User profiles with wallet balance';
COMMENT ON COLUMN public.profiles.wallet_balance IS 'Current wallet balance in INR';
