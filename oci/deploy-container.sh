#!/bin/bash

# Deploy to OCI Container Instances
# This script creates and deploys the application to OCI Container Instances

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================"
echo "Deploy to OCI Container Instances"
echo "======================================${NC}"

# Configuration
REGION="ap-chuncheon-1"
CONTAINER_NAME="agent-platform-app"
DISPLAY_NAME="agent-platform-container"
SHAPE="CI.Standard.E4.Flex"
OCPUS=1
MEMORY_GB=8

echo ""
echo "This script will create a Container Instance with:"
echo "  Shape: ${SHAPE}"
echo "  OCPUs: ${OCPUS}"
echo "  Memory: ${MEMORY_GB}GB"
echo ""

# Get compartment ID
echo -e "${YELLOW}Fetching compartment information...${NC}"
COMPARTMENT_ID=$(oci iam compartment list --query 'data[0].id' --raw-output)

if [ -z "$COMPARTMENT_ID" ]; then
    echo -e "${RED}Failed to get compartment ID. Please check OCI CLI configuration.${NC}"
    exit 1
fi

echo -e "${GREEN}Compartment ID: ${COMPARTMENT_ID}${NC}"

# Get VCN and Subnet
echo -e "${YELLOW}Fetching VCN and Subnet information...${NC}"

# List available VCNs
echo ""
echo "Available VCNs:"
oci network vcn list --compartment-id "$COMPARTMENT_ID" --query 'data[*].{Name:"display-name", ID:id}' --output table

echo ""
read -p "Enter VCN OCID (or press Enter to create new): " VCN_ID

# Create VCN if not provided
if [ -z "$VCN_ID" ]; then
    echo -e "${YELLOW}Creating new VCN...${NC}"

    VCN_RESPONSE=$(oci network vcn create \
        --compartment-id "$COMPARTMENT_ID" \
        --cidr-blocks '["10.0.0.0/16"]' \
        --display-name "agent-platform-vcn" \
        --dns-label "agentvcn" \
        --wait-for-state AVAILABLE \
        --query 'data.id' \
        --raw-output)

    VCN_ID=$VCN_RESPONSE
    echo -e "${GREEN}VCN created: ${VCN_ID}${NC}"

    # Create Internet Gateway
    echo -e "${YELLOW}Creating Internet Gateway...${NC}"
    IGW_ID=$(oci network internet-gateway create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --is-enabled true \
        --display-name "agent-platform-igw" \
        --wait-for-state AVAILABLE \
        --query 'data.id' \
        --raw-output)

    # Update default route table
    DEFAULT_RT_ID=$(oci network route-table list \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --query 'data[0].id' \
        --raw-output)

    oci network route-table update \
        --rt-id "$DEFAULT_RT_ID" \
        --route-rules "[{\"destination\": \"0.0.0.0/0\", \"networkEntityId\": \"$IGW_ID\"}]" \
        --force

    # Create subnet
    echo -e "${YELLOW}Creating Subnet...${NC}"
    SUBNET_ID=$(oci network subnet create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --cidr-block "10.0.1.0/24" \
        --display-name "agent-platform-subnet" \
        --dns-label "agentsubnet" \
        --wait-for-state AVAILABLE \
        --query 'data.id' \
        --raw-output)

    echo -e "${GREEN}Subnet created: ${SUBNET_ID}${NC}"
else
    # List available subnets in the VCN
    echo ""
    echo "Available Subnets:"
    oci network subnet list --compartment-id "$COMPARTMENT_ID" --vcn-id "$VCN_ID" \
        --query 'data[*].{Name:"display-name", ID:id}' --output table

    echo ""
    read -p "Enter Subnet OCID: " SUBNET_ID
fi

# Get tenancy namespace for image URL
TENANCY_NAMESPACE=$(oci os ns get --query 'data' --raw-output)
REGISTRY_URL="${REGION}.ocir.io"
IMAGE_URL="${REGISTRY_URL}/${TENANCY_NAMESPACE}/agent-platform:latest"

echo ""
echo -e "${YELLOW}Container Image: ${IMAGE_URL}${NC}"

# Get environment variables
echo ""
echo -e "${BLUE}======================================"
echo "Environment Variables Configuration"
echo "======================================${NC}"
echo ""
echo "Please provide the following environment variables:"
echo ""

read -p "DATABASE_URL (PostgreSQL connection string): " DATABASE_URL
read -p "NEXTAUTH_SECRET (random string for session encryption): " NEXTAUTH_SECRET
read -p "NEXTAUTH_URL (your app URL, e.g., https://your-domain.com): " NEXTAUTH_URL
read -p "OPENAI_API_KEY (optional, can be set in app settings): " OPENAI_API_KEY
read -p "ANTHROPIC_API_KEY (optional): " ANTHROPIC_API_KEY
read -p "GOOGLE_AI_API_KEY (optional): " GOOGLE_AI_API_KEY
read -p "PERPLEXITY_API_KEY (optional): " PERPLEXITY_API_KEY
read -p "ENCRYPTION_KEY (32-character string for API key encryption): " ENCRYPTION_KEY

