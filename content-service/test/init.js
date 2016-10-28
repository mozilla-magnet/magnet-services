const spawn = require('child_process').spawn;
const waitForPostgres = require('../scripts/waitforpg');
const path = require('path');

function startServices() {
  return runCommand('docker-compose', ['up', '-d']);
}

function stopServices() {
  return runCommand('docker-compose', ['stop']);
}

function runMigrations() {
  return runCommand('db-migrate', ['up']);
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running '${command} ${args.join(" ")}'`);

    const process = spawn(command, args);
    process.on('exit', (code) => {

      if (code === 0) {
        console.log(`'${command} ${args.join(" ")}' ended`);
        resolve(code);
      } else {
        reject(new Error(`Failed to run '${command} ${args.join(" ")}' (${code})`));
      }
    });
  });
}

module.exports = {
  startServices,
  stopServices,
  waitForPostgres,
  runMigrations,
};
