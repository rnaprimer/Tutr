-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('STUDENT', 'PARENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN');
CREATE TYPE teacher_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE verification_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_CHANGES');
CREATE TYPE pricing_type AS ENUM ('HOURLY', 'PER_CLASS', 'MONTHLY');
CREATE TYPE teaching_location AS ENUM ('STUDENT_HOME', 'TEACHER_LOCATION', 'BOTH');
CREATE TYPE verification_category AS ENUM ('IDENTITY', 'QUALIFICATION', 'EXPERIENCE');
CREATE TYPE request_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');

-- 2. TABLES & BASE FUNCTIONS
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    exact_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Admin Users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    role admin_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin helpers
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'SUPER_ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_verification_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'VERIFICATION_ADMIN'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_support_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'SUPPORT_ADMIN'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_any_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Teacher Profiles
CREATE TABLE teacher_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT,
    status teacher_status NOT NULL DEFAULT 'DRAFT',
    pricing_type pricing_type,
    hourly_fee NUMERIC CHECK (hourly_fee >= 0),
    per_class_fee NUMERIC CHECK (per_class_fee >= 0),
    monthly_fee NUMERIC CHECK (monthly_fee >= 0),
    teaching_location teaching_location,
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (pricing_type = 'HOURLY' AND hourly_fee IS NOT NULL) OR
        (pricing_type = 'PER_CLASS' AND per_class_fee IS NOT NULL) OR
        (pricing_type = 'MONTHLY' AND monthly_fee IS NOT NULL) OR
        (pricing_type IS NULL)
    )
);
CREATE TRIGGER set_teacher_profiles_updated_at BEFORE UPDATE ON teacher_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Prevent Status Escalation
CREATE OR REPLACE FUNCTION freeze_teacher_fields() RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_verification_admin() THEN
        NEW.status = OLD.status;
        NEW.admin_notes = OLD.admin_notes;
        NEW.rejection_reason = OLD.rejection_reason;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
CREATE TRIGGER trigger_freeze_teacher_fields BEFORE UPDATE ON teacher_profiles FOR EACH ROW EXECUTE FUNCTION freeze_teacher_fields();

-- Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parent_students (
    parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- Geographics
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE localities (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(city_id, name)
);

-- Taxonomies
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Teacher Joins
CREATE TABLE teacher_subjects (
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, subject_id)
);

CREATE TABLE teacher_classes (
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, class_id)
);

CREATE TABLE teacher_boards (
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, board_id)
);

CREATE TABLE teacher_localities (
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    locality_id INTEGER REFERENCES localities(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, locality_id)
);

-- Teacher Availability
CREATE TABLE teacher_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tutor Requests
CREATE TABLE tutor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id),
    class_id INTEGER REFERENCES classes(id),
    board_id INTEGER REFERENCES boards(id),
    locality_id INTEGER REFERENCES localities(id),
    budget_amount NUMERIC CHECK (budget_amount >= 0),
    budget_type pricing_type,
    message TEXT,
    status request_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_tutor_requests_updated_at BEFORE UPDATE ON tutor_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Normalized Request Availability
CREATE TABLE request_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES tutor_requests(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time)
);

-- Tutor Request Transitions & Freeze Ownership Trigger
CREATE OR REPLACE FUNCTION validate_tutor_request_update() RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_support_admin() THEN
        -- Freeze ownership unconditionally for non-admins
        NEW.student_id = OLD.student_id;
        NEW.parent_id = OLD.parent_id;
        NEW.teacher_id = OLD.teacher_id;
        
        -- State transition validation
        IF NEW.status != OLD.status THEN
            IF OLD.status = 'PENDING' AND NEW.status IN ('ACCEPTED', 'DECLINED') AND auth.uid() != OLD.teacher_id THEN
                RAISE EXCEPTION 'Only the teacher can accept or decline this request';
            ELSIF OLD.status = 'PENDING' AND NEW.status = 'CANCELLED' AND auth.uid() != OLD.parent_id THEN
                RAISE EXCEPTION 'Only the parent can cancel a pending request';
            ELSIF OLD.status = 'ACCEPTED' AND NEW.status = 'COMPLETED' AND auth.uid() NOT IN (OLD.teacher_id, OLD.parent_id) THEN
                RAISE EXCEPTION 'Unauthorized to complete request';
            ELSIF OLD.status = 'ACCEPTED' AND NEW.status = 'CANCELLED' AND auth.uid() NOT IN (OLD.teacher_id, OLD.parent_id) THEN
                RAISE EXCEPTION 'Unauthorized to cancel accepted request';
            ELSIF NEW.status NOT IN ('ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED') THEN
                RAISE EXCEPTION 'Invalid status transition';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
