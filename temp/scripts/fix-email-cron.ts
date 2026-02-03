#!/usr/bin/env tsx

/**
 * Reconfigure email verification cron to run in isolated mode
 * This ensures it runs proactively and delivers to Telegram
 */

const cronJob = {
  id: "verif-emails-auto",
  name: "Vérification emails automatique",
  enabled: true,
  schedule: "0 9-23 * * *", // Every hour from 9h to 23h
  sessionTarget: "isolated", // ✅ ISOLATED mode for proactive execution
  wakeMode: "now" as const,
  payload: {
    kind: "agentTurn" as const,
    deliver: true, // ✅ Deliver to Telegram
    channel: "telegram" as const,
    message: `Exécute la vérification des emails pour les deux comptes (alejmurot@gmail.com et jmudes76000@gmail.com).

Commandes:
cd C:\\\\Users\\\\jules\\\\repo\\\\clawdbot
pnpm tsx skills/google/scripts/check-emails-silent.ts

Si ha-output.txt contient des emails importants, informe-moi. Sinon, reste silencieux (ne dis rien).`
  }
};

console.log(JSON.stringify(cronJob, null, 2));
