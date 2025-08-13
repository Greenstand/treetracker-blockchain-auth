#!/bin/bash

export FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca-client
export FABRIC_CA_CLIENT_TLS_CERTFILES=$FABRIC_CA_HOME/ca-cert.pem

mkdir -p $FABRIC_CA_HOME
mkdir -p $FABRIC_CA_CLIENT_HOME

fabric-ca-server init -b admin:adminpw
fabric-ca-server start &
sleep 5
fabric-ca-client enroll \
  -u https://admin:adminpw@localhost:7054 \
  --caname root-ca \
  -M $FABRIC_CA_CLIENT_HOME/msp \
  --tls.certfiles $FABRIC_CA_CLIENT_TLS_CERTFILES

# Register the greenstand-ca identity
fabric-ca-client register \
  --id.name greenstand-ca \
  --id.secret greenstandcapw \
  --id.type client \
  --id.attrs "hf.IntermediateCA=true" \
  --url https://localhost:7054

mkdir -p wallet
cat > wallet/admin.id << 'EOF'
{
  "credentials": {
    "certificate": "$(cat $FABRIC_CA_CLIENT_HOME/msp/signcerts/cert.pem | awk 1 ORS='\\n')",
    "privateKey": "$(find $FABRIC_CA_CLIENT_HOME/msp/keystore -type f -name "*_sk" -exec cat {} \; | awk 1 ORS='\\n')"
  },
  "mspId": "Org1MSP",
  "type": "X.509"
}
EOF

tail -f /dev/null