CREATE TRIGGER trigger_validate_tutor_request_update BEFORE UPDATE ON tutor_requests FOR EACH ROW EXECUTE FUNCTION validate_tutor_request_update();


-- Saved Teachers
CREATE TABLE saved_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    UNIQUE (user_id, teacher_id)
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES tutor_requests(id) ON DELETE RESTRICT UNIQUE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verification Documents
CREATE TABLE verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teacher_profiles(profile_id) ON DELETE CASCADE,
    category verification_category NOT NULL,
    file_path TEXT NOT NULL,
    reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    status verification_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PUBLIC VIEWS
CREATE VIEW public_tutor_profiles AS
SELECT 
    p.id as teacher_id,
    p.display_name,
    p.avatar_url,
    tp.bio,
    tp.pricing_type,
    tp.hourly_fee,
    tp.per_class_fee,
    tp.monthly_fee,
    tp.teaching_location
FROM profiles p
JOIN teacher_profiles tp ON p.id = tp.profile_id
WHERE tp.status = 'VERIFIED';

-- Helper to check if teacher verified
CREATE OR REPLACE FUNCTION is_teacher_verified(tid UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM teacher_profiles WHERE profile_id = tid AND status = 'VERIFIED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. ROW LEVEL SECURITY (RLS) & GRANTS

-- Explicitly revoke all on everything by default in public schema
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_localities ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- Grants & Policies

-- Public View & Taxonomies (Read-Only for Anon & Auth)
GRANT SELECT ON public_tutor_profiles TO anon, authenticated;
GRANT SELECT ON cities TO anon, authenticated;
GRANT SELECT ON localities TO anon, authenticated;
GRANT SELECT ON subjects TO anon, authenticated;
GRANT SELECT ON classes TO anon, authenticated;
GRANT SELECT ON boards TO anon, authenticated;

CREATE POLICY "Public taxonomies viewable" ON cities FOR SELECT USING (true);
CREATE POLICY "Public taxonomies viewable" ON localities FOR SELECT USING (true);
CREATE POLICY "Public taxonomies viewable" ON subjects FOR SELECT USING (true);
CREATE POLICY "Public taxonomies viewable" ON classes FOR SELECT USING (true);
CREATE POLICY "Public taxonomies viewable" ON boards FOR SELECT USING (true);

-- Teacher mappings (public read if verified)
GRANT SELECT ON teacher_subjects TO anon, authenticated;
GRANT SELECT ON teacher_classes TO anon, authenticated;
GRANT SELECT ON teacher_boards TO anon, authenticated;
GRANT SELECT ON teacher_localities TO anon, authenticated;
GRANT SELECT ON teacher_availability TO anon, authenticated;

CREATE POLICY "Read teacher subjects" ON teacher_subjects FOR SELECT USING (is_teacher_verified(teacher_id) OR teacher_id = auth.uid() OR is_any_admin());
CREATE POLICY "Read teacher classes" ON teacher_classes FOR SELECT USING (is_teacher_verified(teacher_id) OR teacher_id = auth.uid() OR is_any_admin());
CREATE POLICY "Read teacher boards" ON teacher_boards FOR SELECT USING (is_teacher_verified(teacher_id) OR teacher_id = auth.uid() OR is_any_admin());
CREATE POLICY "Read teacher localities" ON teacher_localities FOR SELECT USING (is_teacher_verified(teacher_id) OR teacher_id = auth.uid() OR is_any_admin());
CREATE POLICY "Read teacher availability" ON teacher_availability FOR SELECT USING (is_teacher_verified(teacher_id) OR teacher_id = auth.uid() OR is_any_admin());

GRANT INSERT, UPDATE, DELETE ON teacher_subjects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON teacher_classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON teacher_boards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON teacher_localities TO authenticated;
GRANT INSERT, UPDATE, DELETE ON teacher_availability TO authenticated;

CREATE POLICY "Manage teacher subjects" ON teacher_subjects FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Manage teacher classes" ON teacher_classes FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Manage teacher boards" ON teacher_boards FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Manage teacher localities" ON teacher_localities FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Manage teacher availability" ON teacher_availability FOR ALL TO authenticated USING (teacher_id = auth.uid());

-- Profiles
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
CREATE POLICY "Read own profile or admin" ON profiles FOR SELECT USING (id = auth.uid() OR is_any_admin());
CREATE POLICY "Insert profile (normal roles only)" ON profiles FOR INSERT WITH CHECK (id = auth.uid() AND role IN ('STUDENT', 'PARENT', 'TEACHER'));
CREATE POLICY "Update own profile (cannot change role)" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (role IN ('STUDENT', 'PARENT', 'TEACHER'));
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (is_super_admin());

-- Admin Users
GRANT SELECT ON admin_users TO authenticated;
CREATE POLICY "Admins can view admin_users" ON admin_users FOR SELECT USING (is_any_admin());
-- Only super admins can manage admin_users (done directly via service_role script)
REVOKE INSERT, UPDATE, DELETE ON admin_users FROM authenticated;

-- Teacher Profiles
GRANT SELECT, INSERT, UPDATE ON teacher_profiles TO authenticated;
CREATE POLICY "Read own private teacher profile or admin" ON teacher_profiles FOR SELECT USING (profile_id = auth.uid() OR is_verification_admin());
CREATE POLICY "Insert own teacher profile" ON teacher_profiles FOR INSERT WITH CHECK (profile_id = auth.uid() AND status = 'DRAFT');
CREATE POLICY "Update own teacher profile" ON teacher_profiles FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Verification Admin update teacher profile" ON teacher_profiles FOR UPDATE USING (is_verification_admin());

-- Students & Parents
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO authenticated;
GRANT SELECT, INSERT, DELETE ON parent_students TO authenticated;
CREATE POLICY "Parents read students" ON students FOR SELECT USING (EXISTS (SELECT 1 FROM parent_students WHERE student_id = students.id AND parent_id = auth.uid()) OR is_support_admin());
CREATE POLICY "Parents manage students" ON students FOR ALL USING (EXISTS (SELECT 1 FROM parent_students WHERE student_id = students.id AND parent_id = auth.uid()));
CREATE POLICY "Parents manage mappings" ON parent_students FOR ALL USING (parent_id = auth.uid());
CREATE POLICY "Parents read mappings" ON parent_students FOR SELECT USING (parent_id = auth.uid() OR is_support_admin());

-- Tutor Requests
GRANT SELECT, INSERT, UPDATE ON tutor_requests TO authenticated;
CREATE POLICY "Read requests" ON tutor_requests FOR SELECT USING (parent_id = auth.uid() OR teacher_id = auth.uid() OR is_support_admin());

CREATE POLICY "Parent insert request" ON tutor_requests FOR INSERT WITH CHECK (
    parent_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'PARENT') AND
    EXISTS (SELECT 1 FROM parent_students WHERE student_id = tutor_requests.student_id AND parent_id = auth.uid()) AND
    is_teacher_verified(teacher_id)
);

