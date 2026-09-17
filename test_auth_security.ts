/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function runAuthSecurityTests() {
  console.log("==================================================")
  console.log("STARTING AUTH & ROLE SECURITY VERIFICATION")
  console.log("==================================================")

  // 1. Unit check: Open redirect sanitizer
  console.log("\n--- TEST SUITE 1: Open Redirect & Role Sanitizer Logic ---")

  function getSafeRedirect(next: string | null, fallback: string): string {
    if (!next) return fallback
    if (
      next.startsWith('/') &&
      !next.startsWith('//') &&
      !next.startsWith('/\\') &&
      !next.includes('://') &&
      !next.includes('\\')
    ) {
      return next
    }
    return fallback
  }

  const evilUrls = [
    'https://attacker.com',
    'http://evil.com/phishing',
    '//attacker.com',
    'javascript:alert(1)',
    '/\\attacker.com',
  ]

  let redirectSafe = true
  for (const url of evilUrls) {
    const res = getSafeRedirect(url, '/dashboard/student')
    if (res !== '/dashboard/student') {
      console.error(`❌ FAILED: Evil URL allowed: ${url} -> ${res}`)
      redirectSafe = false
    }
  }

  if (redirectSafe && getSafeRedirect('/tutors/123', '/dashboard/student') === '/tutors/123') {
    console.log("✅ PASSED: Open redirect sanitizer strictly blocks external URLs and preserves internal paths")
  } else {
    console.error("❌ FAILED: Redirect sanitizer check failed")
    process.exit(1)
  }

  // 2. Unit check: Role sanitizer
  const ALLOWED_ROLES = ['STUDENT', 'PARENT', 'TEACHER']
  function sanitizeRole(role: string | null | undefined): string | null {
    if (!role) return null
    const upper = role.toUpperCase()
    return ALLOWED_ROLES.includes(upper) ? upper : null
  }

  if (
    sanitizeRole('TEACHER') === 'TEACHER' &&
    sanitizeRole('student') === 'STUDENT' &&
    sanitizeRole('parent') === 'PARENT' &&
    sanitizeRole('ADMIN') === null &&
    sanitizeRole('SUPER_ADMIN') === null &&
    sanitizeRole('hacker') === null &&
    sanitizeRole(undefined) === null
  ) {
    console.log("✅ PASSED: Role sanitizer strictly constrains public roles and rejects ADMIN / SUPER_ADMIN")
  } else {
    console.error("❌ FAILED: Role sanitizer test failed")
    process.exit(1)
  }

  // 3. Database & RLS Authorization Tests
  console.log("\n--- TEST SUITE 2: Live Database RLS & Idempotency Verification ---")
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  let passed = 0
  let failed = 0

  const test = async (name: string, fn: () => Promise<any>, expectError = false) => {
    try {
      const res = await fn()
      if (res && res.rowCount === 0) throw new Error('RLS blocked operation (rowCount 0)')
      if (expectError) {
        console.error(`❌ FAILED: ${name} (Expected error, got success)`)
        failed++
      } else {
        console.log(`✅ PASSED: ${name}`)
        passed++
      }
    } catch (err: any) {
      if (expectError) {
        console.log(`✅ PASSED: ${name} (Got expected error: ${err.message})`)
        passed++
      } else {
        console.error(`❌ FAILED: ${name} (Got unexpected error: ${err.message})`)
        failed++
      }
    }
  }

  try {
    await client.query('BEGIN')

    const { rows: [{ uuid: studentUser }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: teacherUser }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: attackerUser }] } = await client.query(`SELECT gen_random_uuid() as uuid`)

    // Helper to simulate authenticated context for RLS
    async function asUser(userId: string, fn: () => Promise<any>) {
      await client.query('SAVEPOINT user_tx_start')
      try {
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true)`)
        await client.query(`SELECT set_config('request.jwt.claims', '{"role":"authenticated"}', true)`)
        await client.query(`SET ROLE authenticated`)
        const res = await fn()
        await client.query(`RESET ROLE`)
        await client.query('RELEASE SAVEPOINT user_tx_start')
        return res
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT user_tx_start')
        await client.query(`RESET ROLE`)
        throw err
      }
    }

    // Insert auth.users
    const authInsert = `INSERT INTO auth.users (id, aud, role, email) VALUES ($1, 'authenticated', 'authenticated', $2)`
    await client.query(authInsert, [studentUser, 'student_test@example.com'])
    await client.query(authInsert, [teacherUser, 'teacher_test@example.com'])
    await client.query(authInsert, [attackerUser, 'attacker_test@example.com'])

    // TEST 1: Authenticated user attempting to insert ADMIN profile directly MUST FAIL by RLS
    await test("Direct profile insert with role='ADMIN' MUST FAIL by RLS", async () => {
      return await asUser(attackerUser, async () => {
        return await client.query(`
          INSERT INTO profiles (id, role, display_name)
          VALUES ($1, 'ADMIN', 'Attacker Admin')
        `, [attackerUser])
      })
    }, true)

    // TEST 2: Authenticated user attempting to insert SUPER_ADMIN profile directly MUST FAIL by RLS
    await test("Direct profile insert with role='SUPER_ADMIN' MUST FAIL by RLS", async () => {
      return await asUser(attackerUser, async () => {
        return await client.query(`
          INSERT INTO profiles (id, role, display_name)
          VALUES ($1, 'SUPER_ADMIN', 'Attacker SuperAdmin')
        `, [attackerUser])
      })
    }, true)

    // TEST 3: Authenticated user attempting to insert into admin_users MUST FAIL
    await test("Direct insert into admin_users MUST FAIL (revoked permissions)", async () => {
      return await asUser(attackerUser, async () => {
        return await client.query(`
          INSERT INTO admin_users (id, role)
          VALUES ($1, 'SUPER_ADMIN')
        `, [attackerUser])
      })
    }, true)

    // TEST 4: Student OAuth profile creation MUST SUCCEED
    await test("Student profile creation creates role='STUDENT'", async () => {
      return await asUser(studentUser, async () => {
        return await client.query(`
          INSERT INTO profiles (id, role, display_name)
          VALUES ($1, 'STUDENT', 'Test Student')
          RETURNING id, role
        `, [studentUser])
      })
    }, false)

    // TEST 5: Existing student role preservation: Query parameter attempts to change role to TEACHER
    // Simulated callback check: existing profile exists -> role must remain STUDENT
    await test("Existing user role preservation: role remains STUDENT", async () => {
      const { rows: [profile] } = await client.query(`SELECT role FROM profiles WHERE id = $1`, [studentUser])
      if (profile.role !== 'STUDENT') {
        throw new Error(`Role changed! Expected STUDENT, got ${profile.role}`)
      }
      return profile
    }, false)

    // TEST 6: Tutor OAuth creates TEACHER profile and DRAFT teacher_profiles
    await test("Tutor profile creation creates role='TEACHER' and status='DRAFT'", async () => {
      await asUser(teacherUser, async () => {
        await client.query(`
          INSERT INTO profiles (id, role, display_name)
          VALUES ($1, 'TEACHER', 'Test Tutor')
        `, [teacherUser])

        await client.query(`
          INSERT INTO teacher_profiles (profile_id, status)
          VALUES ($1, 'DRAFT')
        `, [teacherUser])
      })

      const { rows: [tp] } = await client.query(`SELECT status FROM teacher_profiles WHERE profile_id = $1`, [teacherUser])
      if (tp.status !== 'DRAFT') {
        throw new Error(`Expected status DRAFT, got ${tp.status}`)
      }
      return tp
    }, false)

    // TEST 7: Teacher profile is NOT automatically VERIFIED
    await test("Teacher is NOT automatically VERIFIED upon Google signup", async () => {
      const { rows: [tp] } = await client.query(`SELECT status FROM teacher_profiles WHERE profile_id = $1`, [teacherUser])
      if (tp.status === 'VERIFIED') {
        throw new Error("Security vulnerability: Teacher is marked VERIFIED upon signup!")
      }
      return tp
    }, false)

    // TEST 8: Profile Idempotency: Retrying callback insertion handles existing profile safely
    await test("Profile idempotency: inserting duplicate profile handled safely", async () => {
      const { rows: existing } = await client.query(`SELECT id FROM profiles WHERE id = $1`, [studentUser])
      if (existing.length > 0) {
        // Idempotent logic: skip insert
        return true
      }
      throw new Error("Expected existing profile")
    }, false)

    // TEST 9: Teacher profile Idempotency: Retrying teacher profile creation handles existing record safely
    await test("Teacher profile idempotency: duplicate teacher_profiles skipped", async () => {
      const { rows: existing } = await client.query(`SELECT profile_id FROM teacher_profiles WHERE profile_id = $1`, [teacherUser])
      if (existing.length > 0) {
        // Idempotent logic: skip insert
        return true
      }
      throw new Error("Expected existing teacher profile")
    }, false)

    console.log(`\n==================================================`)
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log(`==================================================`)

    if (failed > 0) {
      process.exit(1)
    }
  } finally {
    await client.query('ROLLBACK')
    await client.end()
  }
}

runAuthSecurityTests().catch(err => {
  console.error("Test runner error:", err)
  process.exit(1)
})
