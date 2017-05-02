import { spawn } from 'child_process';
import {resolveMx} from 'dns';

interface TelnetOptions {
  domain: string,
  from: string,
  to: string,
  timeout?: number
}

module.exports = function ({domain, from, to, timeout = 3000}: TelnetOptions): Promise<any> {
  return new Promise(function (resolve, reject) {

    resolveMx(domain, function (err, servers) {
      if (err) {
        return reject(err);
      }
      if (servers.length === 0) {
        return reject({message: 'no mail exchanger'});
      }
      const server = servers[0].exchange;
      const commands = getCommands(from, to);
      let currentCmd = 0;

      const telnet = spawn('telnet', [server, '25'], {shell: true})
      setTimeout(() => {
        reject({message: 'timeout'})
        telnet.kill('SIGHUP');
      }, timeout);
      telnet.stdout.on('data', data => {
        console.log(`${data}`);
        const res = `${data}`; 
        const cmd = commands[currentCmd];
        if (currentCmd === commands.length) {
          telnet.stdin.write('quit\n');
          return res.includes('250') ? resolve(true) : resolve(false);
        }
        if (res.includes(cmd.pattern)) {
          telnet.stdin.write(cmd.reply);
          console.log(cmd.reply);
          currentCmd += 1;
        }        
      });
      telnet.stderr.on('data', data => console.log('stderr', `${data}`));
      telnet.stdin.on('error', reject);
      telnet.on('error', reject);
    });
  });
}

function getCommands(from: string, to: string) {
  return [
    {pattern: '220', reply: 'helo hi\n'},
    {pattern: '250', reply: `mail from: <${from}>\n`},
    {pattern: '250', reply: `rcpt to: <${to}>\n`}
  ];
}