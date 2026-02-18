import WebSocket from "ws";

const token = process.env.HA_TOKEN;
const ws = new WebSocket("ws://192.168.1.98:8123/api/websocket");

const newConfig = {
  id: "pic_conso_action_ignorer_20251115",
  alias: "Pic Consommation - Action Ignorer 1h",
  description: "Desactive l alerte pendant 1h",
  mode: "single",
  triggers: [
    {
      trigger: "event",
      event_type: "mobile_app_notification_action",
      event_data: {
        action: "PIC_CONSO_IGNORER_1H",
      },
    },
  ],
  actions: [
    {
      action: "notify.mobile_app_pixel_9_pro",
      data: {
        message: "clear_notification",
        data: {
          tag: "alerte_pic_consommation",
        },
      },
    },
    {
      action: "automation.turn_off",
      target: {
        entity_id: "automation.alerte_pic_consommation_tempo_rouge_hp",
      },
    },
    {
      delay: {
        hours: 1,
      },
    },
    {
      action: "automation.turn_on",
      target: {
        entity_id: "automation.alerte_pic_consommation_tempo_rouge_hp",
      },
    },
  ],
};

ws.on("open", () => {});
ws.on("message", (data) => {
  const msg = JSON.parse(data);
  if (msg.type === "auth_required") {
    ws.send(JSON.stringify({ type: "auth", access_token: token }));
  } else if (msg.type === "auth_ok") {
    // Try the correct endpoint for updating automation config
    ws.send(
      JSON.stringify({
        id: 1,
        type: "config/automation/update",
        automation_id: "pic_conso_action_ignorer_20251115",
        config: newConfig,
      }),
    );
  } else if (msg.id === 1) {
    console.log(JSON.stringify(msg, null, 2));
    ws.close();
    process.exit(msg.success ? 0 : 1);
  }
});
setTimeout(() => process.exit(1), 5000);
