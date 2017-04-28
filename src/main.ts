import { spawn } from 'child_process';

interface SmtpServer {
  name?: string
  message?: string
}

interface TelnetOptions {
  domain: string,
  from: string,
  to: string,
  timeout?: number
}

module.exports = function ({domain, from, to, timeout = 3000}: TelnetOptions): Promise<any> {
  return new Promise(function (resolve, reject) {
    const lookup = spawn('nslookup', ['-type=mx', domain], {shell: true});
    const commands = getCommands(from, to);
    let currentCmd = 0;

    lookup.stdout.on('data', (data: Object) => {
      const domain = getSmtpserver(`${data}`);
      if (!domain.name) {
        return reject(domain);
      }
      const telnet = spawn('telnet', [domain.name, '25'], {shell: true})
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
      telnet.stderr.on('data', data => console.log('lol', `${data}`));
      telnet.stdin.on('error', reject);
      telnet.on('error', reject);
    });
    lookup.on('error', reject);
  });
}

function getCommands(from: string, to: string) {
  return [
    {pattern: '220', reply: 'helo hi\n'},
    {pattern: '250', reply: `mail from: <${from}>\n`},
    {pattern: '250', reply: `rcpt to: <${to}>\n`}
  ];
}

function getSmtpserver(data: string): SmtpServer {
  if (data.includes('No answer') || data.includes('server can\'t find')) {
    return {
      message: data
    }; 
  }
  const splited = data.split('\n');
  const index = splited.findIndex(r => r.includes('exchanger'));
  const server = splited[index].split(' ');
  const last = server[server.length - 1];
  return {
    name: last.substring(0, last.length - 1)
  };
}