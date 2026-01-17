-- ============================================================================
-- Check What REST Endpoints Exist - Multiple Versions
-- ============================================================================

-- VERSION 1: Simple check
SELECT 
  name as module_name,
  uri_prefix,
  status
FROM user_ords_modules
WHERE UPPER(name) = 'AUTH';

-- VERSION 2: Show templates
SELECT 
  m.name as module,
  m.uri_prefix,
  t.uri_template,
  t.template_id
FROM user_ords_modules m
LEFT JOIN user_ords_templates t ON m.id = t.module_id
WHERE UPPER(m.name) = 'AUTH'
ORDER BY t.uri_template;

-- VERSION 3: Show handlers
SELECT 
  m.name as module,
  m.uri_prefix,
  t.uri_template,
  h.method,
  h.source_type,
  h.handler_id
FROM user_ords_modules m
LEFT JOIN user_ords_templates t ON m.id = t.module_id
LEFT JOIN user_ords_handlers h ON t.id = h.template_id
WHERE UPPER(m.name) = 'AUTH'
ORDER BY t.uri_template, h.method;

-- VERSION 4: Build full URLs
SELECT 
  'https://oracleapex.com/ords/oan_trial' || m.uri_prefix || t.uri_template as full_url,
  h.method,
  CASE 
    WHEN h.method IS NOT NULL THEN 'EXISTS'
    ELSE 'NO HANDLER'
  END as status
FROM user_ords_modules m
LEFT JOIN user_ords_templates t ON m.id = t.module_id
LEFT JOIN user_ords_handlers h ON t.id = h.template_id
WHERE UPPER(m.name) = 'AUTH'
ORDER BY full_url, h.method;

-- VERSION 5: Check what views are available
SELECT table_name 
FROM user_tables 
WHERE table_name LIKE '%ORDS%'
ORDER BY table_name;

-- VERSION 6: Alternative - check APEX dictionary
SELECT 
  workspace,
  module_name,
  template_uri,
  handler_method,
  handler_source
FROM apex_appl_restful_services
WHERE UPPER(module_name) = 'AUTH'
ORDER BY template_uri, handler_method;

