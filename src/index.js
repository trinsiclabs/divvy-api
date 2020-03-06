'use strict';

const Hapi = require('@hapi/hapi');
const { Gateway } = require('fabric-network');
const { getConnectionProfilePath, getWallet } = require ('./lib/utils');
const {
  CONTRACT_SHARE,
  HEADER_DIVVY_ORG,
  SERVER_HOST,
  SERVER_PORT,
  USER_ADMIN,
  USER_APP
} = require('./constants');

const getConnectedGateway = async (org, identity = null) => {
  const connectionProfilePath = getConnectionProfilePath(org);
  const wallet = getWallet(org);
  const gateway = new Gateway();

  await gateway.connect(
    connectionProfilePath,
    {
      wallet,
      identity: identity || USER_APP,
      discovery: {
        enabled: true,
        asLocalhost: false,
      },
    }
  );

  return gateway;
};

const getContract = async (gateway, org, contractName) => {
  const network = await gateway.getNetwork(`${org}`);
  return network.getContract(contractName);
};

const init = async () => {
  const server = Hapi.server({
      host: SERVER_HOST,
      port: SERVER_PORT,
  });

  server.route({
    method: 'GET',
    path: '/channels',
    handler: async (request, h) => {
      let response = null;

      const org = request.headers[HEADER_DIVVY_ORG];
      const gateway = await getConnectedGateway(org, USER_ADMIN);
      const client = gateway.getClient();

      const peers = client.getPeersForOrg();
      const result = [];

      for (let i = 0; i < peers.length; i += 1) {
        const data = await client.queryChannels(peers[i], true);

        for (let j = 0; j < data.channels.length; j += 1) {
          if (result.indexOf(data.channels[j].channel_id) === -1) {
            result.push(data.channels[j].channel_id);
          }
        }
      }

      response = h.response(result);

      return response;
    },
  });

  server.route({
    method: 'GET',
    path: '/shares/{channel}/{shareKey?}',
    handler: async (request, h) => {
      let response = null;

      const org = request.headers[HEADER_DIVVY_ORG];
      const gateway = await getConnectedGateway(org);
      const contract = await getContract(gateway, org, CONTRACT_SHARE);

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
