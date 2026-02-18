import WebSocket from "ws";

const token = process.env.HA_TOKEN;
const ws = new WebSocket("ws://192.168.1.98:8123/api/websocket");

ws.on("open", () => {});
ws.on("message", (data) => {
  const msg = JSON.parse(data);
  if (msg.type === "auth_required") {
    ws.send(JSON.stringify({ type: "auth", access_token: token }));
  } else if (msg.type === "auth_ok") {
    ws.send(
      JSON.stringify({
        id: 1,
        type: "automation/config",
        entity_id: "automation.pic_consommation_action_ignorer_1h",
      }),
    );
  } else if (msg.id === 1) {
    console.log(JSON.stringify(msg, null, 2));
    ws.close();
    process.exit(0);
  }
});
setTimeout(() => process.exit(1), 5000);
