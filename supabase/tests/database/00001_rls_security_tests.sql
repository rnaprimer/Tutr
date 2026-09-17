BEGIN;
SELECT plan(19);

-- Create mock users for testing
SELECT tests.create_supabase_user('teacher_a');
SELECT tests.create_supabase_user('teacher_b');
SELECT tests.create_supabase_user('parent_a');
SELECT tests.create_supabase_user('parent_b');
SELECT tests.create_supabase_user('super_admin');
SELECT tests.create_supabase_user('verification_admin');

-- Set up basic profiles as postgres
INSERT INTO profiles (id, role, display_name) VALUES 
    (tests.get_supabase_uid('teacher_a'), 'TEACHER', 'Teacher A'),
    (tests.get_supabase_uid('teacher_b'), 'TEACHER', 'Teacher B'),
    (tests.get_supabase_uid('parent_a'), 'PARENT', 'Parent A'),
    (tests.get_supabase_uid('parent_b'), 'PARENT', 'Parent B'),
    (tests.get_supabase_uid('super_admin'), 'SUPER_ADMIN', 'Super Admin'),
    (tests.get_supabase_uid('verification_admin'), 'ADMIN', 'Verification Admin');

INSERT INTO admin_users (id, role) VALUES 
    (tests.get_supabase_uid('super_admin'), 'SUPER_ADMIN'),
    (tests.get_supabase_uid('verification_admin'), 'VERIFICATION_ADMIN');

INSERT INTO teacher_profiles (profile_id, status) VALUES 
    (tests.get_supabase_uid('teacher_a'), 'VERIFIED'),
    (tests.get_supabase_uid('teacher_b'), 'DRAFT');

INSERT INTO students (id, name) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Student A'),
    ('00000000-0000-0000-0000-000000000002', 'Student B');

INSERT INTO parent_students (parent_id, student_id) VALUES 
    (tests.get_supabase_uid('parent_a'), '00000000-0000-0000-0000-000000000001'),
    (tests.get_supabase_uid('parent_b'), '00000000-0000-0000-0000-000000000002');

INSERT INTO verification_documents (id, teacher_id, category, file_path) VALUES 
    ('10000000-0000-0000-0000-000000000001', tests.get_supabase_uid('teacher_a'), 'IDENTITY', 'a.jpg'),
    ('10000000-0000-0000-0000-000000000002', tests.get_supabase_uid('teacher_b'), 'IDENTITY', 'b.jpg');

INSERT INTO tutor_requests (id, parent_id, student_id, teacher_id, status) VALUES 
    ('20000000-0000-0000-0000-000000000001', tests.get_supabase_uid('parent_a'), '00000000-0000-0000-0000-000000000001', tests.get_supabase_uid('teacher_a'), 'PENDING');


-- TEST SUITE 

-- Test 1: Anonymous access to profiles table is denied
SELECT tests.authenticate_as('anon');
SELECT throws_ok(
    'SELECT * FROM profiles',
    '42501',
    'permission denied for table profiles',
    'Anonymous user cannot read profiles directly due to strict Grants'
);
SELECT tests.clear_authentication();

-- Test 2: Anonymous CAN read the safe public view
SELECT tests.authenticate_as('anon');
SELECT lives_ok(
    'SELECT * FROM public_tutor_profiles',
    'Anonymous user can read the safe public_tutor_profiles view'
);
SELECT tests.clear_authentication();

-- Test 3: Unverified teachers hidden from public discovery
SELECT tests.authenticate_as('anon');
SELECT is_empty(
    $$ SELECT * FROM public_tutor_profiles WHERE teacher_id = tests.get_supabase_uid('teacher_b') $$,
    'Unverified Teacher B does not appear in public search'
);
SELECT tests.clear_authentication();

-- Test 4: Teacher A cannot read Teacher B's profile
SELECT tests.authenticate_as('teacher_a');
SELECT is_empty(
    $$ SELECT * FROM teacher_profiles WHERE profile_id = tests.get_supabase_uid('teacher_b') $$,
    'IDOR prevented: Teacher A cannot read Teacher B profile'
);
SELECT tests.clear_authentication();

-- Test 5: Teacher B cannot read Teacher A's verification_documents
SELECT tests.authenticate_as('teacher_b');
SELECT is_empty(
    $$ SELECT * FROM verification_documents WHERE teacher_id = tests.get_supabase_uid('teacher_a') $$,
    'IDOR prevented: Teacher B cannot read Teacher A documents'
);
SELECT tests.clear_authentication();

-- Test 6: Role Escalation - Normal user cannot insert/update admin_users
SELECT tests.authenticate_as('teacher_a');
SELECT throws_ok(
    $$ INSERT INTO admin_users (id, role) VALUES (tests.get_supabase_uid('teacher_a'), 'SUPER_ADMIN') $$,
    '42501',
    'new row violates row-level security policy for table "admin_users"',
    'Role Escalation Prevented: Authenticated users cannot become admins'
);
SELECT tests.clear_authentication();

-- Test 7: Parent IDOR - Parent A cannot view students of Parent B
SELECT tests.authenticate_as('parent_a');
SELECT is_empty(
    $$ SELECT * FROM parent_students WHERE parent_id = tests.get_supabase_uid('parent_b') $$,
    'IDOR prevented: Parent A cannot access mappings of Parent B'
);
SELECT tests.clear_authentication();

