/**
 * @format
 */
import './shim.js';
require('crypto');
import 'react-native-reanimated';
import 'text-encoding-polyfill';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
