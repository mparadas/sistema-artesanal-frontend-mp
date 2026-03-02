#!/bin/bash

echo "🔧 DEPLOY AUTOMÁTICO A VERCEL - Fix Hamburguesa Icons"
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Verificando repositorio...${NC}"
git remote -v

echo ""
echo -e "${YELLOW}📂 Mostrando cambios a subir:${NC}"
git status --porcelain

echo ""
echo -e "${YELLOW}🍔 Archivos modificados para iconos de hamburguesa:${NC}"
echo "   ✅ src/pages/Catalogo.jsx"
echo "   ✅ src/pages/Productos.jsx" 
echo "   ✅ src/pages/ProductosDisponibles.jsx"
echo "   ✅ src/pages/ListaPrecios.jsx"
echo "   ✅ src/pages/Catalogo_Limpio.jsx"

echo ""
echo -e "${GREEN}🚀 Iniciando proceso de deploy...${NC}"

# Paso 1: Agregar archivos
echo -e "${YELLOW}1️⃣ Agregando archivos modificados...${NC}"
git add src/pages/Catalogo.jsx src/pages/Productos.jsx src/pages/ProductosDisponibles.jsx src/pages/ListaPrecios.jsx src/pages/Catalogo_Limpio.jsx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Archivos agregados correctamente${NC}"
else
    echo -e "${RED}   ❌ Error al agregar archivos${NC}"
    exit 1
fi

# Paso 2: Commit
echo ""
echo -e "${YELLOW}2️⃣ Creando commit...${NC}"
git commit -m "Fix hamburguesa icons - Priority fix for 🍔 display

- Move hamburguesa condition to top priority in obtenerIconoProducto
- Fix icon display for all hamburger products in catalog and products  
- Ensure 🍔 shows instead of 🥩 or 🐔 for hamburguesa products
- Apply fix to all components: Catalogo, Productos, ProductosDisponibles, ListaPrecios, Catalogo_Limpio

Fixes: Hamburguesa Pollo Con Tocipanceta, Hamburguesa De Pollo, Hamburguesa Clasica, Hamburguesa Chistorra"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Commit creado correctamente${NC}"
else
    echo -e "${RED}   ❌ Error al crear commit${NC}"
    exit 1
fi

# Paso 3: Push
echo ""
echo -e "${YELLOW}3️⃣ Enviando a GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Push exitoso a GitHub${NC}"
else
    echo -e "${RED}   ❌ Error al hacer push${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 ¡DEPLOY COMPLETADO!${NC}"
echo ""
echo -e "${YELLOW}🔄 Vercel detectará el cambio y hará deploy automático${NC}"
echo -e "${YELLOW}⏰ Tiempo de espera: 2-3 minutos${NC}"
echo ""
echo -e "${GREEN}🌐 URL para verificar:${NC}"
echo "   https://sistema-artesanal-frontend-mp.vercel.app"
echo ""
echo -e "${GREEN}🍔 Después del deploy, las hamburguesas mostrarán:${NC}"
echo "   Hamburguesa Clasica → 🍔"
echo "   Hamburguesa De Pollo → 🍔"  
echo "   Hamburguesa Chistorra → 🍔"
echo "   Hamburguesa Pollo Con Tocipanceta → 🍔"
echo ""
echo -e "${GREEN}✅ ¡Listo! Espera 2-3 minutos y recarga la página${NC}"

# Abrir URL automáticamente (opcional)
echo ""
echo -e "${YELLOW}🌐 Abriendo URL en 5 segundos...${NC}"
sleep 5
if command -v start &> /dev/null; then
    start https://sistema-artesanal-frontend-mp.vercel.app
elif command -v open &> /dev/null; then
    open https://sistema-artesanal-frontend-mp.vercel.app
fi
