FROM hyperledger/fabric-ca:1.5.12

COPY fabric-ca-server-config.yaml /etc/hyperledger/fabric-ca-server/fabric-ca-server-config.yaml
COPY setup-ca.sh /setup-ca.sh

RUN chmod +x /setup-ca.sh

EXPOSE 7054

CMD ["/bin/bash", "-c", "/setup-ca.sh"]