-- Check the structure of the profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Check if there are any existing policies on the profiles table
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';
