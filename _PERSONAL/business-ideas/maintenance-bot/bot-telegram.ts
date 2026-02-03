/**
 * Maintenance Bot - Telegram Integration
 * 
 * Multi-vertical bot: MotoBot, AutoBot, MaisonBot
 * Uses secure client-scoped database operations
 */

import TelegramBot from 'node-telegram-bot-api';
import { MaintenanceDB, ClientScopedDB } from './core/secure-engine';
import { getPersonalities, getPersonality, formatReminder } from './core/personalities';
import * as onboarding from './core/onboarding';
import { join } from 'path';
import { homedir } from 'os';

// ============================================
// Config
// ============================================

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8399193559:AAEvis9UiXR3e-I0-iAEQ90n31PQCdKsO_4';
const DB_PATH = join(homedir(), '.clawdbot', 'maintenance-bot.db');

// ============================================
// Initialize
// ============================================

const bot = new TelegramBot(TOKEN, { polling: true });
const db = new MaintenanceDB(DB_PATH);

// Track onboarding state per user
const onboardingStates = new Map<string, onboarding.OnboardingState>();

console.log('🤖 Maintenance Bot started!');
console.log('📍 Database:', DB_PATH);

// ============================================
// Helpers
// ============================================

function getTelegramId(msg: TelegramBot.Message): string {
  return `telegram:${msg.from?.id}`;
}

function getVerticalFromCommand(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('moto')) return 'moto';
  if (lower.includes('auto') || lower.includes('voiture')) return 'auto';
  if (lower.includes('maison')) return 'maison';
  return null;
}

// ============================================
// Commands
// ============================================

// /start - Welcome & choose vertical
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = getTelegramId(msg);
  const param = match?.[1]?.trim();
  
  // Check if starting with a specific vertical
  let vertical = getVerticalFromCommand(param || '');
  
  if (!vertical) {
    // Show vertical selection
    await bot.sendMessage(chatId, 
      `🔧 **Bienvenue sur Maintenance Bot!**\n\n` +
      `Je t'aide à ne jamais oublier un entretien.\n\n` +
      `Choisis ton domaine :\n\n` +
      `🏍️ /moto - Entretien moto\n` +
      `🚗 /auto - Entretien voiture\n` +
      `🏠 /maison - Entretien maison`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Start onboarding for chosen vertical
  startOnboarding(chatId, telegramId, vertical);
});

// /moto, /auto, /maison - Start specific vertical
bot.onText(/\/(moto|auto|maison)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = getTelegramId(msg);
  const vertical = match?.[1] || 'maison';
  
  startOnboarding(chatId, telegramId, vertical);
});

// /rappels - List reminders
bot.onText(/\/rappels/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = getTelegramId(msg);
  
  const session = db.getClientSession(telegramId);
  const reminders = session.getReminders();
  
  if (reminders.length === 0) {
    await bot.sendMessage(chatId, 
      `📭 Tu n'as pas encore de rappels configurés.\n\n` +
      `Utilise /moto, /auto ou /maison pour commencer.`
    );
    return;
  }
  
  let message = `📋 **Tes rappels** (${reminders.length})\n\n`;
  
  for (const r of reminders) {
    const dueDate = r.next_due_date ? new Date(r.next_due_date) : null;
    const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    
    let status = '✅';
    if (daysUntil !== null) {
      if (daysUntil < 0) status = '🔴';
      else if (daysUntil <= 7) status = '🟡';
    }
    
    message += `${status} **${r.name}**\n`;
    if (dueDate) {
      message += `   📅 ${dueDate.toLocaleDateString('fr-FR')}`;
      if (daysUntil !== null) {
        if (daysUntil < 0) message += ` (${-daysUntil}j de retard!)`;
        else if (daysUntil === 0) message += ` (aujourd'hui!)`;
        else message += ` (dans ${daysUntil}j)`;
      }
      message += `\n`;
    }
    message += `\n`;
  }
  
  message += `\n💡 Réponds "fait [nom]" quand un entretien est terminé.`;
  
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /ajouter - Add a reminder
bot.onText(/\/ajouter/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId,
    `➕ **Ajouter un rappel**\n\n` +
    `Choisis le domaine :\n\n` +
    `🏍️ /ajouter_moto\n` +
    `🚗 /ajouter_auto\n` +
    `🏠 /ajouter_maison`,
    { parse_mode: 'Markdown' }
  );
});

