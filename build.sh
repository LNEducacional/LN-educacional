#!/bin/bash
# build.sh

echo "🚀 Iniciando build do monorepo LN Educacional"

# Build do servidor
echo "📦 Building server..."
cd server
npm run build
cd ..

# Build do cliente
echo "📦 Building client..."
cd client
npm run build
cd ..

echo "✅ Build completo!"