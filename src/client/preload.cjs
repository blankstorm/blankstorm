/* eslint-env node */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('__fs', require('fs'));