CREATE POLICY "Participants update request" ON tutor_requests FOR UPDATE USING (parent_id = auth.uid() OR teacher_id = auth.uid());
CREATE POLICY "Support Admin update request" ON tutor_requests FOR UPDATE USING (is_support_admin());

-- Request Availability
GRANT SELECT, INSERT, UPDATE, DELETE ON request_availability TO authenticated;
CREATE POLICY "Read request availability" ON request_availability FOR SELECT USING (
    EXISTS (SELECT 1 FROM tutor_requests WHERE id = request_id AND (parent_id = auth.uid() OR teacher_id = auth.uid() OR is_support_admin()))
);
CREATE POLICY "Parent insert request availability" ON request_availability FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tutor_requests WHERE id = request_id AND parent_id = auth.uid())
);
CREATE POLICY "Parent delete request availability" ON request_availability FOR DELETE USING (
    EXISTS (SELECT 1 FROM tutor_requests WHERE id = request_id AND parent_id = auth.uid())
);

-- Saved Teachers
GRANT SELECT, INSERT, DELETE ON saved_teachers TO authenticated;
CREATE POLICY "Manage saved teachers" ON saved_teachers FOR ALL USING (user_id = auth.uid());

-- Reviews
GRANT SELECT ON reviews TO anon, authenticated;
GRANT INSERT ON reviews TO authenticated;
CREATE POLICY "Public approved reviews" ON reviews FOR SELECT USING (is_approved = TRUE OR reviewer_id = auth.uid() OR teacher_id = auth.uid() OR is_support_admin());
CREATE POLICY "Insert review for completed request" ON reviews FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM tutor_requests 
        WHERE id = request_id 
        AND parent_id = auth.uid() 
        AND teacher_id = reviews.teacher_id 
        AND status = 'COMPLETED'
    )
);

