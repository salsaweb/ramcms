#!/bin/bash

# =====================================================
# Enterprise CMS - Automated Setup Script
# =====================================================

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║   Enterprise CMS - Production Setup Script       ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# =====================================================
# Step 1: Check Prerequisites
# =====================================================

echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"

# =====================================================
# Step 2: Environment Configuration
# =====================================================

echo -e "${YELLOW}[2/7] Configuring environment...${NC}"

if [ ! -f .env.local ]; then
    echo -e "${BLUE}Creating .env.local file...${NC}"
    
    read -p "Enter Supabase URL: " SUPABASE_URL
    read -p "Enter Supabase Service Role Key: " SUPABASE_KEY
    read -p "Enter Application URL (default: http://localhost:3000): " APP_URL
    APP_URL=${APP_URL:-http://localhost:3000}
    
    # Generate NextAuth secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY

# NextAuth Configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=$APP_URL

# Environment
NODE_ENV=development
EOF
    
    echo -e "${GREEN}✓ Environment configuration created${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

# =====================================================
# Step 3: Install Dependencies
# =====================================================

echo -e "${YELLOW}[3/7] Installing dependencies...${NC}"

npm install

echo -e "${GREEN}✓ Dependencies installed${NC}"

# =====================================================
# Step 4: Database Setup
# =====================================================

echo -e "${YELLOW}[4/7] Setting up database...${NC}"

read -p "Do you want to run database migrations now? (y/n): " RUN_MIGRATIONS

if [ "$RUN_MIGRATIONS" = "y" ]; then
    read -p "Enter PostgreSQL connection string: " DATABASE_URL
    
    echo -e "${BLUE}Running migrations...${NC}"
    psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
    
    echo -e "${BLUE}Seeding initial data...${NC}"
    psql "$DATABASE_URL" -f database/seeds/001_initial_data.sql
    
    echo -e "${GREEN}✓ Database setup complete${NC}"
    echo -e "${YELLOW}Default admin credentials:${NC}"
    echo -e "  Email: admin@cms.local"
    echo -e "  Password: Admin@123"
    echo -e "${RED}IMPORTANT: Change these credentials immediately!${NC}"
else
    echo -e "${YELLOW}⚠ Skipping database setup${NC}"
    echo -e "Run manually with:"
    echo -e "  npm run db:migrate"
    echo -e "  npm run db:seed"
fi

# =====================================================
# Step 5: Security Checks
# =====================================================

echo -e "${YELLOW}[5/7] Running security checks...${NC}"

echo -e "${BLUE}Auditing dependencies...${NC}"
npm audit

echo -e "${GREEN}✓ Security audit complete${NC}"

# =====================================================
# Step 6: Build Check
# =====================================================

echo -e "${YELLOW}[6/7] Verifying build...${NC}"

npm run build

echo -e "${GREEN}✓ Build successful${NC}"

# =====================================================
# Step 7: Final Setup
# =====================================================

echo -e "${YELLOW}[7/7] Final setup...${NC}"

# Create .gitignore if not exists
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
.vercel
.netlify

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env
.env.production

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF
    echo -e "${GREEN}✓ .gitignore created${NC}"
fi

# =====================================================
# Setup Complete
# =====================================================

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║          Setup Complete Successfully! 🎉          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Start development server:"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo "2. Access the application:"
echo -e "   ${GREEN}$APP_URL${NC}"
echo ""
echo "3. Login with default credentials:"
echo -e "   Email: ${YELLOW}admin@cms.local${NC}"
echo -e "   Password: ${YELLOW}Admin@123${NC}"
echo ""
echo -e "${RED}CRITICAL: Change default admin password immediately!${NC}"
echo ""
echo "4. Review documentation:"
echo -e "   ${GREEN}README.md${NC} - Overview and usage"
echo -e "   ${GREEN}DEPLOYMENT.md${NC} - Production deployment guide"
echo -e "   ${GREEN}SECURITY.md${NC} - Security best practices"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"