interface RateLimitEntry {
  repoCount: number;
  chatCount: number;
  lastRepoTime: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const DAILY_REPO_LIMIT = 5;
const DAILY_CHAT_LIMIT = 30;
const HOURLY_REPO_LIMIT_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const GLOBAL_DAILY_REPO_LIMIT = 30;
const GLOBAL_DAILY_CHAT_LIMIT = 200;

let globalRepoCount = 0;
let globalChatCount = 0;
let globalResetTime = Date.now() + DAY_MS;

function checkGlobalLimits() {
  if (Date.now() > globalResetTime) {
    globalRepoCount = 0;
    globalChatCount = 0;
    globalResetTime = Date.now() + DAY_MS;
  }
}

function getEntry(ip: string): RateLimitEntry {
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { repoCount: 0, chatCount: 0, lastRepoTime: 0, resetTime: now + DAY_MS };
    store.set(ip, entry);
  }
  return entry;
}

export function repoRateLimit(req: any, res: any, next: any) {
  checkGlobalLimits();
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const entry = getEntry(ip as string);
  const now = Date.now();

  if (globalRepoCount >= GLOBAL_DAILY_REPO_LIMIT) {
    res.status(429).json({ error: "Service daily limit reached. Please try again tomorrow." });
    return;
  }

  if (entry.repoCount >= DAILY_REPO_LIMIT) {
    res.status(429).json({ error: "Daily limit reached. You can analyze 5 repos per day." });
    return;
  }

  if (now - entry.lastRepoTime < HOURLY_REPO_LIMIT_MS) {
    const waitMins = Math.ceil((HOURLY_REPO_LIMIT_MS - (now - entry.lastRepoTime)) / 60000);
    res.status(429).json({ error: `Please wait ${waitMins} minute(s) before analyzing another repo.` });
    return;
  }

  globalRepoCount++;
  entry.repoCount++;
  entry.lastRepoTime = now;
  next();
}

export function chatRateLimit(req: any, res: any, next: any) {
  checkGlobalLimits();
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const entry = getEntry(ip as string);

  if (globalChatCount >= GLOBAL_DAILY_CHAT_LIMIT) {
    res.status(429).json({ error: "Service daily limit reached. Please try again tomorrow." });
    return;
  }

  if (entry.chatCount >= DAILY_CHAT_LIMIT) {
    res.status(429).json({ error: "Daily chat limit reached. You can ask 30 questions per day." });
    return;
  }

  globalChatCount++;
  entry.chatCount++;
  next();
}