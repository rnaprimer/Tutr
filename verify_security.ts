/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from 'pg'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function runTests() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })
  
  await client.connect()
  console.log("Connected to database")

  // Generate UUIDs for our mock users
  const { rows: [{ uuid: studentA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
  const { rows: [{ uuid: studentB }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
  const { rows: [{ uuid: parentA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
  const { rows: [{ uuid: parentB }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
  const { rows: [{ uuid: teacherA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)
  const { rows: [{ uuid: adminA }] } = await client.query(`SELECT gen_random_uuid() as uuid`)

  async function asUser(userId: string, role: string, fn: () => Promise<any>) {
    await client.query('SAVEPOINT test_start')
    try {
      // Temporarily become the user
      await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true)`)
      await client.query(`SELECT set_config('request.jwt.claims', '{"role":"authenticated"}', true)`)
      await client.query(`SET ROLE authenticated`)
      
      const res = await fn()
      return res
    } catch (err) {
      await client.query('ROLLBACK TO SAVEPOINT test_start')
      throw err
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT test_start')
    }
  }

  // First, setup our mock users in the DB as superuser
  await client.query('BEGIN')
  try {
    // Insert auth.users
    const authInsert = `INSERT INTO auth.users (id, aud, role, email) VALUES ($1, 'authenticated', 'authenticated', $2)`
    await client.query(authInsert, [studentA, 'studenta@test.com'])
    await client.query(authInsert, [studentB, 'studentb@test.com'])
    await client.query(authInsert, [parentA, 'parenta@test.com'])
    await client.query(authInsert, [parentB, 'parentb@test.com'])
    await client.query(authInsert, [teacherA, 'teachera@test.com'])
    await client.query(authInsert, [adminA, 'admin@test.com'])

    // Insert profiles
    const profileInsert = `INSERT INTO profiles (id, role, display_name) VALUES ($1, $2, $3)`
    await client.query(profileInsert, [studentA, 'STUDENT', 'Student A'])
    await client.query(profileInsert, [studentB, 'STUDENT', 'Student B'])
    await client.query(profileInsert, [parentA, 'PARENT', 'Parent A'])
    await client.query(profileInsert, [parentB, 'PARENT', 'Parent B'])
    await client.query(profileInsert, [teacherA, 'TEACHER', 'Teacher A'])
    await client.query(profileInsert, [adminA, 'SUPER_ADMIN', 'Admin A'])

    // Insert teacher_profiles (needs to be verified)
    await client.query(`INSERT INTO teacher_profiles (profile_id, status) VALUES ($1, 'VERIFIED')`, [teacherA])

    // Insert students
    await client.query(`INSERT INTO students (id, name) VALUES ($1, $2)`, [studentA, 'Student A'])
    await client.query(`INSERT INTO students (id, name) VALUES ($1, $2)`, [studentB, 'Student B'])

    // Link parent and student
    await client.query(`INSERT INTO parent_students (parent_id, student_id) VALUES ($1, $2)`, [parentA, studentA])

    console.log("Mock data setup successful. Running tests...")

    const createStudentRequest = async () => {
      return (await client.query(`
        INSERT INTO tutor_requests (student_id, teacher_id, status) 
        VALUES ($1, $2, 'PENDING') RETURNING id
      `, [studentA, teacherA])).rows[0].id
    }

    const createParentRequest = async () => {
      return (await client.query(`
        INSERT INTO tutor_requests (parent_id, student_id, teacher_id, status) 
        VALUES ($1, $2, $3, 'PENDING') RETURNING id
      `, [parentA, studentA, teacherA])).rows[0].id
    }

    let passed = 0
    let failed = 0

    const test = async (name: string, fn: () => Promise<any>, expectError = false) => {
      await client.query('SAVEPOINT outer_test_start')
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
        await client.query('ROLLBACK TO SAVEPOINT outer_test_start')
        if (expectError) {
          console.log(`✅ PASSED: ${name} (Got expected error: ${err.message})`)
          passed++
        } else {
          console.error(`❌ FAILED: ${name} (Got unexpected error: ${err.message})`)
          failed++
        }
      }
    }

    // 1. Student can create their own request
    await test("Student can create their own request", async () => {
      await asUser(studentA, 'STUDENT', async () => {
        await client.query(`INSERT INTO tutor_requests (student_id, teacher_id) VALUES ($1, $2)`, [studentA, teacherA])
      })
    })

    // 2. Student can read their own request
    await test("Student can read their own request", async () => {
      const reqId = await createStudentRequest()
      await asUser(studentA, 'STUDENT', async () => {
        const { rows } = await client.query(`SELECT * FROM tutor_requests WHERE id = $1`, [reqId])
        if (rows.length === 0) throw new Error("Could not read own request")
      })
    })

    // 3. Student can cancel their own PENDING request
    await test("Student can cancel their own PENDING request", async () => {
      const reqId = await createStudentRequest()
      return await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [reqId])
      })
    })

    // 4. Student cannot read another student's request
    await test("Student cannot read another student's request", async () => {
      const reqId = await createStudentRequest()
      return await asUser(studentB, 'STUDENT', async () => {
        const { rows } = await client.query(`SELECT * FROM tutor_requests WHERE id = $1`, [reqId])
        if (rows.length > 0) throw new Error("Should not be able to read")
      })
    })

    // 5. Student cannot update another student's request
    await test("Student cannot update another student's request", async () => {
      const reqId = await createStudentRequest()
      return await asUser(studentB, 'STUDENT', async () => {
        return await client.query(`UPDATE tutor_requests SET message = 'hacked' WHERE id = $1`, [reqId])
      })
    }, true)

    // 6. Student cannot change student_id
    await test("Student cannot change student_id", async () => {
      const reqId = await createStudentRequest()
      await asUser(studentA, 'STUDENT', async () => {
        await client.query(`UPDATE tutor_requests SET student_id = $1 WHERE id = $2`, [studentB, reqId])
      })
      // Now verify as admin
      const { rows } = await client.query(`SELECT student_id FROM tutor_requests WHERE id = $1`, [reqId])
      if (rows[0].student_id === studentB) throw new Error("student_id was changed")
    })

    // 7. Student cannot change parent_id
    await test("Student cannot change parent_id", async () => {
      const reqId = await createStudentRequest()
      await asUser(studentA, 'STUDENT', async () => {
        await client.query(`UPDATE tutor_requests SET parent_id = $1 WHERE id = $2`, [parentA, reqId])
      })
      const { rows } = await client.query(`SELECT parent_id FROM tutor_requests WHERE id = $1`, [reqId])
      if (rows[0].parent_id === parentA) throw new Error("parent_id was changed")
    })

    // 8. Student cannot change teacher_id
    await test("Student cannot change teacher_id", async () => {
      const reqId = await createStudentRequest()
      // Assume a random teacher UUID
      const fakeTeacher = '00000000-0000-0000-0000-000000000000'
      await asUser(studentA, 'STUDENT', async () => {
        await client.query(`UPDATE tutor_requests SET teacher_id = $1 WHERE id = $2`, [fakeTeacher, reqId])
      })
      const { rows } = await client.query(`SELECT teacher_id FROM tutor_requests WHERE id = $1`, [reqId])
      if (rows[0].teacher_id === fakeTeacher) throw new Error("teacher_id was changed")
    })

    // 9. Student cannot arbitrarily change request status
    await test("Student cannot arbitrarily change request status to ACCEPTED", async () => {
      const reqId = await createStudentRequest()
      return await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'ACCEPTED' WHERE id = $1`, [reqId])
      })
    }, true)

    // 10. Student can manage availability only for their own request
    await test("Student can manage availability for own request", async () => {
      const reqId = await createStudentRequest()
      return await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`INSERT INTO request_availability (request_id, day_of_week, start_time, end_time) VALUES ($1, 1, '10:00', '11:00')`, [reqId])
      })
    })

    // 11. Student cannot access another student's request_availability
    await test("Student cannot access another student's request_availability", async () => {
      const reqId = await createStudentRequest()
      await client.query(`INSERT INTO request_availability (request_id, day_of_week, start_time, end_time) VALUES ($1, 1, '10:00', '11:00')`, [reqId])
      
      return await asUser(studentB, 'STUDENT', async () => {
        const res = await client.query(`DELETE FROM request_availability WHERE request_id = $1`, [reqId])
        if (res.rowCount === 0) throw new Error("RLS blocked operation (rowCount 0)")
        return res
      })
    }, true)

    // Teacher CANCELLED test (NULL parent_id)
    await test("Teacher CANCELLED MUST FAIL on student request", async () => {
      const reqId = await createStudentRequest()
      return await asUser(teacherA, 'TEACHER', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [reqId])
      })
    }, true)

    // Parent CANCELLED test
    await test("Parent CANCELLED MUST SUCCEED on parent request", async () => {
      const reqId = await createParentRequest()
      return await asUser(parentA, 'PARENT', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [reqId])
      })
    })

    // Teacher CANCELLED MUST FAIL on parent request
    await test("Teacher CANCELLED MUST FAIL on parent request", async () => {
      const reqId = await createParentRequest()
      return await asUser(teacherA, 'TEACHER', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [reqId])
      })
    }, true)

    // Unrelated Parent CANCELLED MUST FAIL on student request
    await test("Unrelated Parent CANCELLED MUST FAIL on student request", async () => {
      const reqId = await createStudentRequest()
      return await asUser(parentB, 'PARENT', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = $1`, [reqId])
      })
    }, true)

    // Teacher ACCEPTED test
    await test("Teacher ACCEPTED MUST SUCCEED", async () => {
      const reqId = await createStudentRequest()
      return await asUser(teacherA, 'TEACHER', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'ACCEPTED' WHERE id = $1`, [reqId])
      })
    })

    // Teacher COMPLETED test (Requires ACCEPTED first)
    await test("Teacher COMPLETED MUST SUCCEED", async () => {
      const reqId = await createStudentRequest()
      return await asUser(teacherA, 'TEACHER', async () => {
        await client.query(`UPDATE tutor_requests SET status = 'ACCEPTED' WHERE id = $1`, [reqId])
        return await client.query(`UPDATE tutor_requests SET status = 'COMPLETED' WHERE id = $1`, [reqId])
      })
    })

    // Student COMPLETED MUST SUCCEED (Requires ACCEPTED first)
    await test("Student COMPLETED MUST SUCCEED", async () => {
      const reqId = await createStudentRequest()
      await asUser(teacherA, 'TEACHER', async () => {
        await client.query(`UPDATE tutor_requests SET status = 'ACCEPTED' WHERE id = $1`, [reqId])
      })
      return await asUser(studentA, 'STUDENT', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'COMPLETED' WHERE id = $1`, [reqId])
      })
    })

    // Unrelated student COMPLETED MUST FAIL
    await test("Unrelated student COMPLETED MUST FAIL", async () => {
      const reqId = await createStudentRequest()
      await asUser(teacherA, 'TEACHER', async () => {
        await client.query(`UPDATE tutor_requests SET status = 'ACCEPTED' WHERE id = $1`, [reqId])
      })
      return await asUser(studentB, 'STUDENT', async () => {
        return await client.query(`UPDATE tutor_requests SET status = 'COMPLETED' WHERE id = $1`, [reqId])
      })
    }, true)
    
    console.log(`\nResults: ${passed} passed, ${failed} failed`)

  } finally {
    // Rollback the entire transaction so we don't leave mock data
    await client.query('ROLLBACK')
    await client.end()
  }
}

runTests().catch(console.error)
