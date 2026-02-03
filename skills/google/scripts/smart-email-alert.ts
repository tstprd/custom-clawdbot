/**
 * Smart Email Alert - Notifie uniquement pour les NOUVEAUX emails importants
 * 
 * Garde un historique des emails déjà notifiés pour éviter les doublons.
 * Ne notifie que si un email important ET non vu arrive.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const STATE_FILE = join(process.env.HOME || process.env.USERPROFILE || "", ".clawdbot", "email-alert-state.json");

// Patterns d'emails à ignorer (newsletters, notifs)
const IGNORE_PATTERNS = [
  /money\s*stuff/i,
  /linkedin/i,
  /instagram/i,
  /vert\.eco/i,
  /vert,?\s*l'hebdo/i,
  /siège\s*arrière/i,
  /notifications?-noreply/i,
  /noreply.*google/i,
  /calendar-notification/i,
  /amazon.*shipment/i,
  /amazon.*expédi/i,
  /amazon.*tracking/i,
  /amazon.*livr/i,
  /confirmation.*commande/i,
  /confirmation.*réservation/i,
  /confirmé/i,
  /planity/i,
  /hellowatt/i,
  /booking\.com/i,
  /sncf.*connect/i,
  /sncf.*accuse.*réception/i,
  /bkk\.hu/i,
  /intersport/i,
  /doinsport/i,
  /ugc.*mailing/i,
  /conditions.*tarifaires/i,
  /mise.*jour.*conditions/i,
  /sumeria/i,
  /alerte.*tempête/i,
  /attestation.*achat/i,
  /google\s*play/i,
  /fedex/i,
  /tnt\.fr/i,
];

// Patterns d'emails importants (priorité)
const IMPORTANT_PATTERNS = [
  /paiement.*décliné/i,
  /incident/i,
  /urgent/i,
  /action\s*requise/i,
  /facture/i,
  /échéance/i,
  /relance/i,
  /impayé/i,
  /rappel\s*de\s*paiement/i,
];

// Mapping email -> message dense et actionnable
interface SmartMessage {
  pattern: RegExp;
  getMessage: (subject: string, from: string) => string;
}

const SMART_MESSAGES: SmartMessage[] = [
  // Paie
  { 
    pattern: /bulletin.*paie|fiche.*paie|peopledoc/i,
    getMessage: () => "💰 Paie dispo — virement sous 2-3j"
  },
  // Factures
  {
    pattern: /facture.*disponible|nouvelle.*facture/i,
    getMessage: (subject) => {
      const match = subject.match(/facture.*?(\w+)/i);
      return `📄 Facture ${match?.[1] || ''} à télécharger`;
    }
  },
  // Colis livré
  {
    pattern: /colis.*livré|a.*été.*livré|delivered/i,
    getMessage: () => "📦 Colis livré — va le chercher"
  },
  // Remboursement
  {
    pattern: /remboursement|remboursé/i,
    getMessage: () => "💸 Remboursement en cours"
  },
  // RDV confirmé
  {
    pattern: /rendez-vous.*confirmé|rdv.*confirmé|appointment.*confirmed/i,
    getMessage: (subject) => `✅ RDV confirmé`
  },
  // Paiement reçu
  {
    pattern: /paiement.*reçu|payment.*received/i,
    getMessage: () => "💳 Paiement reçu"
  },
  // Prélèvement
  {
    pattern: /prélèvement|prélevement/i,
    getMessage: () => "🏦 Prélèvement à venir — vérifie ton solde"
  },
  // Expiration
  {
    pattern: /expire|expiration|va.*expirer/i,
    getMessage: (subject) => `⏰ Expiration proche — action requise`
  },
  // Document dispo
  {
    pattern: /document.*disponible|nouveau.*document/i,
    getMessage: (subject, from) => {
      if (/impot|dgfip/i.test(from)) return "📋 Document impôts dispo";
      if (/banque|bank/i.test(from)) return "🏦 Document banque dispo";
      if (/assurance/i.test(from)) return "🛡️ Document assurance dispo";
      return "📋 Document à consulter";
    }
  },
  // Alerte sécurité
  {
    pattern: /connexion.*inhabituelle|suspicious|sécurité|security.*alert/i,
    getMessage: () => "🚨 Alerte sécurité — vérifie tes connexions"
  },
];

interface EmailThread {
  id: string;
  date: string;
  from: string;
  subject: string;
  labels: string[];
}

interface AlertState {
  notifiedIds: string[];
  lastCheck: string;
}

function loadState(): AlertState {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    } catch {
      return { notifiedIds: [], lastCheck: "" };
    }
  }
  return { notifiedIds: [], lastCheck: "" };
}

function saveState(state: AlertState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function isIgnored(from: string, subject: string): boolean {
  const combined = `${from} ${subject}`;
  return IGNORE_PATTERNS.some(pattern => pattern.test(combined));
}

function isImportant(from: string, subject: string): boolean {
  const combined = `${from} ${subject}`;
  return IMPORTANT_PATTERNS.some(pattern => pattern.test(combined));
}

function getUnreadEmails(account: string): EmailThread[] {
  try {
    const result = execSync(
      `gog gmail search "is:unread" --account ${account} --json --limit 20`,
      { encoding: "utf-8", timeout: 30000 }
    );
    const data = JSON.parse(result);
    return data.threads || [];
  } catch (error) {
    console.error(`Erreur récupération emails ${account}:`, error);
    return [];
  }
}

function main() {
  const state = loadState();
  const newImportantEmails: { account: string; thread: EmailThread }[] = [];
  
  const accounts = ["jmudes76000@gmail.com", "alejmurot@gmail.com"];
  
  for (const account of accounts) {
    const threads = getUnreadEmails(account);
    
    for (const thread of threads) {
      // Skip si déjà notifié
      if (state.notifiedIds.includes(thread.id)) {
        continue;
      }
      
      // Skip si c'est une newsletter/notif
      if (isIgnored(thread.from, thread.subject)) {
        continue;
      }
      
      // C'est un email important ou au moins pas une newsletter
      // On notifie seulement si c'est vraiment important OU si c'est un email perso/pro
      const dominated = thread.from.toLowerCase();
      const isPersonalOrWork = !dominated.includes("noreply") && 
                               !dominated.includes("notification") &&
                               !dominated.includes("newsletter");
      
      if (isImportant(thread.from, thread.subject) || isPersonalOrWork) {
        newImportantEmails.push({ account, thread });
        state.notifiedIds.push(thread.id);
      }
    }
  }
  
  // Nettoie les vieux IDs (garde les 200 derniers)
  if (state.notifiedIds.length > 200) {
    state.notifiedIds = state.notifiedIds.slice(-200);
  }
  
  state.lastCheck = new Date().toISOString();
  saveState(state);
  
  // Output
  if (newImportantEmails.length === 0) {
    console.log("NO_NEW_EMAILS");
  } else {
    const messages: string[] = [];
    
    for (const { account, thread } of newImportantEmails) {
      const from = thread.from;
      const subject = thread.subject;
      
      // Cherche un message intelligent
      let smartMsg: string | null = null;
      for (const sm of SMART_MESSAGES) {
        if (sm.pattern.test(subject) || sm.pattern.test(from)) {
          smartMsg = sm.getMessage(subject, from);
          break;
        }
      }
      
      if (smartMsg) {
        messages.push(smartMsg);
      } else {
        // Fallback: message dense basé sur l'expéditeur
        const senderName = from.split("<")[0].trim().replace(/"/g, '');
        const shortSubject = subject.length > 40 ? subject.slice(0, 40) + "..." : subject;
        
        if (isImportant(from, subject)) {
          messages.push(`⚠️ ${senderName}: ${shortSubject} — action requise`);
        } else {
          messages.push(`📬 ${senderName}: ${shortSubject}`);
        }
      }
    }
    
    // Dédupe et output
    const uniqueMessages = [...new Set(messages)];
    for (const msg of uniqueMessages) {
      console.log(msg);
    }
  }
}

main();
