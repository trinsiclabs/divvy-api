# Divvy API

RESTful service which connects the client app to the network.

The API component has three functions:

1. Identity generation
2. Querying the ledger
3. Updating the ledger

The API uses the
[Fabric Node SDK](https://hyperledger.github.io/fabric-sdk-node/release-1.4/index.html)

## Identity generation and wallets

In order to query or update the ledger, the user needs a private / public
key pair, generated by their organisations CA. Each users key pair is
stored in their organisations wallet. Wallets don't store tokens
of any sort, the only store identities.

## Getting started

Make sure you have set up the host VM as described in the
[platform docs](https://github.com/flashbackzoo/divvy).

Login to the host VM and install the API dependencies:

```
$ vagrant ssh
$ cd src
$ npm install
```

Now start the API container:

```
$ cd /home/vagrant/api
$ sudo docker-compose up -d
```

You're done! The network and application components can now use the API.

## Headless mode

Normally the network and application components communicate with the API on
your behalf, so there's no need to interact with the API directly.

During development it can be useful to run commands directly on the API,
so here's how.

### Creating identities

Admin identities are generated automatically when organisations are created,
so you can probably skip this step. But if you're doing something weird, you
might need to create one or regenerate an existing one.

From the host VM:

```
$ docker exec api.divvy.com node ./lib/security.js enrolladmin <org>
```

Generate a user identity:

```
$ docker exec api.divvy.com node ./lib/security.js registeruser <org> <user>
```

### Querying the ledger

From the host VM:

```
$ docker exec api.divvy.com node ./lib/query.js \
    -o <org> \
    -u <user> \
    -c <org>-channel \
    -n share \
    -m queryShare \
    -a '["<org>","1"]'
```
