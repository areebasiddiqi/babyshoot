#!/bin/bash

# BabyShoot AI Deployment Script
echo "🚀 Deploying BabyShoot AI..."

# Check if required environment variables are set
check_env_vars() {
    local required_vars=(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        "CLERK_SECRET_KEY"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "ASTRIA_API_KEY"
        "STRIPE_SECRET_KEY"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Missing required environment variable: $var"
            exit 1
        fi
    done
    
    echo "✅ All required environment variables are set"
}

# Install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm ci
    echo "✅ Dependencies installed"
}

# Run type checking
type_check() {
    echo "🔍 Running type check..."
    npm run type-check
    if [ $? -ne 0 ]; then
        echo "❌ Type check failed"
        exit 1
    fi
    echo "✅ Type check passed"
}

# Run linting
lint_check() {
    echo "🧹 Running linter..."
    npm run lint
    if [ $? -ne 0 ]; then
        echo "❌ Linting failed"
        exit 1
    fi
    echo "✅ Linting passed"
}

# Build the application
build_app() {
    echo "🏗️ Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed"
        exit 1
    fi
    echo "✅ Build completed"
}

# Deploy to Vercel
deploy_vercel() {
    echo "🌐 Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🎉 Your BabyShoot AI app is now live!"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    
    check_env_vars
    install_deps
    type_check
    lint_check
    build_app
    deploy_vercel
    
    echo ""
    echo "🎊 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Set up your Supabase database using the schema.sql file"
    echo "2. Configure your Clerk webhooks"
    echo "3. Set up your Stripe webhooks"
    echo "4. Configure your Astria.ai webhooks"
    echo "5. Test the complete user flow"
    echo ""
    echo "Happy creating magical baby photos! ✨"
}

# Run the deployment
main
