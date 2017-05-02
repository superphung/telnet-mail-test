# telnet-mail-test

## Install

```
$ npm install --save telnet-mail-test
```

## Usage

```js
const telnet = require('telnet-mail-test');

telnet({
  domain: 'gmail.com', 
  from: 'lolibar@gmail.com', 
  to: 'superphung@gmail.com', 
  timeout: 500
}).then(exist => {
    console.log(exist);
    /* true */
  });
```

## API

### telnet(options): Object

test mail.

#### options

Type: `object`

##### domain

Type: `string`

##### from

Type: `string`

##### to

Type: `string`

##### timeout

Type: `number`
Default: 3000 milliseconds
