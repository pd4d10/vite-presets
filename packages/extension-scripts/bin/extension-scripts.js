#!/usr/bin/env node

const command = process.argv[2]

if (!command) {
  throw new Error('Command should be `start` or `build`')
}

switch (command) {
  case 'start':
    require('../lib/start')
    break
  case 'build':
    require('../lib/build')
    break
  case 'package':
    require('../lib/package')
    break
  default:
    throw new Error('Unknown command')
}
