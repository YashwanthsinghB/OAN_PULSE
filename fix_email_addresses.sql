-- Fix email addresses to use hyphens instead of underscores
-- HTML5 email validation doesn't allow underscores in domain names

-- Update existing users
UPDATE oan_pulse_users 
SET email = 'admin@oan-pulse.com',
    updated_at = SYSTIMESTAMP
WHERE email = 'admin@oan_pulse.com';

UPDATE oan_pulse_users 
SET email = 'manager@oan-pulse.com',
    updated_at = SYSTIMESTAMP
WHERE email = 'manager@oan_pulse.com';

UPDATE oan_pulse_users 
SET email = 'employee@oan-pulse.com',
    updated_at = SYSTIMESTAMP
WHERE email = 'employee@oan_pulse.com';

COMMIT;

-- Verify the changes
SELECT user_id, email, first_name, last_name, role 
FROM oan_pulse_users 
ORDER BY user_id;

