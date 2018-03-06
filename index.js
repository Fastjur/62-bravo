const fs = require('mz/fs');
const http = require('http');
const {Readable} = require('stream');
const colors = require('colors/safe');

const frames = [];

// Setup frames in memory
fs.readdir('./frames').then(data => {
  data.forEach(async frame => {
    const f = await fs.readFile(`./frames/${frame}`);
    frames.push(f.toString());
  })
});

const colorsOptions = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'white'];
const numColors = colorsOptions.length;

const hackingInitiated = stream => {
  stream.push('\033[2J\033[H');
  stream.push(colors[colorsOptions[2]]('Hacking initiated\n'));
  const t1 = setTimeout(() => {
    stream.push('\033[2J\033[H');
    stream.push(colors[colorsOptions[2]]('Hacking initiated.\n'));
  }, 1000);
  const t2 = setTimeout(() => {
    stream.push('\033[2J\033[H');
    stream.push(colors[colorsOptions[2]]('Hacking initiated..\n'));
  }, 2000);
  const t3 = setTimeout(() => {
    stream.push('\033[2J\033[H');
    stream.push(colors[colorsOptions[2]]('Hacking initiated...\n'));
  }, 3000);
  return [t1,t2,t3];
}

const streamer = stream => {
  let index = 0;
  let lastColor = -1;
  let newColor = 0;
  return setInterval(() => {
    if (index >= frames.length) index = 0;
    stream.push('\033[2J\033[H');

    newColor = Math.floor(Math.random() * numColors);

    // Reroll for a new color if it was the same as last frame
    if(newColor == lastColor) {
      newColor += (1 + Math.floor(Math.random() * (numColors - 1)));
      newColor %= numColors;
    }

    lastColor = newColor;
    stream.push(colors[colorsOptions[newColor]](frames[index]));

    index++;
  }, 500);
}

const server = http.createServer((req, res) => {
  if (req.headers && req.headers['user-agent'] && !req.headers['user-agent'].includes('curl')) {
    res.writeHead(302, {'Location': 'https://github.com/Fastjur/62-bravo'});
    return res.end();
  }
  const stream = new Readable();
  stream._read = function noop () {};
  stream.pipe(res);
  const hacking = hackingInitiated(stream);

  let interval;
  const intervalTimeout = setTimeout(() => {
    interval = streamer(stream);
  }, 4000);

  req.on('close', () => {
    clearTimeout(intervalTimeout);
    clearTimeout(hacking[0]);
    clearTimeout(hacking[1]);
    clearTimeout(hacking[2]);
    clearInterval(interval);
    stream.destroy();
  });
});


const port = process.env.PARROT_PORT || 3000;
server.listen(port, err => {
  if (err) throw err;
  console.log(`Listening on locahost:${port}`);
});
