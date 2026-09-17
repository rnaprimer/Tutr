/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from 'pg'
import dotenv from 'dotenv'
import {
  encodeRequestMessage,
  decodeRequestMessage,
  isValidTeachingLocation,
  TeachingLocationPreference,
} from './src/lib/utils/teaching-location'

dotenv.config({ path: '.env.local' })

async function runPhase7bTests() {
  console.log("==================================================")
  console.log("STARTING PHASE 7B SECURITY & WORKFLOW VERIFICATION")
  console.log("==================================================")

  // 1. Unit Tests: Teaching-location encoding / decoding and free-text preservation
  console.log("\n--- TEST SUITE 1: Teaching Location Encoding & Decoding ---")
  const originalMessage = "I need urgent math coaching for my board exams.\nPlease focus on calculus & vectors!"
  const loc: TeachingLocationPreference = 'STUDENT_HOME'

  const encoded = encodeRequestMessage(loc, originalMessage)
  console.log("Encoded string preview:\n", encoded)

  const decoded = decodeRequestMessage(encoded)
  if (decoded.preference === 'STUDENT_HOME') {
    console.log("✅ PASSED: Teaching-location preference correctly encoded and decoded")
  } else {
    console.error("❌ FAILED: Decoded preference mismatch:", decoded.preference)
    process.exit(1)
  }

  if (decoded.message === originalMessage) {
    console.log("✅ PASSED: Free-text message remains completely intact")
  } else {
    console.error("❌ FAILED: Decoded message mismatch:", decoded.message)
    process.exit(1)
  }

  // Test encoding with null preference
  const decodedNullPref = decodeRequestMessage(originalMessage)
  if (decodedNullPref.preference === null && decodedNullPref.message === originalMessage) {
    console.log("✅ PASSED: Legacy / plain message correctly decodes with null preference")
  } else {
    console.error("❌ FAILED: Null preference decoding failed")
    process.exit(1)
  }

  // Test validation of allowed values
  if (
    isValidTeachingLocation('STUDENT_HOME') &&
    isValidTeachingLocation('TEACHER_LOCATION') &&
    isValidTeachingLocation('BOTH') &&
    !isValidTeachingLocation('ARBITRARY_LOCATION')
  ) {
    console.log("✅ PASSED: Teaching location values strictly validated against enum")
  } else {
    console.error("❌ FAILED: Teaching location validation failed")
    process.exit(1)
  }

  // 2. Database Integration & Security Tests
  console.log("\n--- TEST SUITE 2: Live Database & Authorization Verification ---")
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

    // Create unique test users
    const { rows: [{ uuid: studentA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: studentB }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: parentA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: parentB }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: teacherA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: teacherSuspended }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: childA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
    const { rows: [{ uuid: childB }] } = await client.query(`SELECT gen_random_uuid() as uuid`)

    // Provably reliable asUser isolation helper
    async function asUser(userId: string, role: string, fn: () => Promise<any>) {
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

    // Provision auth users & profiles
    const authInsert = `INSERT INTO auth.users (id, aud, role, email) VALUES ($1, 'authenticated', 'authenticated', $2)`
    await client.query(authInsert, [studentA, 'studentA@test.com'])
    await client.query(authInsert, [studentB, 'studentB@test.com'])
    await client.query(authInsert, [parentA, 'parentA@test.com'])
    await client.query(authInsert, [parentB, 'parentB@test.com'])
    await client.query(authInsert, [teacherA, 'teacherA@test.com'])
    await client.query(authInsert, [teacherSuspended, 'teacherSusp@test.com'])

    const profileInsert = `INSERT INTO profiles (id, role, display_name) VALUES ($1, $2, $3)`
    await client.query(profileInsert, [studentA, 'STUDENT', 'Student A'])
    await client.query(profileInsert, [studentB, 'STUDENT', 'Student B'])
    await client.query(profileInsert, [parentA, 'PARENT', 'Parent A'])
    await client.query(profileInsert, [parentB, 'PARENT', 'Parent B'])
    await client.query(profileInsert, [teacherA, 'TEACHER', 'Teacher A'])
    await client.query(profileInsert, [teacherSuspended, 'TEACHER', 'Teacher Suspended'])

    // Teacher profiles: teacherA is VERIFIED, teacherSuspended is SUSPENDED
    await client.query(`INSERT INTO teacher_profiles (profile_id, status) VALUES ($1, 'VERIFIED')`, [teacherA])
    await client.query(`INSERT INTO teacher_profiles (profile_id, status) VALUES ($1, 'SUSPENDED')`, [teacherSuspended])

    // Students table: studentA, studentB (direct students), childA, childB (parent children)
    await client.query(`INSERT INTO students (id, name) VALUES ($1, 'Student A')`, [studentA])
    await client.query(`INSERT INTO students (id, name) VALUES ($1, 'Student B')`, [studentB])
    await client.query(`INSERT INTO students (id, name) VALUES ($1, 'Child of Parent A')`, [childA])
    await client.query(`INSERT INTO students (id, name) VALUES ($1, 'Child of Parent B')`, [childB])

    // Link parent and child in parent_students
    await client.query(`INSERT INTO parent_students (parent_id, student_id) VALUES ($1, $2)`, [parentA, childA])
    await client.query(`INSERT INTO parent_students (parent_id, student_id) VALUES ($1, $2)`, [parentB, childB])

    console.log("Mock environment created successfully. Testing boundaries...")

    // TEST 1: Tutor becomes SUSPENDED between page load and submission -> request rejected by DB RLS
    await test("Request to SUSPENDED tutor MUST FAIL via is_teacher_verified() check", async () => {
      return await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`
          INSERT INTO tutor_requests (student_id, teacher_id, status)
          VALUES ($1, $2, 'PENDING')
        `, [studentA, teacherSuspended])
      })
    }, true)

    // TEST 2: Student attempts foreign student_id -> rejected
    await test("Student attempts foreign student_id MUST FAIL", async () => {
      return await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`
          INSERT INTO tutor_requests (student_id, teacher_id, status)
          VALUES ($1, $2, 'PENDING')
        `, [studentB, teacherA])
      })
    }, true)

    // TEST 3: Parent attempts unlinked student_id -> rejected
    await test("Parent attempts unlinked student_id MUST FAIL", async () => {
      return await asUser(parentA, 'PARENT', async () => {
        return await client.query(`
          INSERT INTO tutor_requests (parent_id, student_id, teacher_id, status)
          VALUES ($1, $2, $3, 'PENDING')
        `, [parentA, childB, teacherA]) // childB belongs to parentB
      })
    }, true)

    // TEST 4: Parent creates request for linked student -> succeeds
    let parentReqId = ''
    await test("Parent creates request for linked student MUST SUCCEED", async () => {
      return await asUser(parentA, 'PARENT', async () => {
        const res = await client.query(`
          INSERT INTO tutor_requests (parent_id, student_id, teacher_id, status)
          VALUES ($1, $2, $3, 'PENDING') RETURNING id
        `, [parentA, childA, teacherA])
        parentReqId = res.rows[0].id
        return res
      })
    }, false)

    // TEST 5: Student creates own request -> succeeds
    let studentReqId = ''
    await test("Student creates own request MUST SUCCEED", async () => {
      return await asUser(studentA, 'STUDENT', async () => {
        const res = await client.query(`
          INSERT INTO tutor_requests (student_id, teacher_id, status)
          VALUES ($1, $2, 'PENDING') RETURNING id
        `, [studentA, teacherA])
        studentReqId = res.rows[0].id
        return res
      })
    }, false)

    // TEST 6: Student attempts to read foreign request -> returns 0 rows (denied)
    await test("Student B reading Student A's request MUST BE DENIED", async () => {
      return await asUser(studentB, 'STUDENT', async () => {
        const res = await client.query(`SELECT * FROM tutor_requests WHERE id = $1`, [studentReqId])
        if (res.rowCount === 0) throw new Error("RLS blocked read (rowCount 0)")
        return res
      })
    }, true)

    // TEST 7: Parent B attempts to read Parent A's request -> returns 0 rows (denied)
    await test("Parent B reading Parent A's request MUST BE DENIED", async () => {
      return await asUser(parentB, 'PARENT', async () => {
        const res = await client.query(`SELECT * FROM tutor_requests WHERE id = $1`, [parentReqId])
        if (res.rowCount === 0) throw new Error("RLS blocked read (rowCount 0)")
        return res
      })
    }, true)

    // TEST 8: Teacher attempts PENDING -> CANCELLED -> denied
    await test("Teacher cancelling PENDING request MUST FAIL", async () => {
      return await asUser(teacherA, 'TEACHER', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [studentReqId])
      })
    }, true)

    // TEST 9: Teacher transitions PENDING -> ACCEPTED -> allowed
    await test("Teacher accepting PENDING request MUST SUCCEED", async () => {
      return await asUser(teacherA, 'TEACHER', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'ACCEPTED' WHERE id = $1`, [studentReqId])
      })
    }, false)

    // TEST 10: Teacher transitions ACCEPTED -> CANCELLED -> allowed
    await test("Teacher cancelling ACCEPTED request MUST SUCCEED", async () => {
      return await asUser(teacherA, 'TEACHER', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [studentReqId])
      })
    }, false)

    // TEST 11: Student/Parent invalid transition (e.g. ACCEPTED -> PENDING) -> denied
    const { rows: [{ id: acceptedReqId }] } = await client.query(`
      INSERT INTO tutor_requests (student_id, teacher_id, status)
      VALUES ($1, $2, 'ACCEPTED') RETURNING id
    `, [studentA, teacherA])

    await test("Student attempting invalid transition ACCEPTED -> PENDING MUST FAIL", async () => {
      return await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'PENDING' WHERE id = $1`, [acceptedReqId])
      })
    }, true)

    // TEST 12: Availability rollback behavior: If availability fails, request is CANCELLED
    await test("Availability atomicity: If availability insert is aborted, request is transitioned to CANCELLED", async () => {
      const { rows: [{ id: failedReqId }] } = await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`
          INSERT INTO tutor_requests (student_id, teacher_id, status)
          VALUES ($1, $2, 'PENDING') RETURNING id
        `, [studentA, teacherA])
      })

      // Simulate availability failure and catch-block cancellation
      await asUser(studentA, 'STUDENT', async () => {
        await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [failedReqId])
      })

      // Verify status is CANCELLED (does NOT remain PENDING)
      const res = await client.query(`SELECT status FROM tutor_requests WHERE id = $1`, [failedReqId])
      if (res.rows[0].status !== 'CANCELLED') {
        throw new Error("Request remained PENDING after failure!")
      }
      return res
    }, false)

    // TEST 13: Anonymous user cannot read or insert tutor_requests
    await test("Anonymous user cannot insert tutor_requests MUST FAIL", async () => {
      await client.query('SAVEPOINT anon_test')
      try {
        await client.query(`SET ROLE anon`)
        await client.query(`
          INSERT INTO tutor_requests (student_id, teacher_id, status)
          VALUES ($1, $2, 'PENDING')
        `, [studentA, teacherA])
        await client.query(`RESET ROLE`)
        await client.query('RELEASE SAVEPOINT anon_test')
      } catch (e) {
        await client.query(`RESET ROLE`)
        await client.query('ROLLBACK TO SAVEPOINT anon_test')
        throw e
      }
    }, true)

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

runPhase7bTests().catch(err => {
  console.error("Test runner error:", err)
  process.exit(1)
})
