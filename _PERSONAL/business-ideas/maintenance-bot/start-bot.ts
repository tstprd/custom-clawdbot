/**
 * Maintenance Bot Starter - Using sql.js
 * 
 * Run with: pnpm tsx business-ideas/maintenance-bot/start-bot.ts
 */

import initSqlJs from 'sql.js';
import TelegramBot from 'node-telegram-bot-api';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================
// Config
// ============================================

const TOKEN = '8399193559:AAEvis9UiXR3e-I0-iAEQ90n31PQCdKsO_4';
const DB_PATH = join(homedir(), '.clawdbot', 'maintenance-bot.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

// ============================================
// Personalities
// ============================================

const PERSONALITIES: Record<string, { name: string; emoji: string; greeting: string }> = {
  moto: {
    mecanicien: { name: 'Le Mécano', emoji: '🔩', greeting: 'Yo rider ! Ta bécane, c\'est sacré. Je vais t\'aider à la garder au top. 🏍️' },
    biker: { name: 'Le Rider', emoji: '🏍️', greeting: 'Hey ! Bienvenue dans le club. Entre riders, on prend soin de nos bécanes. Ride safe !' },
  },
  auto: {
    garagiste: { name: 'Le Garagiste', emoji: '🔧', greeting: 'Bonjour ! Je suis votre garagiste de confiance. Je surveille votre véhicule. 🚗' },
  },
  maison: {
    gardien: { name: 'Le Gardien', emoji: '🏠', greeting: 'Salut ! Je veille sur ta maison pour que tu n\'aies jamais de mauvaise surprise. 🏠' },
    bricoleur: { name: 'Le Bricoleur', emoji: '🔧', greeting: 'Salut ! Moi c\'est le Bricoleur. Je connais ta maison sur le bout des doigts. 🔧' },
  },
};

// ============================================
// Database Class (sql.js wrapper)
// ============================================

class MaintenanceDB {
  private db: any;
  private dbPath: string;

  constructor(sqlModule: any, dbPath: string) {
    this.dbPath = dbPath;
    
    const dir = dirname(dbPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath);
      this.db = new sqlModule.Database(buffer);
    } else {
      this.db = new sqlModule.Database();
    }
  }

  exec(sql: string) {
    this.db.run(sql);
    this.save();
  }

  get(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  all(sql: string, params: any[] = []): any[] {
    const results: any[] = [];
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  run(sql: string, params: any[] = []): { changes: number; lastId: number } {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    
    const meta = this.get('SELECT changes() as changes, last_insert_rowid() as lastId');
    this.save();
    return { changes: meta?.changes || 0, lastId: meta?.lastId || 0 };
  }

  save() {
    const data = this.db.export();
    writeFileSync(this.dbPath, Buffer.from(data));
  }

  close() {
    this.save();
    this.db.close();
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('🚀 Starting Maintenance Bot...');
  
  // Init SQL.js
  const SQL = await initSqlJs();
  console.log('✅ sql.js initialized');
  
  // Init DB
  const db = new MaintenanceDB(SQL, DB_PATH);
  console.log('📁 Database:', DB_PATH);
  
  // Load schema
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('✅ Schema loaded');
  
  // Stats
  const verticals = db.get('SELECT COUNT(*) as c FROM verticals');
  const templates = db.get('SELECT COUNT(*) as c FROM reminder_templates');
  console.log(`📊 ${verticals?.c || 0} verticals, ${templates?.c || 0} templates`);
  
  // Start Telegram bot
  const bot = new TelegramBot(TOKEN, { polling: true });
  console.log('🤖 Telegram bot started!');
  
  // Track user states
  const userStates = new Map<number, { step: string; vertical?: string; pendingTemplate?: number }>();
  
  // ============================================
  // Commands
  // ============================================
  
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId,
      `🔧 *Bienvenue sur Maintenance Bot!*\n\n` +
      `Je t'aide à ne jamais oublier un entretien.\n\n` +
      `Choisis ton domaine :\n` +
      `🏍️ /moto - Entretien moto\n` +
      `🚗 /auto - Entretien voiture\n` +
      `🏠 /maison - Entretien maison`,
      { parse_mode: 'Markdown' }
    );
  });
  
  bot.onText(/\/(moto|auto|maison)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const odId = msg.from?.id;
    const vertical = match?.[1] || 'maison';
    
    // Create/get client
    const odIdStr = `telegram:${odId}`;
    let client = db.get('SELECT * FROM clients WHERE whatsapp_id = ?', [odIdStr]);
    
    if (!client) {
      db.run('INSERT INTO clients (whatsapp_id, phone, name) VALUES (?, ?, ?)', 
        [odIdStr, '', msg.from?.first_name || 'User']);
      client = db.get('SELECT * FROM clients WHERE whatsapp_id = ?', [odIdStr]);
    }
    
    // Get templates
    const templates = db.all(
      'SELECT * FROM reminder_templates WHERE vertical_id = ? AND enabled = 1 ORDER BY is_mandatory DESC, display_order LIMIT 10',
      [vertical]
    );
    
    let message = `${vertical === 'moto' ? '🏍️' : vertical === 'auto' ? '🚗' : '🏠'} *${vertical.toUpperCase()}*\n\n`;
    message += `Choisis un rappel à configurer :\n\n`;
    
    templates.forEach((t: any, i: number) => {
      const mandatory = t.is_mandatory ? ' ⚠️' : '';
      message += `${i + 1}. ${t.icon || '📌'} ${t.name}${mandatory}\n`;
    });
    
    message += `\nRéponds avec le numéro.`;
    
    userStates.set(chatId, { step: 'choose_template', vertical });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  });
  
  bot.onText(/\/rappels/, async (msg) => {
    const chatId = msg.chat.id;
    const odIdStr = `telegram:${msg.from?.id}`;
    
    const client = db.get('SELECT * FROM clients WHERE whatsapp_id = ?', [odIdStr]);
    if (!client) {
      await bot.sendMessage(chatId, 'Tu n\'as pas encore de rappels. Utilise /moto, /auto ou /maison pour commencer.');
      return;
    }
    
    const reminders = db.all(
      'SELECT * FROM client_reminders WHERE client_id = ? AND enabled = 1 ORDER BY next_due_date',
      [client.id]
    );
    
    if (reminders.length === 0) {
      await bot.sendMessage(chatId, '📭 Aucun rappel configuré. Utilise /moto, /auto ou /maison.');
      return;
    }
    
    let message = `📋 *Tes rappels* (${reminders.length})\n\n`;
    
    for (const r of reminders) {
      const dueDate = r.next_due_date ? new Date(r.next_due_date) : null;
      const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : null;
      
      let status = '✅';
      if (daysUntil !== null && daysUntil < 0) status = '🔴';
      else if (daysUntil !== null && daysUntil <= 7) status = '🟡';
      
      message += `${status} *${r.name}*`;
      if (dueDate) {
        message += ` - ${dueDate.toLocaleDateString('fr-FR')}`;
        if (daysUntil !== null) {
          if (daysUntil < 0) message += ` (${-daysUntil}j retard)`;
          else if (daysUntil === 0) message += ` (aujourd'hui)`;
          else message += ` (${daysUntil}j)`;
        }
      }
      message += `\n`;
    }
    
    message += `\n💡 "fait" pour marquer le premier comme terminé`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  });
  
  bot.onText(/\/aide|\/help/, async (msg) => {
    await bot.sendMessage(msg.chat.id,
      `🔧 *Aide*\n\n` +
      `/moto - Rappels moto\n` +
      `/auto - Rappels voiture\n` +
      `/maison - Rappels maison\n` +
      `/rappels - Voir tes rappels\n\n` +
      `"fait" - Marquer comme terminé\n` +
      `"snooze" - Reporter 7 jours`,
      { parse_mode: 'Markdown' }
    );
  });
  
  // ============================================
  // Message Handler
  // ============================================
  
  bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const odIdStr = `telegram:${msg.from?.id}`;
    const text = msg.text?.toLowerCase().trim() || '';
    const state = userStates.get(chatId);
    
    // Handle "fait"
    if (text === 'fait' || text.startsWith('fait ')) {
      const client = db.get('SELECT * FROM clients WHERE whatsapp_id = ?', [odIdStr]);
      if (!client) return;
      
      const reminder = db.get(
        'SELECT * FROM client_reminders WHERE client_id = ? AND enabled = 1 ORDER BY next_due_date LIMIT 1',
        [client.id]
      );
      
      if (!reminder) {
        await bot.sendMessage(chatId, 'Pas de rappel à marquer comme fait.');
        return;
      }
      
      // Calculate next due date
      const today = new Date().toISOString().split('T')[0];
      let nextDue: string | null = null;
      
      if (reminder.interval_months) {
        const d = new Date();
        d.setMonth(d.getMonth() + reminder.interval_months);
        nextDue = d.toISOString().split('T')[0];
      } else if (reminder.interval_days) {
        const d = new Date();
        d.setDate(d.getDate() + reminder.interval_days);
        nextDue = d.toISOString().split('T')[0];
      }
      
      db.run(
        'UPDATE client_reminders SET reference_date = ?, next_due_date = ?, completed_at = datetime("now"), status = "pending" WHERE id = ? AND client_id = ?',
        [today, nextDue, reminder.id, client.id]
      );
      
      await bot.sendMessage(chatId,
        `✅ *${reminder.name}* marqué comme fait !\n\n` +
        `📅 Prochain rappel : ${nextDue ? new Date(nextDue).toLocaleDateString('fr-FR') : 'non défini'}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Handle template selection
    if (state?.step === 'choose_template') {
      const num = parseInt(text) - 1;
      const templates = db.all(
        'SELECT * FROM reminder_templates WHERE vertical_id = ? AND enabled = 1 ORDER BY is_mandatory DESC, display_order LIMIT 10',
        [state.vertical]
      );
      
      if (num >= 0 && num < templates.length) {
        const template = templates[num];
        userStates.set(chatId, { ...state, step: 'enter_date', pendingTemplate: template.id });
        
        await bot.sendMessage(chatId,
          `📅 *${template.name}*\n\n` +
          `Quand l'as-tu fait pour la dernière fois ?\n\n` +
          `Exemples :\n` +
          `• "15/06/2025"\n` +
          `• "il y a 3 mois"\n` +
          `• "jamais" (je pars d'aujourd'hui)`,
          { parse_mode: 'Markdown' }
        );
      }
      return;
    }
    
    // Handle date entry
    if (state?.step === 'enter_date' && state.pendingTemplate) {
      const client = db.get('SELECT * FROM clients WHERE whatsapp_id = ?', [odIdStr]);
      if (!client) return;
      
      const template = db.get('SELECT * FROM reminder_templates WHERE id = ?', [state.pendingTemplate]);
      if (!template) return;
      
      // Parse date
      let refDate = new Date().toISOString().split('T')[0];
      
      const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        refDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (text.includes('mois')) {
        const months = parseInt(text.match(/(\d+)/)?.[1] || '0');
        const d = new Date();
        d.setMonth(d.getMonth() - months);
        refDate = d.toISOString().split('T')[0];
      }
      
      // Calculate next due
      let nextDue: string | null = null;
      const d = new Date(refDate);
      if (template.default_interval_months) {
        d.setMonth(d.getMonth() + template.default_interval_months);
        nextDue = d.toISOString().split('T')[0];
      } else if (template.default_interval_days) {
        d.setDate(d.getDate() + template.default_interval_days);
        nextDue = d.toISOString().split('T')[0];
      }
      
      // Insert reminder (SECURITY: client_id from verified client)
      db.run(`
        INSERT INTO client_reminders (client_id, vertical_id, template_id, name, description, icon, 
          interval_days, interval_months, reference_date, next_due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        client.id, template.vertical_id, template.id, template.name, template.description, template.icon,
        template.default_interval_days, template.default_interval_months, refDate, nextDue
      ]);
      
      userStates.delete(chatId);
      
      await bot.sendMessage(chatId,
        `✅ *${template.name}* configuré !\n\n` +
        `📅 Prochain rappel : ${nextDue ? new Date(nextDue).toLocaleDateString('fr-FR') : 'à définir'}\n\n` +
        `Ajouter un autre ? Utilise /moto, /auto ou /maison\n` +
        `Voir tes rappels : /rappels`,
        { parse_mode: 'Markdown' }
      );
    }
  });
  
  // ============================================
  // Graceful shutdown
  // ============================================
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt...');
    bot.stopPolling();
    db.close();
    process.exit(0);
  });
  
  console.log('✅ Bot prêt ! Envoie /start sur Telegram.');
}

main().catch(console.error);
