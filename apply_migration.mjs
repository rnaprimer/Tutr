import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = "postgresql://postgres.yxvzeakrcalxahvzvuxq:7077272102%40Dev@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({ connectionString: DATABASE_URL });

async function checkTest(name, query, expectedErrorSnippet) {
    try {
        await client.query(query);
        if (expectedErrorSnippet) {
            console.log(`❌ FAIL: ${name} (Expected error containing "${expectedErrorSnippet}", but it succeeded)`);
            return false;
        } else {
            console.log(`✅ PASS: ${name}`);
            return true;
        }
    } catch (e) {
        if (expectedErrorSnippet && e.message.includes(expectedErrorSnippet)) {
            console.log(`✅ PASS: ${name} (Caught expected error: ${e.message.split('\n')[0]})`);
            return true;
        } else if (expectedErrorSnippet) {
            console.log(`❌ FAIL: ${name} (Expected error "${expectedErrorSnippet}", but got "${e.message}")`);
            return false;
        } else {
            console.log(`❌ FAIL: ${name} (Unexpected error: ${e.message})`);
            return false;
        }
    }
}

async function setAuthUid(uid) {
    if (uid) {
        const claims = JSON.stringify({ sub: uid, role: 'authenticated' });
        await client.query(`SELECT set_config('request.jwt.claims', '${claims}', false)`);
        await client.query(`SELECT set_config('role', 'authenticated', false)`);
    } else {
        await client.query(`SELECT set_config('role', 'anon', false)`);
        await client.query(`SELECT set_config('request.jwt.claims', '', false)`);
    }
}

