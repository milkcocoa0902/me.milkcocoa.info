import { Server }  from "socket.io";
import chokidar from 'chokidar';
console.log(process.cwd())
const watcher = chokidar.watch(`${process.cwd()}/../articles/**/*`);
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
