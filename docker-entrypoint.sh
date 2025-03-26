#!/bin/bash
set -e

# Configurar variáveis de ambiente em runtime
echo "Configurando variáveis de ambiente..."
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-https://api.helps-platform.com}",
  REACT_APP_WS_URL: "${REACT_APP_WS_URL:-wss://api.helps-platform.com/ws}",
  REACT_APP_VERSION: "${REACT_APP_VERSION:-1.0.0}"
};
EOF

echo "Configuração de ambiente gerada."
exec nginx -g "daemon off;"