// /ajouter_[vertical] - Add reminder for specific vertical
bot.onText(/\/ajouter_(moto|auto|maison)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const vertical = match?.[1] || 'maison';
  
  const templates = db.getTemplates(vertical);
  
  let message = `📋 **Templates ${vertical}**\n\n`;
  
  templates.slice(0, 10).forEach((t, i) => {
    const mandatory = t.is_mandatory ? ' ⚠️' : '';
    message += `${i + 1}. ${t.icon} ${t.name}${mandatory}\n`;
  });
  
  message += `\nRéponds avec le numéro pour ajouter.`;
  
  // Store state for next message
  onboardingStates.set(getTelegramId(msg), {
    step: 'add_first_reminder',
    verticalId: vertical
  });
  
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /personnalite - Change personality
bot.onText(/\/personnalit[eé]/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = getTelegramId(msg);
  
  const session = db.getClientSession(telegramId);
  const reminders = session.getReminders();
  
  // Get vertical from existing reminders or default
  const vertical = reminders[0]?.vertical_id || 'maison';
  const personalities = getPersonalities(vertical);
  
  let message = `🎭 **Choisis ta personnalité**\n\n`;
  
  personalities.forEach((p, i) => {
    message += `${i + 1}. ${p.emoji} **${p.name}**\n`;
    message += `   _${p.description}_\n\n`;
  });
  
  message += `Réponds avec le numéro.`;
  
  onboardingStates.set(telegramId, {
    step: 'choose_personality',
    verticalId: vertical
  });
  
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /aide - Help
bot.onText(/\/aide|\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId,
    `🔧 **Maintenance Bot - Aide**\n\n` +
    `**Commandes :**\n` +
    `/rappels - Voir tes rappels\n` +
    `/ajouter - Ajouter un rappel\n` +
    `/personnalite - Changer de style\n` +
    `/heure - Changer l'heure des notifs\n\n` +
    `**Actions :**\n` +
    `"fait" - Marquer le dernier rappel comme fait\n` +
    `"fait [nom]" - Marquer un rappel spécifique\n` +
    `"snooze" - Reporter de 7 jours\n\n` +
    `**Verticales :**\n` +
    `/moto - Entretien moto\n` +
    `/auto - Entretien voiture\n` +
    `/maison - Entretien maison`,
    { parse_mode: 'Markdown' }
  );
});

// /heure - Change notification hour
bot.onText(/\/heure/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = getTelegramId(msg);
  
  onboardingStates.set(telegramId, {
    step: 'notification_time',
    verticalId: 'maison'
  });
  
  await bot.sendMessage(chatId, onboarding.getNotificationTimeMessage(), { parse_mode: 'Markdown' });
});

// ============================================
// Message Handler (for conversations)
// ============================================

