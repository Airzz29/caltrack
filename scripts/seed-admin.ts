import { neon } from '@neondatabase/serverless';
import bcryptjs from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (!process.env.ADMIN_USERNAME) {
  throw new Error('ADMIN_USERNAME environment variable is not set');
}

if (!process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD environment variable is not set');
}

const username = process.env.ADMIN_USERNAME;
const db = neon(process.env.DATABASE_URL);

async function seedAdmin() {
  const hash = await bcryptjs.hash(process.env.ADMIN_PASSWORD!, 12);

  await db`
    INSERT INTO users (username, email, password_hash, role, status, onboarding_completed)
    VALUES (
      ${username},
      ${username + '@admin.caltrack'},
      ${hash},
      'admin',
      'approved',
      true
    )
    ON CONFLICT (username) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      status = 'approved',
      onboarding_completed = true
  `;

  await db`
    INSERT INTO user_profiles (user_id, display_name, daily_calories, daily_protein_g)
    SELECT id, ${username}, 2500, 180 FROM users WHERE username = ${username}
    ON CONFLICT (user_id) DO NOTHING
  `;

  console.log('✅ Admin user created/updated');
  console.log('Username:', username);
  console.log('Password hash:', hash);
  console.log('→ Copy the hash above into ADMIN_PASSWORD_HASH in .env.local');

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
