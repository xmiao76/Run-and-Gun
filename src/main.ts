import { createGame } from './app/createGame';
import { installDebugBridge } from './debug/debugBridge';

installDebugBridge();

const parent = document.getElementById('game');
createGame(parent ?? undefined);
