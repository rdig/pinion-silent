/**
 * @file IPFSNode It handles the pubsub subscriptions for us as well as
 * the room peer handling.
 */

import { cid } from 'is-ipfs';

import IPFS = require('ipfs');
import EventEmitter = require('events');
import PeerMonitor = require('ipfs-pubsub-peer-monitor');

interface Message<T, P> {
  type: T;
  // Can be a store address or an ipfs peer id
  to?: string;
  payload: P;
}

interface Options {
  repo?: string;
  privateKey?: string;
}

const { PINION_IPFS_CONFIG_FILE, NODE_ENV } = process.env;

const configFile =
  PINION_IPFS_CONFIG_FILE ||
  `${__dirname}/../ipfsConfig.${NODE_ENV || 'development'}.json`;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require(configFile);

class IPFSNode {
  private readonly events: EventEmitter;

  private readonly ipfs: IPFS;

  private readonly room: string;

  private readyPromise!: Promise<void>;

  private roomMonitor!: PeerMonitor;

  public id: string = '';

  constructor(
    events: EventEmitter,
    room: string,
    { repo, privateKey }: Options,
  ) {
    this.events = events;
    this.ipfs = new IPFS({
      repo,
      init: { privateKey },
      config,
      EXPERIMENTAL: { pubsub: true },
    });
    this.readyPromise = new Promise((resolve): void => {
      this.ipfs.on('ready', resolve);
    });
    this.room = room;
  }

  private handlePubsubMessage = (msg: IPFS.PubsubMessage): void => {
    if (!(msg && msg.from && msg.data)) {
      return;
    }

    // Don't handle messages from ourselves
    if (msg.from === this.id) return;
    this.events.emit('pubsub:message', msg);
  };

  private handleNewPeer = (peer: string): void => {
    this.events.emit('pubsub:newpeer', peer);
  };

  private handleLeavePeer = (peer: string): void => {
    this.events.emit('pubsub:peerleft', peer);
  };

  public getIPFS(): IPFS {
    return this.ipfs;
  }

  public async getId(): Promise<string> {
    const { id } = await this.ipfs.id();
    return id;
  }

  public async ready(): Promise<void> {
    if (this.ipfs.isOnline()) return;
    return this.readyPromise;
  }

  public async start(): Promise<void> {
    await this.ready();
    this.id = await this.getId();
    await this.ipfs.pubsub.subscribe(this.room, this.handlePubsubMessage);

    this.roomMonitor = new PeerMonitor(this.ipfs.pubsub, this.room);
    this.roomMonitor
      .on('join', this.handleNewPeer)
      .on('leave', this.handleLeavePeer);
  }

  public async stop(): Promise<void> {
    this.roomMonitor.stop();
    await this.ipfs.pubsub.unsubscribe(this.room, this.handlePubsubMessage);
    return this.ipfs.stop();
  }

  public publish<T, P>(message: Message<T, P>): Promise<void> {
    const msgString = JSON.stringify(message);
    return this.ipfs.pubsub.publish(this.room, Buffer.from(msgString));
  }

  public async pinHash(ipfsHash: string): Promise<void> {
    if (!cid(ipfsHash)) {
      return;
    }
    try {
      await this.ipfs.pin.add(ipfsHash);
    } catch (caughtError) {}
    this.events.emit('ipfs:pinned', ipfsHash);
  }
}

export default IPFSNode;
