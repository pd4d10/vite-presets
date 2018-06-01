const fs = require('fs')
const { execSync } = require('child_process')

if (fs.existsSync('LICENSE')) {
  fs.copyFileSync('LICENSE', 'public/LICENSE')
}

const { version, name } = JSON.parse(fs.readFileSync('./package.json'))

execSync(`zip -r ${name}-${version}.zip ./public`) // TODO: Windows
