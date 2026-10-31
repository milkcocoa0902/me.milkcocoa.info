import { Server }  from "socket.io";
import chokidar from 'chokidar';
import { fileURLToPath } from 'node:url';
console.log(process.cwd())
const watcher = chokidar.watch(fileURLToPath(new URL('../../articles/', import.meta.url)));
const io = new Server(35413, {
  cors: {
    origin: "http://localhost:3000",
    allowedHeaders: ["*"],
    credentials: true,
  }
});


watcher.on('change', () => {
  console.log("change")
  io.emit('reload');
});
