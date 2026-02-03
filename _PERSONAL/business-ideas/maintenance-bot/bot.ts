/**
 * Maintenance Reminder Bot - MVP
 * 
 * Bot Telegram pour rappels d'entretien maison
 */

import { Telegraf, Context } from 'telegraf';
import Database from 'better-sqlite3';
import { CronJob } from 'cron';

// Types
interface Client {
  id: number;
  telegram_id: string;
  name: string;
  status: string;
  timezone: string;
  notification_hour: number;
}

interface Reminder {
  id: number;
  client_id: number;
  name: string;
  description: string;
  next_due_date: string;
  notify_days_before: number;
  enabled: boolean;
}

// Configuration
const BOT_TOKEN = process.env.MAINTENANCE_BOT_TOKEN!;
const DB_PATH = process.env.MAINTENANCE_BOT_DB || './maintenance-bot.db';

// Initialize
const bot = new Telegraf(BOT_TOKEN);
const db = new Database(DB_PATH);

// ============================================
// Database helpers
// ============================================

function getOrCreateClient(telegramId: string, name?: string): Client {
  let client = db.prepare('SELECT * FROM clients WHERE telegram_id = ?').get(telegramId) as Client | undefined;
  
  if (!client) {
    db.prepare(`
      INSERT INTO clients (telegram_id, name, status, created_at)
      VALUES (?, ?, 'trial', datetime('now'))
    `).run(telegramId, name || 'Utilisateur');
    
    client = db.prepare('SELECT * FROM clients WHERE telegram_id = ?').get(telegramId) as Client;
  }
  
  return client;
}

function getClientReminders(clientId: number): Reminder[] {
  return db.prepare(`
    SELECT * FROM client_reminders 
    WHERE client_id = ? AND enabled = TRUE
    ORDER BY next_due_date
  `).all(clientId) as Reminder[];
}