# Create JSON for environment variables
ENV_VARS=$(cat <<EOF
{
  "DATABASE_URL": "${DATABASE_URL}",
  "NEXTAUTH_SECRET": "${NEXTAUTH_SECRET}",
  "NEXTAUTH_URL": "${NEXTAUTH_URL}",
  "NODE_ENV": "production"
EOF
)

if [ -n "$OPENAI_API_KEY" ]; then
    ENV_VARS="${ENV_VARS},\n  \"OPENAI_API_KEY\": \"${OPENAI_API_KEY}\""
fi
if [ -n "$ANTHROPIC_API_KEY" ]; then
    ENV_VARS="${ENV_VARS},\n  \"ANTHROPIC_API_KEY\": \"${ANTHROPIC_API_KEY}\""
fi
if [ -n "$GOOGLE_AI_API_KEY" ]; then
    ENV_VARS="${ENV_VARS},\n  \"GOOGLE_AI_API_KEY\": \"${GOOGLE_AI_API_KEY}\""
fi
if [ -n "$PERPLEXITY_API_KEY" ]; then
    ENV_VARS="${ENV_VARS},\n  \"PERPLEXITY_API_KEY\": \"${PERPLEXITY_API_KEY}\""
fi
if [ -n "$ENCRYPTION_KEY" ]; then
    ENV_VARS="${ENV_VARS},\n  \"ENCRYPTION_KEY\": \"${ENCRYPTION_KEY}\""
fi

ENV_VARS="${ENV_VARS}\n}"

# Save configuration to file for reference
CONFIG_FILE="./oci/container-config.json"
echo -e "${YELLOW}Saving configuration to ${CONFIG_FILE}${NC}"

cat > "$CONFIG_FILE" <<EOF
{
  "compartment-id": "${COMPARTMENT_ID}",
  "availability-domain": "$(oci iam availability-domain list --compartment-id "$COMPARTMENT_ID" --query 'data[0].name' --raw-output)",
  "shape": "${SHAPE}",
  "shape-config": {
    "ocpus": ${OCPUS},
    "memory-in-gbs": ${MEMORY_GB}
  },
  "containers": [
    {
      "display-name": "${CONTAINER_NAME}",
      "image-url": "${IMAGE_URL}",
      "environment-variables": $(echo -e "$ENV_VARS")
    }
  ],
  "vnics": [
    {
      "subnet-id": "${SUBNET_ID}",
      "is-public-ip-assigned": true
    }
  ],
  "display-name": "${DISPLAY_NAME}"
}
EOF

echo -e "${GREEN}Configuration saved${NC}"

# Create Container Instance
echo ""
echo -e "${YELLOW}Creating Container Instance...${NC}"
echo "This may take a few minutes..."

CONTAINER_INSTANCE_ID=$(oci container-instances container-instance create \
    --from-json "file://${CONFIG_FILE}" \
    --wait-for-state ACTIVE \
    --wait-for-state FAILED \
    --query 'data.id' \
    --raw-output)

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create Container Instance${NC}"
    exit 1
fi

echo -e "${GREEN}Container Instance created: ${CONTAINER_INSTANCE_ID}${NC}"

# Get public IP
echo -e "${YELLOW}Fetching public IP address...${NC}"
PUBLIC_IP=$(oci container-instances container-instance get \
    --container-instance-id "$CONTAINER_INSTANCE_ID" \
    --query 'data.vnics[0]."public-ip"' \
    --raw-output)

echo ""
echo -e "${GREEN}======================================"
echo "Deployment Successful!"
echo "======================================${NC}"
echo ""
echo "Container Instance ID: ${CONTAINER_INSTANCE_ID}"
echo "Public IP: ${PUBLIC_IP}"
echo "Application URL: http://${PUBLIC_IP}:3000"
echo ""
echo "Note: It may take 1-2 minutes for the application to start."
echo ""
echo "To check logs:"
echo "  oci logging-search search-logs --search-query \"search \\\"<compartment-id>\\\" | source='${CONTAINER_INSTANCE_ID}'\""
echo ""
echo "To update the container:"
echo "  1. Build and push new image: ./oci/deploy-to-registry.sh"
echo "  2. Delete old instance: oci container-instances container-instance delete --container-instance-id ${CONTAINER_INSTANCE_ID}"
echo "  3. Re-run this script"
echo ""
