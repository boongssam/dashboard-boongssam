import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const DEFAULT_DB = {
  students: [],
  attendance: {},
  announcements: [],
  assignments: [],
  ddays: [],
  polls: [],
  newsletters: [],
  quickLinks: [],
  weeklyPlans: {},
  studentRecords: {},
  settings: {
    darkMode: false,
    fontSize: 'medium',
    calendarId1: '',
    calendarId2: '',
    calendarId3: '',
    thermometerGoal: 1500,
    thermometerReward: '',
    dashboardLayouts: null,
  },
};

export async function GET() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: Request) {
  const body = await req.json();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(body, null, 2));
  return NextResponse.json({ ok: true });
}
