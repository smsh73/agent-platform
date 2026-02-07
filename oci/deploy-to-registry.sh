#!/bin/bash

# Deploy Docker Image to OCI Container Registry
# This script builds the Docker image and pushes it to OCI Registry

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================"
echo "Deploy to OCI Container Registry"
echo "======================================${NC}"

# Configuration (edit these values)
REGION="ap-chuncheon-1"  # YNY region
TENANCY_NAMESPACE=""     # Will be fetched from OCI
REPO_NAME="agent-platform"
IMAGE_TAG="latest"

# Fetch tenancy namespace if not set
if [ -z "$TENANCY_NAMESPACE" ]; then
    echo -e "${YELLOW}Fetching tenancy namespace...${NC}"
    TENANCY_NAMESPACE=$(oci os ns get --query 'data' --raw-output 2>/dev/null || echo "")

    if [ -z "$TENANCY_NAMESPACE" ]; then
        echo -e "${RED}Failed to fetch tenancy namespace. Please ensure OCI CLI is configured.${NC}"
        echo "Run ./oci/setup-oci.sh first"
        exit 1
    fi
    echo -e "${GREEN}Tenancy Namespace: ${TENANCY_NAMESPACE}${NC}"
fi

REGISTRY_URL="${REGION}.ocir.io"
FULL_IMAGE_NAME="${REGISTRY_URL}/${TENANCY_NAMESPACE}/${REPO_NAME}:${IMAGE_TAG}"

echo ""
echo "Configuration:"
echo "  Region: ${REGION}"
echo "  Registry: ${REGISTRY_URL}"
echo "  Namespace: ${TENANCY_NAMESPACE}"
echo "  Repository: ${REPO_NAME}"
echo "  Tag: ${IMAGE_TAG}"
echo "  Full Image: ${FULL_IMAGE_NAME}"
echo ""

# Create repository if it doesn't exist
echo -e "${YELLOW}Creating repository in OCIR...${NC}"
oci artifacts container repository create \
    --compartment-id "$(oci iam compartment list --query 'data[0].id' --raw-output)" \
    --display-name "${REPO_NAME}" \
    --is-public false \
    2>/dev/null || echo "Repository already exists or creation skipped"

# Login to OCIR
echo -e "${YELLOW}Logging in to OCIR...${NC}"
echo "Please enter your OCI username (format: tenancy-name/username or tenancy-name/oracleidentitycloudservice/username):"
read -p "Username: " OCI_USERNAME

echo "Please enter your Auth Token (generate from OCI Console: Identity > Users > Auth Tokens):"
read -s AUTH_TOKEN
echo ""

echo "${AUTH_TOKEN}" | docker login "${REGISTRY_URL}" -u "${OCI_USERNAME}" --password-stdin

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker login failed. Please check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully logged in to OCIR${NC}"

# Build Docker image
echo ""
echo -e "${YELLOW}Building Docker image...${NC}"
cd "$(dirname "$0")/.."  # Go to project root

docker build -t "${REPO_NAME}:${IMAGE_TAG}" .

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker build failed.${NC}"
    exit 1
fi

echo -e "${GREEN}Docker build successful${NC}"

# Tag image
echo -e "${YELLOW}Tagging image...${NC}"
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${FULL_IMAGE_NAME}"

# Push image to OCIR
echo -e "${YELLOW}Pushing image to OCIR...${NC}"
docker push "${FULL_IMAGE_NAME}"

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker push failed.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}======================================"
echo "Deployment Successful!"
echo "======================================${NC}"
echo ""
echo "Image pushed to: ${FULL_IMAGE_NAME}"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database (see oci/setup-database.md)"
echo "2. Deploy to Container Instances (run ./oci/deploy-container.sh)"
echo ""