function addReminder(clientId: number, templateId: number | null, name: string, intervalMonths: number): void {
  const nextDue = new Date();
  nextDue.setMonth(nextDue.getMonth() + intervalMonths);
  
  db.prepare(`
    INSERT INTO client_reminders (client_id, template_id, name, interval_months, next_due_date, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(clientId, templateId, name, intervalMonths, nextDue.toISOString().split('T')[0]);
}

function getTemplates(category?: string): any[] {
  if (category) {
    return db.prepare('SELECT * FROM reminder_templates WHERE category = ?').all(category);
  }
  return db.prepare('SELECT * FROM reminder_templates').all();
}

// ============================================
// Bot commands
// ============================================

bot.command('start', async (ctx) => {
  const client = getOrCreateClient(ctx.from.id.toString(), ctx.from.first_name);
  
  await ctx.reply(
    `🏠 Bienvenue sur Maintenance Reminder Bot!\n\n` +
    `Je vais t'aider à ne plus jamais oublier l'entretien de ta maison.\n\n` +
    `Commandes disponibles:\n` +
    `/rappels - Voir tes rappels actifs\n` +
    `/ajouter - Ajouter un nouveau rappel\n` +
    `/templates - Voir les rappels suggérés\n` +
    `/aide - Aide et infos\n\n` +
    `Commençons! Tape /templates pour voir les rappels que tu peux configurer.`
  );
});

bot.command('rappels', async (ctx) => {
  const client = getOrCreateClient(ctx.from.id.toString());
  const reminders = getClientReminders(client.id);
  
  if (reminders.length === 0) {
    await ctx.reply(
      `📋 Tu n'as pas encore de rappels configurés.\n\n` +
      `Tape /templates pour voir les rappels suggérés, ou /ajouter pour en créer un personnalisé.`
    );
    return;
  }
  
  let message = `📋 **Tes rappels actifs:**\n\n`;
  
  for (const r of reminders) {
    const dueDate = new Date(r.next_due_date);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const status = daysUntil < 0 ? '🔴' : daysUntil < 7 ? '🟡' : '🟢';
    
    message += `${status} **${r.name}**\n`;
    message += `   Échéance: ${dueDate.toLocaleDateString('fr-FR')}`;
    message += daysUntil < 0 ? ` (en retard de ${-daysUntil}j)` : ` (dans ${daysUntil}j)`;
    message += `\n\n`;
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('templates', async (ctx) => {
  const categories = ['maison', 'jardin', 'voiture', 'admin'];
  
  let message = `📚 **Rappels suggérés par catégorie:**\n\n`;
  
  for (const cat of categories) {
    const templates = getTemplates(cat);
    const emoji = cat === 'maison' ? '🏠' : cat === 'jardin' ? '🌱' : cat === 'voiture' ? '🚗' : '📋';
    message += `${emoji} **${cat.charAt(0).toUpperCase() + cat.slice(1)}**\n`;
    
    for (const t of templates.slice(0, 3)) {
      message += `  • ${t.icon} ${t.name}${t.is_mandatory ? ' ⚠️' : ''}\n`;
    }
    message += `\n`;
  }
  
  message += `\nTape /ajouter [catégorie] pour configurer un rappel.\n`;
  message += `Ex: /ajouter maison`;
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('aide', async (ctx) => {
  await ctx.reply(
    `ℹ️ **Aide - Maintenance Reminder Bot**\n\n` +
    `Ce bot t'envoie des rappels pour l'entretien de ta maison, voiture, jardin...\n\n` +
    `**Commandes:**\n` +
    `/start - Démarrer\n` +
    `/rappels - Voir tes rappels\n` +
    `/templates - Rappels suggérés\n` +
    `/ajouter - Nouveau rappel\n` +
    `/supprimer - Supprimer un rappel\n` +
    `/pause - Mettre en pause un rappel\n\n` +
    `**Tarifs:**\n` +
    `🆓 Gratuit: 3 rappels max\n` +
    `💎 Premium: 30€/an - rappels illimités\n\n` +
    `Contact: @jules_mudes`,
    { parse_mode: 'Markdown' }
  );
});

// ============================================
// Notification cron
// ============================================

function sendDueReminders() {
  const today = new Date().toISOString().split('T')[0];
  
  // Get reminders due within notify_days_before
  const dueReminders = db.prepare(`
    SELECT cr.*, c.telegram_id, c.name as client_name
    FROM client_reminders cr
    JOIN clients c ON cr.client_id = c.id
    WHERE cr.enabled = TRUE
      AND cr.status = 'pending'
      AND date(cr.next_due_date, '-' || cr.notify_days_before || ' days') <= date(?)
      AND (cr.last_notified_at IS NULL OR date(cr.last_notified_at) < date(?))
  `).all(today, today) as any[];
  
  for (const reminder of dueReminders) {
    const dueDate = new Date(reminder.next_due_date);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    let message: string;
    if (daysUntil < 0) {
      message = `🔴 **Rappel en retard!**\n\n${reminder.name}\nÉchéance dépassée de ${-daysUntil} jour(s).\n\nTape /fait pour marquer comme effectué.`;
    } else if (daysUntil === 0) {
      message = `🟡 **Rappel pour aujourd'hui!**\n\n${reminder.name}\n\nC'est le jour! Tape /fait quand c'est terminé.`;
    } else {
      message = `📅 **Rappel à venir**\n\n${reminder.name}\nÉchéance dans ${daysUntil} jour(s) (${dueDate.toLocaleDateString('fr-FR')})`;
    }
    
    bot.telegram.sendMessage(reminder.telegram_id, message, { parse_mode: 'Markdown' })
      .then(() => {
        db.prepare(`
          UPDATE client_reminders SET last_notified_at = datetime('now') WHERE id = ?
        `).run(reminder.id);
        
        db.prepare(`
          INSERT INTO notification_log (client_id, reminder_id, channel, status)
          VALUES (?, ?, 'telegram', 'sent')
        `).run(reminder.client_id, reminder.id);
      })
      .catch(console.error);
  }
}

// Run notifications every day at 9h
const notificationJob = new CronJob('0 9 * * *', sendDueReminders, null, true, 'Europe/Paris');

// ============================================
// Launch
// ============================================

async function main() {
  console.log('🏠 Maintenance Reminder Bot starting...');
  
  // Initialize database
  const schema = require('fs').readFileSync('./schema.sql', 'utf-8');
  db.exec(schema);
  
  // Start bot
  await bot.launch();
  console.log('✅ Bot started!');
  
  // Start notification cron
  notificationJob.start();
  console.log('⏰ Notification cron started (9h daily)');
}

main().catch(console.error);

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
