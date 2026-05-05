import bcrypt from "bcryptjs";

const PASSWORD_DEBUG = process.env.AUTH_DEBUG === "true";

function passwordLog(message: string, data?: unknown) {
  if (!PASSWORD_DEBUG) return;
  if (data !== undefined) {
    console.log(`[PASSWORD DEBUG] ${message}`, data);
  } else {
    console.log(`[PASSWORD DEBUG] ${message}`);
  }
}

export async function hashPassword(password: string) {
  passwordLog("hashPassword called", {
    passwordLength: password.length,
  });

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);

  passwordLog("hashPassword finished", {
    saltRounds: 12,
    hashLength: hash.length,
    hashPreview: hash.slice(0, 10) + "...",
  });

  return hash;
}

export async function verifyPassword(password: string, hash: string) {
  passwordLog("verifyPassword called", {
    passwordLength: password.length,
    hashExists: !!hash,
    hashLength: hash?.length ?? 0,
    hashPreview: hash ? hash.slice(0, 10) + "..." : null,
  });

  const result = await bcrypt.compare(password, hash);

  passwordLog("verifyPassword finished", {
    result,
  });

  return result;
}