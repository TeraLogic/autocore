import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./src/db/tickets.json');

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
  if (!db.tickets[userId]) {
    db.tickets[userId] = {
      channel_id: channelId,
      ticket_message_id: ticketMessageId,
      problems: {},
    };
  }
  saveDB(db);
}

export function updateTicket(userId, problemId, updateData) {
  const db = loadDB();
  if (!db.tickets[userId]) return;
  if (!db.tickets[userId].problems) db.tickets[userId].problems = {};
  if (!db.tickets[userId].problems[problemId])
    db.tickets[userId].problems[problemId] = {};

  db.tickets[userId].problems[problemId] = {
    ...db.tickets[userId].problems[problemId],
    ...updateData,
  };
  saveDB(db);
}

export function deleteTicket(userId) {
  const db = loadDB();
  delete db.tickets[userId];
  saveDB(db);
}

export function getLastProblemId(ticketData) {
  const problemIds = Object.keys(ticketData.problems || {})
    .map(Number)
    .sort((a, b) => b - a);
  return problemIds.length > 0 ? problemIds[0].toString() : '1';
}
