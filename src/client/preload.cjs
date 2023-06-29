/* eslint-env node */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('_fs', require('fs'));