-- Admin approve review
GRANT UPDATE ON reviews TO authenticated;
CREATE POLICY "Support Admin manage reviews" ON reviews FOR UPDATE USING (is_support_admin());

-- Verification Documents
GRANT SELECT, INSERT, DELETE ON verification_documents TO authenticated;
CREATE POLICY "Read own docs or Verification Admin" ON verification_documents FOR SELECT USING (teacher_id = auth.uid() OR is_verification_admin());
CREATE POLICY "Insert own docs" ON verification_documents FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Delete own docs" ON verification_documents FOR DELETE USING (teacher_id = auth.uid());
GRANT UPDATE ON verification_documents TO authenticated;
CREATE POLICY "Verification Admin update documents" ON verification_documents FOR UPDATE USING (is_verification_admin());

-- Audit Logs
-- Only service_role can INSERT audit logs, admins can only view.
GRANT SELECT ON audit_logs TO authenticated;
CREATE POLICY "Super Admin read audit logs" ON audit_logs FOR SELECT USING (is_super_admin());


-- 5. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public) VALUES ('verification_documents', 'verification_documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Avatars (Public Read, strictly pathed Auth Upload)
CREATE POLICY "Avatar Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND 
    (auth.uid())::text = (string_to_array(name, '/'))[1]
);
CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND 
    (auth.uid())::text = (string_to_array(name, '/'))[1]
);
CREATE POLICY "Avatar Auth Delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND 
    (auth.uid())::text = (string_to_array(name, '/'))[1]
);

-- Verification Documents (Private, strictly pathed)
CREATE POLICY "Verification Docs Private Read" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'verification_documents' AND 
    ((auth.uid())::text = (string_to_array(name, '/'))[1] OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'VERIFICATION_ADMIN')))
);
CREATE POLICY "Verification Docs Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'verification_documents' AND 
    (auth.uid())::text = (string_to_array(name, '/'))[1]
);
CREATE POLICY "Verification Docs Delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'verification_documents' AND 
    (auth.uid())::text = (string_to_array(name, '/'))[1]
);

-- 6. SEED DATA
INSERT INTO cities (name) VALUES ('Balasore') ON CONFLICT DO NOTHING;
