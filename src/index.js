'use strict';

const Hapi = require('@hapi/hapi');
const { Gateway } = require('fabric-network');
const { getConnectionProfilePath, getWallet } = require ('./lib/utils');
const CONSTANTS = require('./constants');

const getConnectedGateway = async (org) => {
  const connectionProfilePath = getConnectionProfilePath(org);
  const wallet = getWallet(org);
  const gateway = new Gateway();

  await gateway.connect(
    connectionProfilePath,
    {
      wallet,
      identity: CONSTANTS.USER_APP,
      discovery: {
        enabled: true,
        asLocalhost: false,
      },
    }
  );

  return gateway;
};

const getContract = async (gateway, org, contractName) => {
  const network = await gateway.getNetwork(`${org}-channel`);
  return network.getContract(contractName);
};

const init = async () => {
  const server = Hapi.server({
      port: 3000,
      host: '0.0.0.0'
  });

  server.route({
    method: 'GET',
    path: '/channel',
    handler: async (request) => {
      return JSON.parse('[]');
    },
  });

  server.route({
    method: 'GET',
    path: '/share/{channel}/{shareKey?}',
    handler: async (request, h) => {
      const org = request.headers[CONSTANTS.HEADER_DIVVY_ORG];
      const gateway = await getConnectedGateway(org);
      const contract = await getContract(gateway, org, CONSTANTS.CONTRACT_SHARE);

      let response = null;

      if (request.params.shareKey) {
        await contract
          .evaluateTransaction(
            'queryShare',
            request.params.channel,
            request.params.shareKey
          )
          .then((result) => {
            response = h.response(JSON.parse(result.toString()));
          })
          .catch((err) => {
            response = h.response(err.message).code(500);
          });
      } else {
        await contract
          .evaluateTransaction(
            'queryAllShares',
            request.params.channel,
            org
          )
          .then((result) => {
            response = h.response(JSON.parse(result.toString()));
          })
          .catch((err) => {
            response = h.response(err.message).code(500);
          });
      }

      return response;
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
