#!/bin/bash

# OCI CLI Setup Script for Agent Platform
# This script helps configure OCI CLI and prepare for deployment

set -e

echo "======================================"
echo "OCI CLI Setup for Agent Platform"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if OCI CLI is installed
if ! command -v oci &> /dev/null; then
    echo -e "${RED}OCI CLI is not installed.${NC}"
    echo "Installing OCI CLI..."

    # Install for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
    else
        # Linux installation
        bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
    fi
else
    echo -e "${GREEN}OCI CLI is already installed.${NC}"
    oci --version
fi

# OCI Configuration
echo ""
echo "======================================"
echo "OCI Configuration"
echo "======================================"

# Check if config exists
if [ -f ~/.oci/config ]; then
    echo -e "${YELLOW}OCI config file already exists at ~/.oci/config${NC}"
    read -p "Do you want to reconfigure? (y/n): " reconfigure
    if [ "$reconfigure" != "y" ]; then
        echo "Skipping configuration."
        exit 0
    fi
fi

echo ""
echo "Please provide the following information:"
echo "Your Tenancy OCID: ocid1.tenancy.oc1..aaaaaaaaqqvkziyie25od72fkzlr2nscaeczaqpvpkcsmbmzlnlke3ljspxq"
echo "Your User: seungmin.lee@saltlux.com"
echo "Region: ap-chuncheon-1 (YNY)"
echo ""

# Run OCI setup
oci setup config

echo ""
echo -e "${GREEN}======================================"
echo "OCI Setup Complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Create API signing key (if not done during setup)"
echo "2. Upload public key to OCI Console: Identity & Security > Users > API Keys"
echo "3. Run ./oci/deploy-to-registry.sh to build and push Docker image"
echo ""