async function main() {
    console.log("Connecting to Supabase...");
    await client.connect();
    
    console.log("\n--- 1. APPLYING MIGRATION ---");
    const schemaSql = fs.readFileSync(path.resolve('./supabase/migrations/20260916164106_schema_and_security.sql'), 'utf-8');
    try {
        await client.query(schemaSql);
        console.log("✅ Migration applied successfully.");
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
        process.exit(1);
    }

    console.log("\n--- 2. EXTRACTING METADATA ---");
    const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
    console.log("Tables created:", tables.rows.map(r => r.tablename).join(', '));

    const enums = await client.query(`SELECT typname FROM pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid GROUP BY typname`);
    console.log("Enums created:", enums.rows.map(r => r.typname).join(', '));
    
    const buckets = await client.query(`SELECT id, public FROM storage.buckets WHERE id IN ('avatars', 'verification_documents')`);
    console.log("Buckets:", buckets.rows);

    const policies = await client.query(`SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'`);
    console.log("RLS Policies count:", policies.rows.length);

    console.log("\n--- 3. RUNNING SECURITY TESTS ---");
    // Mock UUIDs
    const teacherA = '11111111-1111-1111-1111-111111111111';
    const teacherB = '22222222-2222-2222-2222-222222222222';
    const parentA = '33333333-3333-3333-3333-333333333333';
    const verificationAdmin = '55555555-5555-5555-5555-555555555555';
    
    // Setup Mock Data
    await client.query(`SELECT set_config('role', 'postgres', false)`);
    try {
        await client.query(`
            INSERT INTO auth.users (id) VALUES ('${teacherA}'), ('${teacherB}'), ('${parentA}'), ('${verificationAdmin}') ON CONFLICT DO NOTHING;
            INSERT INTO profiles (id, role, display_name) VALUES 
                ('${teacherA}', 'TEACHER', 'Teacher A'),
                ('${teacherB}', 'TEACHER', 'Teacher B'),
                ('${parentA}', 'PARENT', 'Parent A'),
                ('${verificationAdmin}', 'ADMIN', 'Verification Admin') ON CONFLICT DO NOTHING;
            INSERT INTO admin_users (id, role) VALUES ('${verificationAdmin}', 'VERIFICATION_ADMIN') ON CONFLICT DO NOTHING;
            INSERT INTO teacher_profiles (profile_id, status) VALUES 
                ('${teacherA}', 'VERIFIED'),
                ('${teacherB}', 'DRAFT') ON CONFLICT (profile_id) DO UPDATE SET status = EXCLUDED.status;
            INSERT INTO students (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Student A') ON CONFLICT DO NOTHING;
            INSERT INTO parent_students (parent_id, student_id) VALUES ('${parentA}', '00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
            INSERT INTO tutor_requests (id, parent_id, student_id, teacher_id, status) VALUES 
                ('20000000-0000-0000-0000-000000000001', '${parentA}', '00000000-0000-0000-0000-000000000001', '${teacherA}', 'PENDING') ON CONFLICT DO NOTHING;
        `);
    } catch(e) {
        console.log("Failed to seed mock data:", e.message);
    }

    // Test 1: Anon access profiles
    await setAuthUid(null);
    await checkTest('Anon cannot read profiles directly', 'SELECT * FROM profiles', 'permission denied for table profiles');
    
    // Test 2: Anon safe public view
    await setAuthUid(null);
    const pub = await client.query('SELECT * FROM public_tutor_profiles');
    console.log(`✅ PASS: Anon can read public_tutor_profiles (Rows: ${pub.rows.length})`);

    // Test 3: Unverified hidden
    const unv = await client.query(`SELECT * FROM public_tutor_profiles WHERE teacher_id = '${teacherB}'`);
    if (unv.rows.length === 0) console.log('✅ PASS: Unverified teacher hidden from public search');
    else console.log('❌ FAIL: Unverified teacher found in public search');

    // Test 4: Role escalation
    await setAuthUid(teacherA);
    await checkTest('Role Escalation Prevented (Teacher trying to insert to admin_users)', 
        `INSERT INTO admin_users (id, role) VALUES ('${teacherA}', 'SUPER_ADMIN')`, 
        'permission denied for table admin_users');

    // Test 5: Teacher Status Escalation (Trigger Freeze)
    await setAuthUid(teacherA);
    await client.query(`UPDATE teacher_profiles SET status = 'SUSPENDED' WHERE profile_id = '${teacherA}'`);
    const statusRes = await client.query(`SELECT status FROM teacher_profiles WHERE profile_id = '${teacherA}'`);
    if (statusRes.rows[0].status === 'VERIFIED') console.log('✅ PASS: Trigger prevented teacher from escalating own status');
    else console.log(`❌ FAIL: Teacher was able to change status to ${statusRes.rows[0].status}`);

    // Test 6: Verification Admin can change status
    await setAuthUid(verificationAdmin);
    await client.query(`UPDATE teacher_profiles SET status = 'SUSPENDED' WHERE profile_id = '${teacherA}'`);
    const statusRes2 = await client.query(`SELECT status FROM teacher_profiles WHERE profile_id = '${teacherA}'`);
    if (statusRes2.rows[0].status === 'SUSPENDED') console.log('✅ PASS: Verification Admin can change teacher status');
    else console.log('❌ FAIL: Verification Admin failed to change status');

    // Test 7: Freeze Ownership Trigger on Requests
    await setAuthUid(parentA);
    await client.query(`UPDATE tutor_requests SET student_id = '00000000-0000-0000-0000-000000000002' WHERE id = '20000000-0000-0000-0000-000000000001'`);
    const reqRes = await client.query(`SELECT student_id FROM tutor_requests WHERE id = '20000000-0000-0000-0000-000000000001'`);
    if (reqRes.rows[0].student_id === '00000000-0000-0000-0000-000000000001') console.log('✅ PASS: Ownership freeze trigger prevented changing student_id');
    else console.log('❌ FAIL: student_id was changed');

    // Test 8: State Transition (Teacher cannot cancel pending)
    await setAuthUid(teacherA);
    await checkTest('Teacher cannot cancel pending request',
        `UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = '20000000-0000-0000-0000-000000000001'`,
        'Only the parent can cancel a pending request');

    // Cleanup mock data
    await client.query(`SELECT set_config('role', 'postgres', false)`);
    await client.query(`DELETE FROM auth.users WHERE id IN ('${teacherA}', '${teacherB}', '${parentA}', '${verificationAdmin}')`);
    
    await client.end();
}

main().catch(console.error);
