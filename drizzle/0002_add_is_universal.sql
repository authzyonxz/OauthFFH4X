-- O driver mysql2 não suporta DELIMITER via execute(), 
-- então vamos usar uma estratégia de SQL puro que funciona em migrações.
-- Se a coluna já existir, o erro será capturado pelo migrador ou ignorado se possível.
-- No entanto, a melhor forma para Drizzle é garantir que o arquivo seja válido.

-- Para evitar o erro de 'Duplicate column', vamos usar este bloco:
SET @dbname = DATABASE();
SET @tablename = 'license_keys';
SET @columnname = 'is_universal';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE `license_keys` ADD `is_universal` boolean NOT NULL DEFAULT false'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