-- Test 8: Parent IDOR - Parent A cannot create a request for Parent B's student
SELECT tests.authenticate_as('parent_a');
SELECT throws_ok(
    $$ INSERT INTO tutor_requests (parent_id, student_id, teacher_id) VALUES (tests.get_supabase_uid('parent_a'), '00000000-0000-0000-0000-000000000002', tests.get_supabase_uid('teacher_a')) $$,
    '42501',
    'new row violates row-level security policy for table "tutor_requests"',
    'Parent cannot create request for another parents student'
);
SELECT tests.clear_authentication();

-- Test 9: Teacher Status Escalation Prevention via Trigger
SELECT tests.authenticate_as('teacher_a');
UPDATE teacher_profiles SET status = 'SUSPENDED' WHERE profile_id = tests.get_supabase_uid('teacher_a');
SELECT results_eq(
    $$ SELECT status FROM teacher_profiles WHERE profile_id = tests.get_supabase_uid('teacher_a') $$,
    $$ VALUES ('VERIFIED'::teacher_status) $$,
    'Trigger prevented teacher from escalating/changing their own status'
);
SELECT tests.clear_authentication();

-- Test 10: Admin Authorization - Verification Admin CAN change teacher status
SELECT tests.authenticate_as('verification_admin');
UPDATE teacher_profiles SET status = 'SUSPENDED' WHERE profile_id = tests.get_supabase_uid('teacher_a');
SELECT results_eq(
    $$ SELECT status FROM teacher_profiles WHERE profile_id = tests.get_supabase_uid('teacher_a') $$,
    $$ VALUES ('SUSPENDED'::teacher_status) $$,
    'Verification Admin CAN change teacher status'
);
SELECT tests.clear_authentication();

-- Test 11: Request IDOR - User modifying another users request
SELECT tests.authenticate_as('parent_b');
SELECT is_empty(
    $$ SELECT * FROM tutor_requests WHERE id = '20000000-0000-0000-0000-000000000001'::uuid $$,
    'Tutor Request IDOR prevented: Parent B cannot even view Parent A request'
);
SELECT tests.clear_authentication();

-- Test 12: Freeze Ownership - Parent cannot change student_id on request
SELECT tests.authenticate_as('parent_a');
UPDATE tutor_requests SET student_id = '00000000-0000-0000-0000-000000000002' WHERE id = '20000000-0000-0000-0000-000000000001'::uuid;
SELECT results_eq(
    $$ SELECT student_id FROM tutor_requests WHERE id = '20000000-0000-0000-0000-000000000001'::uuid $$,
    $$ VALUES ('00000000-0000-0000-0000-000000000001'::uuid) $$,
    'Ownership freeze trigger prevented changing student_id'
);
SELECT tests.clear_authentication();

-- Test 13: Transition State - Teacher cannot arbitrarily CANCEL a pending request (only Parent can)
SELECT tests.authenticate_as('teacher_a');
SELECT throws_ok(
    $$ UPDATE tutor_requests SET status = 'CANCELLED' WHERE id = '20000000-0000-0000-0000-000000000001'::uuid $$,
    'P0001',
    'Only the parent can cancel a pending request',
    'State Transition prevented: Teacher cannot cancel a pending request'
);
SELECT tests.clear_authentication();

-- Test 14: Transition State - Teacher CAN ACCEPT a pending request
SELECT tests.authenticate_as('teacher_a');
SELECT lives_ok(
    $$ UPDATE tutor_requests SET status = 'ACCEPTED' WHERE id = '20000000-0000-0000-0000-000000000001'::uuid $$,
    'State Transition allowed: Teacher can accept a pending request'
);
SELECT tests.clear_authentication();

-- Test 15: Storage Buckets exist and are configured
SELECT results_eq(
    $$ SELECT name FROM storage.buckets WHERE id = 'verification_documents' $$,
    $$ VALUES ('verification_documents'::text) $$,
    'verification_documents bucket exists'
);

SELECT results_eq(
    $$ SELECT public FROM storage.buckets WHERE id = 'verification_documents' $$,
    $$ VALUES (false) $$,
    'verification_documents bucket is strictly private'
);

SELECT results_eq(
    $$ SELECT name FROM storage.buckets WHERE id = 'avatars' $$,
    $$ VALUES ('avatars'::text) $$,
    'avatars bucket exists'
);

SELECT results_eq(
    $$ SELECT public FROM storage.buckets WHERE id = 'avatars' $$,
    $$ VALUES (true) $$,
    'avatars bucket is public'
);

-- Test 16: Review Authorization - Cannot review a request that is not COMPLETED
SELECT tests.authenticate_as('parent_a');
SELECT throws_ok(
    $$ INSERT INTO reviews (request_id, reviewer_id, teacher_id, rating) VALUES ('20000000-0000-0000-0000-000000000001', tests.get_supabase_uid('parent_a'), tests.get_supabase_uid('teacher_a'), 5) $$,
    '42501',
    'new row violates row-level security policy for table "reviews"',
    'Parent cannot review a non-completed request'
);
SELECT tests.clear_authentication();

SELECT * FROM finish();
ROLLBACK;
