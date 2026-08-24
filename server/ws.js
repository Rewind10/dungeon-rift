/* ws.js — WebSocket minimale (RFC 6455), zero dipendenze */
'use strict';
const crypto = require('crypto');
const { EventEmitter } = require('events');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
function accept(k) { return crypto.createHash('sha1').update(k + GUID).digest('base64'); }
class WSConn extends EventEmitter {
  constructor(s) { super(); this.socket = s; this.buf = Buffer.alloc(0); this.frags = []; this.fragOp = 0; this.closed = false; s.on('data', d => this._onData(d)); s.on('close', () => this._die()); s.on('error', () => this._die()); s.setTimeout(0); s.setNoDelay(true); }
  _die() { if (this.closed) return; this.closed = true; this.emit('close'); }
  _onData(d) { this.buf = Buffer.concat([this.buf, d]); while (true) { const f = this._parse(); if (!f) break; this._handle(f); } }
  _parse() {
    const b = this.buf; if (b.length < 2) return null;
    const fin = (b[0] & 0x80) !== 0, op = b[0] & 0x0f, masked = (b[1] & 0x80) !== 0; let len = b[1] & 0x7f, off = 2;
    if (len === 126) { if (b.length < off + 2) return null; len = b.readUInt16BE(off); off += 2; } else if (len === 127) { if (b.length < off + 8) return null; const hi = b.readUInt32BE(off), lo = b.readUInt32BE(off + 4); len = hi * 4294967296 + lo; off += 8; }
    let mask = null; if (masked) { if (b.length < off + 4) return null; mask = b.slice(off, off + 4); off += 4; }
    if (b.length < off + len) return null; let pl = b.slice(off, off + len);
    if (masked) { const o = Buffer.allocUnsafe(len); for (let i = 0; i < len; i++) o[i] = pl[i] ^ mask[i & 3]; pl = o; }
    this.buf = b.slice(off + len); return { fin, opcode: op, payload: pl };
  }
  _handle(f) { switch (f.opcode) { case 0x0: this.frags.push(f.payload); if (f.fin) this._deliver(); break; case 0x1: case 0x2: if (f.fin) { this.fragOp = f.opcode; this.frags = [f.payload]; this._deliver(); } else { this.fragOp = f.opcode; this.frags = [f.payload]; } break; case 0x8: this.close(); break; case 0x9: this._send(0xA, f.payload); break; case 0xA: this.emit('pong'); break; } }
  _deliver() { const d = Buffer.concat(this.frags); this.frags = []; if (this.fragOp === 0x1) this.emit('message', d.toString('utf8')); else this.emit('message', d); }
  _send(op, pl) { if (this.closed || this.socket.destroyed) return; const len = pl.length; let h; if (len < 126) { h = Buffer.allocUnsafe(2); h[1] = len; } else if (len < 65536) { h = Buffer.allocUnsafe(4); h[1] = 126; h.writeUInt16BE(len, 2); } else { h = Buffer.allocUnsafe(10); h[1] = 127; h.writeUInt32BE(Math.floor(len / 4294967296), 2); h.writeUInt32BE(len >>> 0, 6); } h[0] = 0x80 | op; try { this.socket.write(Buffer.concat([h, pl])); } catch (_) {} }
  send(str) { const pl = Buffer.isBuffer(str) ? str : Buffer.from(str, 'utf8'); this._send(Buffer.isBuffer(str) ? 0x2 : 0x1, pl); }
  close() { if (this.closed) return; try { this._send(0x8, Buffer.alloc(0)); } catch (_) {} try { this.socket.end(); } catch (_) {} this._die(); }
}
function attach(server, onConn) { server.on('upgrade', (req, socket) => { const key = req.headers['sec-websocket-key']; if (!key) { socket.destroy(); return; } socket.write(['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', 'Sec-WebSocket-Accept: ' + accept(key), '\r\n'].join('\r\n')); onConn(new WSConn(socket), req); }); }
module.exports = { attach, WSConn };
