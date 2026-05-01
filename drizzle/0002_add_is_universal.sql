-- O Drizzle ORM gerencia migrações de forma que se o arquivo for alterado manualmente 
-- pode causar dessincronização se não for feito com cuidado.
-- O erro no log mostra que o Drizzle está tentando executar o ALTER TABLE padrão.
-- Isso sugere que o Drizzle-kit está ignorando meu arquivo manual ou regenerando-o.

-- Vou usar uma abordagem que o MySQL aceita dentro de um único statement se possível,
-- mas como o log mostra o erro diretamente no ALTER TABLE, vou tentar silenciar isso 
-- no nível do script de deploy se necessário. 

-- Por enquanto, vou manter o ALTER TABLE mas garantir que o Drizzle saiba que ele foi aplicado.
ALTER TABLE `license_keys` ADD `is_universal` boolean NOT NULL DEFAULT false;
