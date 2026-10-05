import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number.parseInt(process.env.PORT || "3000", 10);
const maxPlayers = 24;
const allowedModes = new Set(["ffa", "survival", "waves", "territory"]);
const allowedMaps = new Set(["harbor", "fortress", "metro"]);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};
const rooms = new Map();
const socketServer = { clients: new Set() };
const maxWebSocketPayload = 8192;
const OPEN = 1;
const CLOSED = 3;
const allowedSkins = new Set(["ranger", "arctic", "crimson"]);

function send(socket, message) {
  if (socket.readyState === OPEN) socket.send(JSON.stringify(message));
}

function broadcast(room, message, except) {
  const payload = JSON.stringify(message);
  for (const client of room.clients) {
    if (client !== except && client.readyState === OPEN) client.send(payload);
  }
}

function removePlayer(socket) {
  const { room, playerId } = socket;
  if (!room || !playerId) return;
  room.players.delete(playerId);
  room.clients.delete(socket);
  broadcast(room, { type: "leave", id: playerId });
  if (room.clients.size === 0) rooms.delete(room.mode);
  socket.room = null;
  socket.playerId = null;
}

function isFiniteNumber(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function writeFrame(client, opcode, payload = Buffer.alloc(0)) {
  if (client.readyState !== OPEN) return;
  const length = payload.length;
  if (length > maxWebSocketPayload) return client.close(1009, "Message too large");
  const header = length < 126
    ? Buffer.from([0x80 | opcode, length])
    : Buffer.from([0x80 | opcode, 126, length >> 8, length & 0xff]);
  client.socket.write(Buffer.concat([header, payload]));
}

function createClient(socket) {
  const client = {
    socket,
    readyState: OPEN,
    isAlive: true,
    lastMessageAt: 0,
    buffer: Buffer.alloc(0),
    room: null,
    playerId: null,
    onMessage: null,
    onClose: null,
    send(message) { writeFrame(client, 1, Buffer.from(message)); },
    ping() { writeFrame(client, 9); },
    pong(payload) { writeFrame(client, 10, payload); },
    close(code = 1000, reason = "") {
      if (client.readyState === CLOSED) return;
      const reasonBytes = Buffer.from(String(reason).slice(0, 120));
      writeFrame(client, 8, Buffer.concat([Buffer.from([code >> 8, code & 0xff]), reasonBytes]));
      client.readyState = CLOSED;
      client.socket.end();
    },
    terminate() {
      if (client.readyState === CLOSED) return;
      client.readyState = CLOSED;
      client.socket.destroy();
    }
  };
  return client;
}

function receiveFrames(client, chunk) {
  client.buffer = Buffer.concat([client.buffer, chunk]);
  while (client.buffer.length >= 2) {
    const first = client.buffer[0];
    const second = client.buffer[1];
    const fin = (first & 0x80) !== 0;
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let offset = 2;
    if (!fin || !masked) return client.close(1002, "Unsupported frame");
    if (length === 126) {
      if (client.buffer.length < 4) return;
      length = client.buffer.readUInt16BE(2);
      offset = 4;
    } else if (length === 127) {
      if (client.buffer.length < 10) return;
      const high = client.buffer.readUInt32BE(2);
      length = client.buffer.readUInt32BE(6);
      if (high !== 0) return client.close(1009, "Message too large");
      offset = 10;
    }
    if (length > maxWebSocketPayload) return client.close(1009, "Message too large");
    const total = offset + 4 + length;
    if (client.buffer.length < total) return;
    const mask = client.buffer.subarray(offset, offset + 4);
    const payload = Buffer.from(client.buffer.subarray(offset + 4, total));
    for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4];
    client.buffer = client.buffer.subarray(total);
    if (opcode === 1) client.onMessage?.(payload);
    else if (opcode === 8) return client.close();
    else if (opcode === 9) client.pong(payload);
    else if (opcode === 10) client.isAlive = true;
    else return client.close(1003, "Unsupported data");
  }
}

function acceptWebSocket(request, socket, head) {
  const key = request.headers["sec-websocket-key"];
  if (typeof key !== "string" || request.headers["sec-websocket-version"] !== "13") return socket.destroy();
  const accept = createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const client = createClient(socket);
  socketServer.clients.add(client);
  socket.on("data", chunk => receiveFrames(client, chunk));
  socket.on("close", () => {
    client.readyState = CLOSED;
    socketServer.clients.delete(client);
    client.onClose?.();
  });
  socket.on("error", error => console.error("Multiplayer socket error:", error.message));
  configureClient(client);
  if (head.length) receiveFrames(client, head);
}

