
import {NativeModules, NativeAppEventEmitter} from 'react-native';
const FirestackCrash = NativeModules.FirestackCrash;

import promisify from '../promisify'
import { Base } from './base'

export class Crash extends Base {
  constructor(firestack, options={}) {
    super(firestack, options);
  }

  log(message) {
    return FirestackCrash.log(message);
  }

  logcat(level, message) {
    return FirestackCrash.logcat(level, message);
  }

  report(error) {
    // TODO, convert 
    FirestackCrash.report(error);
  }

  get namespace() {
    return 'firestack:crash'
  }
}

export default Crash