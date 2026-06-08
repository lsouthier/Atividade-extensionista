#!/usr/bin/env bash
set -euo pipefail

cd /opt/apps/acat

if [ $# -ne 1 ]; then
    echo "Uso: $0 <versao>"
    echo "Exemplo: $0 1.4.16"
    exit 1
fi

VERSAO="$1"

if ! echo "$VERSAO" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "Versão inválida: $VERSAO"
    echo "Use o formato x.y.z, exemplo: 1.4.16"
    exit 1
fi

echo "$VERSAO" > VERSION

cat > PetApp/Views/src/appVersion.ts <<EOF_VERSION
export const APP_VERSION = '$VERSAO';
export const APP_VERSION_LABEL = \`Versão \${APP_VERSION}\`;
EOF_VERSION

echo "Versão atualizada para $VERSAO"
echo
echo "Arquivos atualizados:"
echo "- VERSION"
echo "- PetApp/Views/src/appVersion.ts"
