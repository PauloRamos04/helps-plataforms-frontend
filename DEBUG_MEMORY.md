# Debug de Memória - Documentação

## Visão Geral

A tela de Debug de Memória é uma funcionalidade exclusiva para administradores que permite monitorar e gerenciar o uso de memória da aplicação em tempo real. Esta ferramenta consome as APIs de debug do backend para fornecer informações detalhadas sobre o estado da memória.

## Funcionalidades

### 1. Monitoramento de Memória
- **Memória Heap**: Exibe uso atual, máximo e porcentagem de utilização
- **Memória Non-Heap**: Monitora memória fora do heap (metadados, classes, etc.)
- **Memória do Sistema**: Informações sobre memória total, livre e usada
- **Gráficos Visuais**: Barras de progresso coloridas indicando o status de uso

### 2. Informações do Sistema
- **Propriedades Java**: Versão, vendor, classpath, etc.
- **Propriedades do SO**: Sistema operacional, arquitetura, etc.
- **Recursos**: Número de processadores disponíveis
- **Uptime**: Tempo de funcionamento da aplicação

### 3. Ações de Gerenciamento
- **Limpeza Manual**: Força a execução do garbage collector
- **Atualização em Tempo Real**: Botão para recarregar dados
- **Confirmação de Segurança**: Diálogo de confirmação para ações críticas

## Acesso

### URL
```
/admin/debug
```

### Permissões
- Apenas usuários com role `ADMIN` podem acessar
- Protegido por `@PreAuthorize("hasRole('ADMIN')")` no backend

## APIs Consumidas

### 1. GET /api/memory/stats
Retorna estatísticas básicas de memória:
```json
{
  "timestamp": "2024-01-01T12:00:00",
  "heapUsedMB": 512.5,
  "heapMaxMB": 1024.0,
  "heapUsagePercentage": 50.0,
  "nonHeapUsedMB": 128.0,
  "nonHeapMaxMB": 256.0,
  "nonHeapUsagePercentage": 50.0,
  "uptimeSeconds": 3600
}
```

### 2. GET /api/memory/detailed
Retorna informações detalhadas do sistema:
```json
{
  "totalMemoryMB": 2048.0,
  "freeMemoryMB": 1024.0,
  "usedMemoryMB": 1024.0,
  "maxMemoryMB": 4096.0,
  "availableProcessors": 8,
  "java.version": "17.0.1",
  "os.name": "Linux",
  "os.arch": "x86_64"
}
```

### 3. POST /api/memory/cleanup
Força limpeza de memória:
```json
{
  "success": true,
  "message": "Limpeza de memória executada com sucesso"
}
```

## Componentes

### 1. MemoryDebug (Página Principal)
- Gerencia o estado da aplicação
- Coordena as chamadas para as APIs
- Renderiza a interface principal

### 2. MemoryChart
- Exibe gráficos de uso de memória
- Barras de progresso coloridas
- Resumo de estatísticas

### 3. MemoryCleanupDialog
- Diálogo de confirmação para limpeza
- Avisos de segurança
- Feedback visual durante execução

### 4. useMemoryDebug (Hook)
- Gerencia estado e operações
- Tratamento de erros
- Atualização automática de dados

## Indicadores Visuais

### Cores de Status
- **Verde** (Normal): < 50% de uso
- **Azul** (Moderado): 50-74% de uso
- **Laranja** (Alto): 75-89% de uso
- **Vermelho** (Crítico): ≥ 90% de uso

### Ícones
- ✅ Normal
- ℹ️ Moderado
- ⚠️ Alto
- ❌ Crítico

## Segurança

### Validações
- Verificação de role ADMIN no frontend
- Proteção por `@PreAuthorize` no backend
- Confirmação para ações críticas

### Logs
- Todas as operações são logadas no backend
- Auditoria de ações administrativas
- Rastreamento de limpezas de memória

## Uso Recomendado

### Monitoramento Regular
- Verificar uso de memória periodicamente
- Observar tendências de crescimento
- Identificar vazamentos de memória

### Limpeza de Memória
- Executar apenas quando necessário
- Monitorar impacto na performance
- Evitar limpezas frequentes

### Alertas
- Configurar alertas para uso > 75%
- Monitorar crescimento anormal
- Investigar picos de uso

## Troubleshooting

### Problemas Comuns
1. **Erro 403**: Usuário sem permissão de admin
2. **Erro 500**: Servidor indisponível ou erro interno
3. **Timeout**: Servidor sobrecarregado

### Soluções
1. Verificar permissões do usuário
2. Consultar logs do servidor
3. Aguardar e tentar novamente

## Desenvolvimento

### Estrutura de Arquivos
```
src/
├── pages/
│   └── MemoryDebug.js
├── components/
│   └── debug/
│       ├── MemoryChart.js
│       └── MemoryCleanupDialog.js
├── hooks/
│   └── useMemoryDebug.js
├── services/
│   └── memoryService.js
└── utils/
    └── memoryUtils.js
```

### Dependências
- Material-UI (MUI)
- React Router
- Axios para requisições HTTP

### Customização
- Cores e temas podem ser ajustados
- Novos indicadores podem ser adicionados
- APIs adicionais podem ser integradas
