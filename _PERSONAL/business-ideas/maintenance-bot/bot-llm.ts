/**
 * Maintenance Bot - LLM + Voice Edition
 * 
 * Features:
 * - Natural language understanding via Claude Haiku
 * - Voice message transcription via Whisper
 * - Multi-vertical: Moto, Auto, Maison
 */

import initSqlJs from 'sql.js';
import TelegramBot from 'node-telegram-bot-api';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================
// Config
// ============================================

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8399193559:AAEvis9UiXR3e-I0-iAEQ90n31PQCdKsO_4';
const DB_PATH = join(homedir(), '.clawdbot', 'maintenance-bot.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');
const VOICE_DIR = join(homedir(), '.clawdbot', 'maintenance-bot-voice');

// Anthropic client
const anthropic = new Anthropic();

// ============================================
// Database
// ============================================

class MaintenanceDB {
  private db: any;
  private dbPath: string;

  constructor(sqlModule: any, dbPath: string) {
    this.dbPath = dbPath;
    const dir = dirname(dbPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    
    if (existsSync(dbPath)) {
      this.db = new sqlModule.Database(readFileSync(dbPath));
    } else {
      this.db = new sqlModule.Database();
    }
  }

  exec(sql: string) { this.db.run(sql); this.save(); }
  
  get(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row; }
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

  save() { writeFileSync(this.dbPath, Buffer.from(this.db.export())); }
  close() { this.save(); this.db.close(); }
}

// ============================================
// Voice Transcription
// ============================================

async function transcribeVoice(filePath: string): Promise<string> {
  try {
    const pythonCode = `
from faster_whisper import WhisperModel
model = WhisperModel('base', device='cpu', compute_type='int8')
segments, _ = model.transcribe(r'${filePath}', language='fr')
print(' '.join([s.text.strip() for s in segments]))
`;
    const result = execSync(`python -c "${pythonCode.replace(/\n/g, ';')}"`, {
      encoding: 'utf-8',
      timeout: 60000
    });
    return result.trim();
  } catch (error) {
    console.error('Transcription error:', error);
    return '';
  }
}

// ============================================
// Tools Definition
// ============================================

const tools: Anthropic.Tool[] = [
  {
    name: 'add_reminder',
    description: 'Ajoute un nouveau rappel d\'entretien pour l\'utilisateur',
    input_schema: {
      type: 'object' as const,
      properties: {
        template_code: {
          type: 'string',
          description: 'Code du template (ex: oil_change, boiler_service, chain_maintenance)'
        },
        reference_date: {
          type: 'string',
          description: 'Date du dernier entretien au format YYYY-MM-DD'
        }
      },
      required: ['template_code', 'reference_date']
    }
  },
  {
    name: 'mark_done',
    description: 'Marque un rappel comme effectué aujourd\'hui et recalcule la prochaine échéance',
    input_schema: {
      type: 'object' as const,
      properties: {
        reminder_id: {
          type: 'number',
          description: 'ID du rappel à marquer comme fait'
        }
      },
      required: ['reminder_id']
    }
  },
  {
    name: 'list_reminders',
    description: 'Liste les rappels de l\'utilisateur',
    input_schema: {
      type: 'object' as const,
      properties: {
        vertical: {
          type: 'string',
          description: 'Filtrer par vertical (maison, auto, moto, jardin, plantes, pets)'
        }
      }
    }
  }
];

// ============================================
// Tool Execution
// ============================================

function executeTool(
  db: MaintenanceDB,
  clientId: number,
  toolName: string,
  toolInput: any
): string {
  console.log(`🔧 Executing tool: ${toolName}`, toolInput);
  
  if (toolName === 'add_reminder') {
    const { template_code, reference_date } = toolInput;
    const template = db.get('SELECT * FROM reminder_templates WHERE code = ?', [template_code]);
    
    if (!template) {
      return `Template "${template_code}" non trouvé.`;
    }
    
    // Calculate next due
    let nextDue: string | null = null;
    const d = new Date(reference_date);
    if (template.default_interval_months) {
      d.setMonth(d.getMonth() + template.default_interval_months);
      nextDue = d.toISOString().split('T')[0];
    } else if (template.default_interval_days) {
      d.setDate(d.getDate() + template.default_interval_days);
      nextDue = d.toISOString().split('T')[0];
    }
    
    db.run(`
      INSERT INTO client_reminders (client_id, vertical_id, template_id, name, description, icon,
        interval_days, interval_months, reference_date, next_due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [clientId, template.vertical_id, template.id, template.name, template.description, 
        template.icon, template.default_interval_days, template.default_interval_months, reference_date, nextDue]);
    
    return `✅ Rappel "${template.name}" ajouté. Prochain: ${nextDue}`;
  }
  
  if (toolName === 'mark_done') {
    const { reminder_id } = toolInput;
    const reminder = db.get('SELECT * FROM client_reminders WHERE id = ? AND client_id = ?', [reminder_id, clientId]);
    
    if (!reminder) {
      return `Rappel #${reminder_id} non trouvé.`;
    }
    
    const today = new Date().toISOString().split('T')[0];
    let nextDue: string | null = null;
    const d = new Date();
    if (reminder.interval_months) {
      d.setMonth(d.getMonth() + reminder.interval_months);
      nextDue = d.toISOString().split('T')[0];
    } else if (reminder.interval_days) {
      d.setDate(d.getDate() + reminder.interval_days);
      nextDue = d.toISOString().split('T')[0];
    }
    
    db.run('UPDATE client_reminders SET reference_date = ?, next_due_date = ?, status = "pending" WHERE id = ? AND client_id = ?',
      [today, nextDue, reminder_id, clientId]);
    
    return `✅ "${reminder.name}" marqué comme fait. Prochain: ${nextDue}`;
  }
  
  if (toolName === 'list_reminders') {
    const { vertical } = toolInput;
    let reminders;
    if (vertical) {
      reminders = db.all('SELECT * FROM client_reminders WHERE client_id = ? AND vertical_id = ? AND enabled = 1 ORDER BY next_due_date', [clientId, vertical]);
    } else {
      reminders = db.all('SELECT * FROM client_reminders WHERE client_id = ? AND enabled = 1 ORDER BY next_due_date', [clientId]);
    }
    
    if (reminders.length === 0) {
      return 'Aucun rappel configuré.';
    }
    
    return reminders.map(r => `- ${r.icon} ${r.name}: ${r.next_due_date || 'non planifié'}`).join('\n');
  }
  
  return 'Outil non reconnu.';
}

// ============================================
// LLM Agent with Tools
// ============================================

async function processWithLLM(
  db: MaintenanceDB,
  clientId: number,
  userMessage: string,
  vertical: string | null
): Promise<string> {
  
  // Get client's reminders for context
  const reminders = db.all(
    'SELECT id, name, icon, next_due_date, vertical_id FROM client_reminders WHERE client_id = ? AND enabled = 1 ORDER BY next_due_date',
    [clientId]
  );
  
  // Get available templates
  const templates = db.all('SELECT code, name, vertical_id, description FROM reminder_templates WHERE enabled = 1');
  
  // Build context
  const remindersContext = reminders.length > 0
    ? reminders.map(r => `- #${r.id} ${r.icon} ${r.name}: prochain ${r.next_due_date || 'non défini'} (${r.vertical_id})`).join('\n')
    : 'Aucun rappel configuré.';
  
  const templatesContext = templates.map(t => `- ${t.code}: ${t.name} (${t.vertical_id})`).join('\n');

  const systemPrompt = `Tu es un assistant de rappels d'entretien sympathique. Tu aides les utilisateurs à gérer leurs rappels pour:
- 🏍️ Moto (vidange, chaîne, pneus, CT...)
- 🚗 Auto (vidange, CT, pneus, freins...)  
- 🏠 Maison (chaudière, ramonage, VMC...)
- 🌱 Jardin, 🪴 Plantes, 🐕 Animaux

RAPPELS DE L'UTILISATEUR:
${remindersContext}

TEMPLATES DISPONIBLES (utilise le code pour add_reminder):
${templatesContext}

RÈGLES:
1. Réponds en français, de façon concise et sympathique
2. Utilise les tools pour les actions (add_reminder, mark_done, list_reminders)
3. Si l'utilisateur veut ajouter un rappel mais n'a pas donné la date, demande-lui
4. Utilise des emojis appropriés
5. Ne montre JAMAIS de détails techniques à l'utilisateur`;

  try {
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];
    
    // First call - may use tools
    let response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system: systemPrompt,
      tools,
      messages
    });
    
    // Process tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      
      for (const toolUse of toolUseBlocks) {
        if (toolUse.type === 'tool_use') {
          const result = executeTool(db, clientId, toolUse.name, toolUse.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result
          });
        }
      }
      
      // Continue conversation with tool results
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
      
      response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        system: systemPrompt,
        tools,
        messages
      });
    }
    
    // Extract final text response
    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : "C'est noté ! 👍";
    
  } catch (error) {
    console.error('LLM error:', error);
    return "Désolé, j'ai un problème technique. Réessaie dans un instant. 🔧";
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('🚀 Starting Maintenance Bot (LLM Edition)...');
  
  // Ensure voice directory exists
  if (!existsSync(VOICE_DIR)) mkdirSync(VOICE_DIR, { recursive: true });
  
  // Init SQL.js
  const SQL = await initSqlJs();
  console.log('✅ sql.js initialized');
  
  // Init DB
  const db = new MaintenanceDB(SQL, DB_PATH);
  db.exec(readFileSync(SCHEMA_PATH, 'utf-8'));
  console.log('✅ Database ready');
  
  // Start Telegram bot
  const bot = new TelegramBot(TOKEN, { polling: true });
  console.log('🤖 Telegram bot connected');
  
  // Track user vertical preferences
  const userVerticals = new Map<number, string>();
  
  // ============================================
  // Message Handler
  // ============================================
  
  bot.on('message', async (msg) => {
    console.log('📩 Message received:', msg.text || msg.voice ? '[voice]' : '[unknown]');
    const chatId = msg.chat.id;
    const odId = msg.from?.id;
    if (!odId) return;
    
    const odIdStr = `telegram:${odId}`;
    
    try {
      // Get or create client
      let client = db.get('SELECT * FROM clients WHERE whatsapp_id = ?', [odIdStr]);
      if (!client) {
        db.run('INSERT INTO clients (whatsapp_id, phone, name) VALUES (?, ?, ?)',
          [odIdStr, '', msg.from?.first_name || 'User']);
        client = db.get('SELECT * FROM clients WHERE whatsapp_id = ?', [odIdStr]);
      }
      
      let userMessage = '';
      
      // Handle voice message
      if (msg.voice) {
        await bot.sendChatAction(chatId, 'typing');
        
        const file = await bot.getFile(msg.voice.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
        const localPath = join(VOICE_DIR, `${msg.voice.file_id}.ogg`);
        
        // Download file
        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();
        writeFileSync(localPath, Buffer.from(buffer));
        
        // Transcribe
        userMessage = await transcribeVoice(localPath);
        
        if (!userMessage) {
          await bot.sendMessage(chatId, "🎤 Désolé, je n'ai pas compris le message vocal. Peux-tu réessayer ?");
          return;
        }
        
        // Echo transcription
        await bot.sendMessage(chatId, `🎤 _"${userMessage}"_`, { parse_mode: 'Markdown' });
      } 
      // Handle text message
      else if (msg.text) {
        userMessage = msg.text;
        
        // Quick command handling
        if (userMessage.startsWith('/')) {
          if (userMessage === '/start') {
            await bot.sendMessage(chatId,
              `🔧 *Salut ! Je suis ton assistant entretien.*\n\n` +
              `Je t'aide à ne rien oublier pour ta moto 🏍️, ta voiture 🚗 ou ta maison 🏠.\n\n` +
              `Dis-moi simplement ce que tu veux faire, par exemple :\n` +
              `• "J'ai fait ma vidange hier"\n` +
              `• "Rappelle-moi de faire le ramonage"\n` +
              `• "C'est quoi mes prochains entretiens ?"\n\n` +
              `Tu peux aussi m'envoyer un 🎤 vocal !`,
              { parse_mode: 'Markdown' }
            );
            return;
          }
          
          if (userMessage === '/moto') { userVerticals.set(odId, 'moto'); }
          if (userMessage === '/auto') { userVerticals.set(odId, 'auto'); }
          if (userMessage === '/maison') { userVerticals.set(odId, 'maison'); }
        }
      } else {
        return; // Ignore other message types
      }
      
      if (!userMessage) return;
      
      // Show typing indicator
      await bot.sendChatAction(chatId, 'typing');
      
      // Process with LLM (tools handle actions internally)
      console.log('🧠 Calling LLM with:', userMessage.substring(0, 50));
      const vertical = userVerticals.get(odId) || null;
      const response = await processWithLLM(db, client.id, userMessage, vertical);
      console.log('✅ LLM response:', response.substring(0, 50));
      
      // Send response (clean, no technical details)
      await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error handling message:', error);
      await bot.sendMessage(chatId, "🔧 Oups, petit problème technique. Réessaie !");
    }
  });
  
  // ============================================
  // Error handling
  // ============================================
  
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
  });
  
  bot.on('error', (error) => {
    console.error('Bot error:', error);
  });
  
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection:', reason);
  });
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt...');
    bot.stopPolling();
    db.close();
    process.exit(0);
  });
  
  console.log('✅ Bot prêt ! Envoie un message sur Telegram.');
}

main().catch(console.error);
