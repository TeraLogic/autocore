import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./src/db/tickets.json');

async function getAllTickets() {
  const db = await loadDB();
  return db.tickets || {};
}

export async function reloadTicketListeners(client) {
  const tickets = await getAllTickets();
  if (!tickets || Object.keys(tickets).length === 0) return;

  console.log(`Lade gespeicherte Ticket-Nachrichten (${Object.keys(tickets).length})...`);

  for (const userId in tickets) {
    const ticket = tickets[userId];

    if (!ticket.ticket_message_id || !ticket.channel_id) continue;

    try {
      const channel = await client.channels.fetch(ticket.channel_id);
      if (!channel || !channel.isTextBased()) continue;

      const message = await channel.messages.fetch(ticket.ticket_message_id);
      if (!message) continue;
    } catch (err) {
      console.error(`Fehler beim Laden des Tickets für ${userId}:`, err);
    }
  }
}

function loadDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      saveDB({ tickets: {} });
      return { tickets: {} };
    }
    const fileContent = fs.readFileSync(dbPath, 'utf-8');
    return fileContent.trim() ? JSON.parse(fileContent) : { tickets: {} };
  } catch (error) {
    console.error('Fehler beim Laden der Datenbank:', error);
    return { tickets: {} };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fehler beim Speichern der Datenbank:', error);
  }
}

export function getTicketData(userId) {
  const db = loadDB();
  return db.tickets[userId] || null;
}

export function saveTicket(userId, channelId, ticketMessageId) {
  const db = loadDB();
  db.tickets[userId] = db.tickets[userId] || {
    channel_id: channelId,
    ticket_message_id: ticketMessageId,
    problems: {},
  };
  saveDB(db);
}

export function updateTicket(userId, problemId, updateData) {
  const db = loadDB();
  if (!db.tickets[userId]) return;
  db.tickets[userId].problems = db.tickets[userId].problems || {};
  db.tickets[userId].problems[problemId] = {
    ...db.tickets[userId].problems[problemId],
    ...updateData,
  };
  saveDB(db);
}

export function deleteTicket(userId) {
  const db = loadDB();
  if (db.tickets[userId]) {
    delete db.tickets[userId];
    saveDB(db);
  }
}

export function getLastProblemId(ticketData) {
  const problemIds = Object.keys(ticketData.problems || {})
    .map(Number)
    .sort((a, b) => b - a);
  return problemIds.length > 0 ? problemIds[0].toString() : '1';
}
