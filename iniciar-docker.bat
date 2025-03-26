@echo off
echo Iniciando containers Docker para o ambiente de producao...
docker-compose -f docker-compose.prod.yml up -d
echo Containers iniciados! Pressione qualquer tecla para sair.
pause > nul