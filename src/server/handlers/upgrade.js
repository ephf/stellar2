import { createHash } from "crypto";
import EventEmitter from "events";

export function handleUpgrade(pages, pings) {
  return (req, socket) => {
    const [url, rawquery] = req.url.split("#")[0].split("?");
    req.query = Object.fromEntries(new URLSearchParams(rawquery ?? ""));

    const page = pages[url];
    if (!page?.WS && url != "/stellartesting") return;

    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${createHash("sha1")
          .update(
            req.headers["sec-websocket-key"] +
              "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
          )
          .digest("base64")}\r\n\r\n`
    );
    const customSocket = Object.setPrototypeOf(new EventEmitter(), socket);
    socket.on("data", (data) => {
      if (data[0] == 0x88) {
        customSocket.emit("close");
        return;
      }
      const xor = data.slice(2, 6);
      data = data.slice(6).map((byte, i) => byte ^ xor[i % 4]);
      customSocket.emit("data", data);
    });
    customSocket.write = (text) => {
      socket.write(Buffer.from([0x81, text.length, ...Buffer.from(text)]));
    };

    if (url == "/stellartesting") {
      pings.push(customSocket.write.bind(null, "reload"));
      return;
    }

    page.WS(customSocket, req);
  };
}
