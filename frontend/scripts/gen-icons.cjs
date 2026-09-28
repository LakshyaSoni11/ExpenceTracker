const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const SIZES = [192, 512, 180];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  // gradient top-left emerald -> bottom-right teal
  const c1 = [16, 185, 129];   // emerald-500
  const c2 = [13, 148, 136];   // teal-600
  const cx = size / 2;
  // draw a white wallet card at center
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const t = (x + y) / (2 * size);
      let r = lerp(c1[0], c2[0], t);
      let g = lerp(c1[1], c2[1], t);
      let b = lerp(c1[2], c2[2], t);
      let a = 255;
      // rounded-rect mask
      const radius = size * 0.18;
      const inset = size * 0.02;
      const rr = radius;
      const dx = Math.max(inset + rr - x, x - (size - inset - rr), 0);
      const dy = Math.max(inset + rr - y, y - (size - inset - rr), 0);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > rr) a = 0;

      // white wallet card (rounded rect) centered
      const cardW = size * 0.62, cardH = size * 0.44;
      const cardX0 = cx - cardW / 2, cardY0 = size * 0.28;
      const cardR = size * 0.08;
      const lax = Math.max(cardX0 + cardR - x, x - (cardX0 + cardW - cardR), 0);
      const lay = Math.max(cardY0 + cardR - y, y - (cardY0 + cardH - cardR), 0);
      const cardDist = Math.sqrt(lax * lax + lay * lay);
      if (cardDist <= cardR || (x >= cardX0 && x <= cardX0 + cardW && y >= cardY0 && y <= cardY0 + cardH)) {
        r = 255; g = 255; b = 255;
      }
      // emerald rupee-like circle in card center
      const coinR = size * 0.10;
      const coinX = cx, coinY = size * 0.5;
      const cd = Math.hypot(x - coinX, y - coinY);
      if (cd <= coinR) {
        r = lerp(c1[0], c2[0], t);
        g = lerp(c1[1], c2[1], t);
        b = lerp(c1[2], c2[2], t);
      }
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
    }
  }

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter type 0
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public");
for (const size of SIZES) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  fs.writeFileSync(path.join(outDir, name), drawIcon(size));
  console.log("wrote", name);
}