const httpServer = createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (requestUrl.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, rooms: rooms.size, players: [...rooms.values()].reduce((sum, room) => sum + room.clients.size, 0) }));
    return;
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  const relativePath = requestedPath === "/" ? "index.html" : requestedPath.slice(1);
  const filePath = resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(root + sep)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "x-content-type-options": "nosniff"
  });
  createReadStream(filePath).pipe(response);
});

httpServer.on("upgrade", (request, socket, head) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (requestUrl.pathname !== "/multiplayer") {
    socket.destroy();
    return;
  }
  const origin = request.headers.origin;
  if (origin) {
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch {
      socket.destroy();
      return;
    }
    if (originHost !== request.headers.host) {
      socket.destroy();
      return;
    }
  }
  acceptWebSocket(request, socket, head);
});

function configureClient(socket) {
  socket.isAlive = true;
  socket.lastMessageAt = 0;
  const joinTimeout = setTimeout(() => {
    if (!socket.playerId) socket.close(1008, "Join message required");
  }, 5000);

  socket.onMessage = raw => {
    const now = Date.now();
    if (now - socket.lastMessageAt < 12) {
      socket.close(1008, "Message rate exceeded");
      return;
    }
    socket.lastMessageAt = now;

    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      socket.close(1007, "Invalid JSON");
      return;
    }
    if (!message || typeof message !== "object" || Array.isArray(message)) {
      socket.close(1008, "Invalid message");
      return;
    }

    if (message.type === "join" && !socket.playerId) {
      if (!allowedModes.has(message.mode) || !allowedMaps.has(message.map || "harbor") || typeof message.name !== "string") {
        socket.close(1008, "Invalid room");
        return;
      }

      const name = message.name.trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 18) || "Ranger";
      let room = rooms.get(`${message.mode}:${message.map}`);
      if (!room) {
        room = { mode: message.mode, map: message.map || "harbor", clients: new Set(), players: new Map() };
        rooms.set(`${message.mode}:${message.map}`, room);
      }
      if (room.clients.size >= maxPlayers) {
        send(socket, { type: "error", message: "That room is full. Try again later." });
        socket.close(1008, "Room full");
        return;
      }

      clearTimeout(joinTimeout);
      const id = randomUUID();
      const team = room.players.size % 2 === 0 ? "blue" : "red";
      const skin = allowedSkins.has(message.skin) ? message.skin : "ranger";
      const player = { id, name, team, skin, x: 2100, y: 1600, angle: -Math.PI / 2, health: 100, weapon: "rifle", fireSeq: 0 };
      const existingPlayers = [...room.players.values()];
      room.clients.add(socket);
      room.players.set(id, player);
      socket.room = room;
      socket.playerId = id;
      send(socket, { type: "welcome", id, mode: room.mode, map: room.map, players: existingPlayers });
      broadcast(room, { type: "join", player }, socket);
      return;
    }

    const room = socket.room;
    const playerId = socket.playerId;
    if (!room || !playerId) {
      socket.close(1008, "Join first");
      return;
    }

    if (message.type === "state") {
      if (!isFiniteNumber(message.x, 0, 4200) || !isFiniteNumber(message.y, 0, 3200) ||
          !isFiniteNumber(message.angle, -1000, 1000) || !isFiniteNumber(message.health, 0, 100) ||
          typeof message.weapon !== "string" || !["rifle", "smg", "carbine", "pistol", "heavyPistol"].includes(message.weapon) ||
          !Number.isInteger(message.fireSeq) || message.fireSeq < 0) return;
      const player = room.players.get(playerId);
      Object.assign(player, {
        x: message.x,
        y: message.y,
        angle: message.angle,
        health: message.health,
        weapon: message.weapon,
        fireSeq: message.fireSeq,
        moving: Boolean(message.moving)
      });
      broadcast(room, { type: "state", player }, socket);
      return;
    }

    if (message.type === "hit") {
      if (typeof message.targetId !== "string" ||
          !isFiniteNumber(message.damage, 1, 45) ||
          !room.players.has(message.targetId) ||
          message.targetId === playerId) return;
      broadcast(room, {
        type: "hit",
        attackerId: playerId,
        targetId: message.targetId,
        damage: Math.round(message.damage)
      });
    }
  };

  socket.onClose = () => {
    clearTimeout(joinTimeout);
    removePlayer(socket);
  };
}

const heartbeat = setInterval(() => {
  for (const socket of socketServer.clients) {
    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, 30000);

httpServer.on("close", () => clearInterval(heartbeat));
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Outpost server listening on http://localhost:${port}`);
});
