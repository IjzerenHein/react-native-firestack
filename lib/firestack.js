/**
 * @providesModule Firestack
 * @flow
 */
import Log from './log'

const firebase = require('firebase');

const app = require('firebase/app');
const storage = require('firebase/storage');
const db = require('firebase/database');

import {NativeModules, NativeEventEmitter, AsyncStorage} from 'react-native';
// TODO: Break out modules into component pieces
// i.e. auth component, storage component, etc.
const FirestackModule = NativeModules.Firestack;
const FirestackModuleEvt = new NativeEventEmitter(FirestackModule);

import promisify from './promisify'
import Singleton from './singleton'

import RemoteConfig from './modules/remoteConfig'
import {Authentication} from './modules/authentication'
import {Database} from './modules/database'
import {Analytics} from './modules/analytics'
import {Storage} from './modules/storage'
import {Presence} from './modules/presence'
import {Crash} from './modules/crash'

let log;
export class Firestack extends Singleton {

  constructor(options) {
    super(options);

    this.options = options || {};
    this._debug = this.options.debug || false;
    log = this._log = new Log('firestack', this._debug);

    log.info('Creating new firestack instance');

    this._remoteConfig = this.options.remoteConfig || {};
    delete this.options.remoteConfig;

    this.configured = this.options.configure || false;
    this.auth = null;

    this.eventHandlers = {};

    log.info('Calling configure with options', this.options);
    this.configurePromise = this.configure(this.options);

    this._auth = new Authentication(this, this.options);
  }

  configure(opts={}) {
    if (!this.configurePromise) {
      const firestackOptions = Object.assign({}, this.options, opts);
      try {
        this.appInstance = app.initializeApp(firestackOptions);
        log.info('JS app initialized');
      } catch (e) {
        log.error('JS error while calling initializeApp', e);
      }

      log.info('Calling native configureWithOptions')
      this.configurePromise = promisify('configureWithOptions', FirestackModule)(firestackOptions)
      .then((configuredProperties) => {
        log.info('Native configureWithOptions success', configuredProperties);
        this.configured = true;
        this.firestackOptions = configuredProperties;
        return configuredProperties;
      }).catch((err) => {
        log.error('Native error occurred while calling configure', err);
      })
    }
    return this.configurePromise;
  }

  onReady(cb) {
    return this.configurePromise = this.configurePromise.then(cb);
  }

  /**
   * Wrappers
   * We add methods from each wrapper to this instance
   * when they are needed. Not sure if this is a good
   * idea or not (imperative vs. direct manipulation/proxy)
   */
  get auth() {
    if (!this._auth) { this._auth = new Authentication(this); }
    return this._auth;
  }
    // database
  get database() {
    if (!this._db) { this._db = new Database(this); }
    return this._db;
    // db.enableLogging(this._debug);
    // return this.appInstance.database();
  }

  // analytics
  get analytics() {
    if (!this._analytics) { this._analytics = new Analytics(this); }
    return this._analytics;
  }

  // storage
  get storage() {
    if (!this._storage) { this._storage = new Storage(this); }
    return this._storage;
  }

  // presence
  get presence() {
    if (!this._presence) { this._presence = new Presence(this); }
    return this._presence;
  }

  // crash
  get crash() {
    if (!this._crash) { this._crash = new Crash(this); }
    return this._crash;
  }

  // Storage
  //
  // /**
  //  * Configure the library to store the storage url
  //  * @param {string} url A string of your firebase storage url
  //  * @return {Promise}
  //  */
  // setStorageUrl(url) {
  //   return promisify('setStorageUrl')(url);
  // }



  // other
  get ServerValue() {
    return db.ServerValue;
  }

  /**
   * remote config
   */
  get remoteConfig() {
    if (!this.remoteConfig) {
      this.remoteConfig = new RemoteConfig(this._remoteConfig);
    }
    return this.remoteConfig;
  }

  /**
   * app instance
   **/
  get app() {
    return this.appInstance;
  }

  /**
   * Logger
   */
  get log() {
    return this._log;
  }

  /**
   * Redux store
   **/
  get store() {
    return this._store;
  }

  /**
   * Set the redux store helper
   */
  setStore(store) {
    if (store) {
      this.log.info('Setting the store for Firestack instance');
      this._store = store;
    }
  }

  /**
   * Global event handlers for the single Firestack instance
   */
  on(name, cb, nativeModule) {
    if (!this.eventHandlers[name]) {
      this.eventHandlers[name] = [];
    }
    if (!nativeModule) {
      nativeModule = FirestackModuleEvt;
    }
    const sub = nativeModule.addListener(name, cb);
    this.eventHandlers[name].push(sub);
    return sub;
  }

  off(name) {
    if (this.eventHandlers[name]) {
      this.eventHandlers[name]
        .forEach(subscription => subscription.remove());
    }
  }
}

export default Firestack