bot.on('message', async (msg) => {
  // Ignore commands (handled above)
  if (msg.text?.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const telegramId = getTelegramId(msg);
  const text = msg.text?.toLowerCase().trim() || '';
  
  const state = onboardingStates.get(telegramId);
  
  // Handle "fait" (mark done)
  if (text.startsWith('fait')) {
    await handleMarkDone(chatId, telegramId, text);
    return;
  }
  
  // Handle "snooze"
  if (text === 'snooze') {
    await handleSnooze(chatId, telegramId);
    return;
  }
  
  // Handle onboarding flow
  if (state) {
    await handleOnboardingStep(chatId, telegramId, text, state);
    return;
  }
});

// ============================================
// Onboarding Flow
// ============================================

async function startOnboarding(chatId: number, telegramId: string, vertical: string) {
  // Send welcome
  await bot.sendMessage(chatId, onboarding.getWelcomeMessage(vertical), { parse_mode: 'Markdown' });
  
  // Set state and send personality choice
  onboardingStates.set(telegramId, {
    step: 'choose_personality',
    verticalId: vertical
  });
  
  setTimeout(async () => {
    await bot.sendMessage(chatId, onboarding.getPersonalityChoiceMessage(vertical), { parse_mode: 'Markdown' });
  }, 1000);
}

async function handleOnboardingStep(chatId: number, telegramId: string, text: string, state: onboarding.OnboardingState) {
  const session = db.getClientSession(telegramId);
  
  switch (state.step) {
    case 'choose_personality': {
      const personalities = getPersonalities(state.verticalId);
      const num = parseInt(text) - 1;
      
      if (num >= 0 && num < personalities.length) {
        const personality = personalities[num];
        session.updatePreferences(undefined, undefined, personality.id);
        
        await bot.sendMessage(chatId, onboarding.getPersonalityConfirmation(personality), { parse_mode: 'Markdown' });
        
        state.step = 'notification_time';
        state.personalityId = personality.id;
        
        setTimeout(async () => {
          await bot.sendMessage(chatId, onboarding.getNotificationTimeMessage(), { parse_mode: 'Markdown' });
        }, 500);
      } else {
        await bot.sendMessage(chatId, `Réponds avec un numéro entre 1 et ${personalities.length}.`);
      }
      break;
    }
    
    case 'notification_time': {
      const hourMatch = text.match(/(\d{1,2})/);
      if (hourMatch) {
        const hour = parseInt(hourMatch[1]);
        if (hour >= 0 && hour <= 23) {
          session.updatePreferences(hour);
          
          await bot.sendMessage(chatId, `⏰ Parfait ! Tu recevras tes rappels à ${hour}h.`);
          
          state.step = 'add_first_reminder';
          
          setTimeout(async () => {
            await bot.sendMessage(chatId, onboarding.getFirstReminderMessage(state.verticalId), { parse_mode: 'Markdown' });
          }, 500);
        } else {
          await bot.sendMessage(chatId, `L'heure doit être entre 0 et 23.`);
        }
      } else {
        await bot.sendMessage(chatId, `Je n'ai pas compris. Donne-moi une heure (ex: "9h" ou "19").`);
      }
      break;
    }
    
    case 'add_first_reminder': {
      const templates = db.getTemplates(state.verticalId);
      const num = parseInt(text) - 1;
      
      if (num >= 0 && num < templates.length) {
        const template = templates[num];
        state.pendingReminder = { templateId: template.id };
        state.step = 'confirm_reminder';
        
        await bot.sendMessage(chatId, 
          onboarding.getReferenceDataMessage(
            state.verticalId, 
            template.name,
            template.requires_date,
            template.requires_mileage
          ),
          { parse_mode: 'Markdown' }
        );
      } else if (text === 'autre') {
        // Show more templates
        let message = `📋 **Tous les templates**\n\n`;
        templates.forEach((t, i) => {
          message += `${i + 1}. ${t.icon} ${t.name}\n`;
        });
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } else {
        await bot.sendMessage(chatId, `Réponds avec un numéro ou "autre".`);
      }
      break;
    }
    
    case 'confirm_reminder': {
      if (!state.pendingReminder) {
        state.step = 'add_first_reminder';
        return;
      }
      
      // Parse date
      let refDate: string | null = null;
      let refMileage: number | null = null;
      
      // Try to parse date
      const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        refDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (text.includes('mois')) {
        const monthsAgo = parseInt(text.match(/(\d+)/)?.[1] || '0');
        const d = new Date();
        d.setMonth(d.getMonth() - monthsAgo);
        refDate = d.toISOString().split('T')[0];
      } else if (text.includes('jamais') || text.includes('aujourd')) {
        refDate = new Date().toISOString().split('T')[0];
      }
      
      // Try to parse mileage
      const kmMatch = text.match(/(\d+)\s*km/i);
      if (kmMatch) {
        refMileage = parseInt(kmMatch[1]);
      }
      
      // Add reminder
      const reminderId = session.addReminder(
        state.pendingReminder.templateId,
        refDate || undefined,
        refMileage || undefined
      );
      
      // Get the created reminder
      const reminder = session.getReminder(reminderId);
      const personality = getPersonality(state.verticalId, state.personalityId || 'gardien');
      
      const nextDue = reminder?.next_due_date 
        ? new Date(reminder.next_due_date).toLocaleDateString('fr-FR')
        : 'à définir';
      
      await bot.sendMessage(chatId,
        onboarding.getConfirmReminderMessage(reminder?.name || 'Rappel', nextDue, personality!),
        { parse_mode: 'Markdown' }
      );
      
      state.step = 'add_more';
      break;
    }
    
    case 'add_more': {
      if (text === 'oui' || text === 'o') {
        state.step = 'add_first_reminder';
        await bot.sendMessage(chatId, onboarding.getFirstReminderMessage(state.verticalId), { parse_mode: 'Markdown' });
      } else {
        const personality = getPersonality(state.verticalId, state.personalityId || 'gardien');
        await bot.sendMessage(chatId, onboarding.getTrialInfoMessage(personality!), { parse_mode: 'Markdown' });
        
        setTimeout(async () => {
          await bot.sendMessage(chatId, onboarding.getCompleteMessage(personality!), { parse_mode: 'Markdown' });
        }, 1000);
        
        onboardingStates.delete(telegramId);
      }
      break;
    }
  }
}

// ============================================
// Action Handlers
// ============================================

async function handleMarkDone(chatId: number, telegramId: string, text: string) {
  const session = db.getClientSession(telegramId);
  const reminders = session.getReminders();
  
  if (reminders.length === 0) {
    await bot.sendMessage(chatId, `Tu n'as pas de rappels à marquer comme faits.`);
    return;
  }
  
  // Find which reminder to mark
  let targetReminder = reminders[0]; // Default to first
  
  // Check if specific name mentioned
  const nameMatch = text.replace(/^fait\s*/i, '').trim();
  if (nameMatch) {
    const found = reminders.find(r => 
      r.name.toLowerCase().includes(nameMatch.toLowerCase())
    );
    if (found) targetReminder = found;
  }
  
  // Mark done
  const success = session.markReminderDone(targetReminder.id);
  
  if (success) {
    const newReminder = session.getReminder(targetReminder.id);
    const nextDue = newReminder?.next_due_date 
      ? new Date(newReminder.next_due_date).toLocaleDateString('fr-FR')
      : 'non défini';
    
    await bot.sendMessage(chatId,
      `✅ **${targetReminder.name}** marqué comme fait !\n\n` +
      `📅 Prochain rappel : ${nextDue}`,
      { parse_mode: 'Markdown' }
    );
  } else {
    await bot.sendMessage(chatId, `Erreur lors du marquage.`);
  }
}

async function handleSnooze(chatId: number, telegramId: string) {
  const session = db.getClientSession(telegramId);
  const reminders = session.getReminders();
  
  if (reminders.length === 0) {
    await bot.sendMessage(chatId, `Tu n'as pas de rappels à reporter.`);
    return;
  }
  
  // Snooze the first/most urgent reminder
  const targetReminder = reminders[0];
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + 7);
  
  const success = session.snoozeReminder(targetReminder.id, snoozeUntil.toISOString().split('T')[0]);
  
  if (success) {
    await bot.sendMessage(chatId,
      `⏸️ **${targetReminder.name}** reporté de 7 jours.\n\n` +
      `📅 Nouveau rappel : ${snoozeUntil.toLocaleDateString('fr-FR')}`,
      { parse_mode: 'Markdown' }
    );
  }
}

// ============================================
// Graceful Shutdown
// ============================================

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  bot.stopPolling();
  db.close();
  process.exit(0);
});

console.log('✅ Bot ready! Send /start to begin.');
