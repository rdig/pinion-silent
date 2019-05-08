<div align="center">
  <img src="/docs/img/pinion_color.svg" width="600" "Pinion Logo" />
</div>
<div align="center">
  <a href="https://circleci.com/gh/JoinColony/pinion">
    <img src="https://circleci.com/gh/JoinColony/pinion.svg?style=shield"
    title="CircleCi"/>
  </a>
  <a href="https://renovatebot.com/">
    <img src="https://img.shields.io/badge/renovate-enabled-brightgreen.svg"
    title="Renovate enabled" />
  </a>
  <a href="https://gitter.im/JoinColony/pinion">
    <img src="https://img.shields.io/gitter/room/TechnologyAdvice/Stardust.svg" title="Join us on gitter" />
  </a>
  <a href="https://build.colony.io/">
    <img src="https://img.shields.io/discourse/https/build.colony.io/status.svg" title="Contribute!" />
  </a>
</div>

# Pinion

Pinion is a lightweight pinning service that supports both IPFS content and [orbit-db](https://github.com/orbitdb/orbit-db) stores. It relies solely on [ipfs-pubsub-peer-monitor](https://github.com/ipfs-shipyard/ipfs-pubsub-peer-monitor), [orbit-db](https://github.com/orbitdb/orbit-db), and [js-ipfs-http-client](https://github.com/ipfs/js-ipfs-http-client) to communicate with an IPFS node.

Pinion can:

- **Pin IPFS content**
- **Pin orbit-db store content**
- **Keep listening to updates from any given orbit-db store**

## Installation

To install pinion, run:

```bash
yarn add global @colony/pinion
```

or

```bash
npm i -g @colony/pinion
```

## Usage (for the impatient)

And then run pinion passing an IPFS node endpoint and a pinning room:

```bash
PINION_ROOM=YOUR_PINNING_ROOM pinion
```

In this configuration we're assuming some sensible defaults. See below.

## Custom configuration

Pinion can be configured by either passing in the configuration programatically to its constructor (with the only required value being the room, see defaults in the example):

```js
import Pinion from 'Pinion';

const pinner = new Pinion('YOUR_PINNING_ROOM', {
  ipfsDaemonURL: '/ip4/127.0.0.1/tcp/5001',
  maxOpenStores: 100,
  orbitDBDir: './orbitdb',
});
```

Or using environment variables when running it from the command line:

```bash
PINION_ROOM=YOUR_PINNING_ROOM PINION_IPFS_DAEMON_URL=/ip4/127.0.0.1/tcp/5001 PINION_MAX_OPEN_STORES=100 PINION_ORBIT_DB_DIR=./orbitdb pinion
```

#### `PINION_ROOM`

(required)

The IPFS pubsub room pinion is going to join and listen to new messages to.

#### `PINION_MAX_OPEN_STORES`

(optional)

You can also specify the limit of how many stores you wanna keep open simultaneously by passing in an environment variable `MAX_OPEN_STORES`. The stores will be automatically allocated using a LRU algorithm. The limit is by default set to 100 stores.

#### `PINION_IPFS_DAEMON_URL`

(optional)

You can specify the an IPFS node url of your preference. The default is `/ip4/127.0.0.1/tcp/5001`

#### `PINION_ORBIT_DB_DIR`

(optional)

You can specify the orbit-db path option so stores data are kept in the place of your preference. The default is `./orbitdb`

### Debug

Pinion is still on its infancy and you might need debug info or a more detailed output to figure out if it misbehaves. To run it on verbose/debug mode, please also set an environment var like so `DEBUG='pinner:*'`.

## API

### Requests

#### `PIN_STORE`

Opens a store, keeps listening to it for a pre-defined timeout and pin its content until the time is up or it's replicated.

##### Parameters

1.  `address` - An orbit-db-store address. Emits a `pinned` event passing the store address back.

##### Payload example

```js
 {
   type: 'PIN_STORE',
   payload: { address: '/orbitdb/Qma=/my-store' },
 };
```

---

#### `LOAD_STORE`

Opens a store, loads it and keep listening to it until it's being cleaned up by the LRU cache.

##### Parameters

1.  `address` - An orbit-db-store address. Emits a `loadedStore` event passing the store address back.

##### Payload example

```js
 {
   type: 'LOAD_STORE',
   payload: { address: '/orbitdb/Qma=/my-store' },
 };
```

---

#### `PIN_HASH`

Request the IPFS node to pin the content hash.

##### Parameters

1.  `ipfsHash` - An IPFS multihash. Emits a `pinnedHash` event passing the ipfs hash back.

##### Payload example

```js
 {
   type: 'PIN_HASH',
   payload: { ipfsHash: 'Qma=...' },
 };
```

---

#### Responses

##### `HAVE_HEADS`

Published when the pinner has opened a store and it's ready

##### Payload example

```js
 {
   type: 'HAVE_HEADS',
   to: '/orbitdb/Qma=/my-store',
   payload: {
     address: '/orbitdb/Qma=/my-store/<signature>',
     count: 100,
     timestamp: 10010203993
  },
 }
```

---

##### `ACK`

Published on every incoming message, acknowledging we got it with either the `ipfsHash` or the orbit-db store address

##### Payload example

```js
 {
   type: 'ACK',
   to: 'Qma=',
   payload: {
     sender: 'Qma=',
     actionType: 'PIN_STORE',
     address: '/orbitdb/Qma=/my-store',
     ipfsHash: 'Qma=...',
     timestamp: 10010203993
   },
 }
```

---

##### `REPLICATED`

Published after a store is fully replicated

##### Payload example

```js
 {
   type: 'REPLICATED',
   to: '/orbitdb/Qma=/my-store',
   payload: {
     address: '/orbitdb/Qma=/my-store',
     count: 100,
     timestamp: 10010203993
   },
 }
```

---

## Contributing

We welcome all contributions to Pinion. You can help by testing, suggesting new features, improving performance or documentation.

Please read our [Contributing Guidelines](https://github.com/JoinColony/pinion/blob/master/.github/CONTRIBUTING.md) for how to get started.

### To run the tests

Start an ipfs node on localhost on port 4001. You can use the commands provided in the package.json using either `yarn ipfsd-go` or `yarn ipfsd-js` (Docker has to be running on your system).

Then, in another terminal window do:

```
yarn test
```

## License

Pinion is [MIT licensed](LICENSE)
