-- 20260917000000_enable_student_requests.sql
-- Enables STUDENT users to create, read, and manage their own tutor_requests and request_availability.
-- Preserves all existing PARENT, TEACHER, and ADMIN permissions.

-- 1. tutor_requests RLS

-- Add Student Read policy
CREATE POLICY "Student read own requests" 
ON tutor_requests 
FOR SELECT 
USING (student_id = auth.uid());

-- Add Student Insert policy
CREATE POLICY "Student insert own request" 
ON tutor_requests 
FOR INSERT 
WITH CHECK (
    student_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'STUDENT') AND
    is_teacher_verified(teacher_id)
);

-- Add Student Update policy
CREATE POLICY "Student update own request" 
ON tutor_requests 
FOR UPDATE 
USING (student_id = auth.uid());


-- 2. request_availability RLS

-- Add Student Read policy for request_availability
CREATE POLICY "Student read own request availability" 
ON request_availability 
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM tutor_requests WHERE id = request_id AND student_id = auth.uid())
);

-- Add Student Insert policy for request_availability
CREATE POLICY "Student insert own request availability" 
ON request_availability 
FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM tutor_requests WHERE id = request_id AND student_id = auth.uid())
);

-- Add Student Delete policy for request_availability
CREATE POLICY "Student delete own request availability" 
ON request_availability 
FOR DELETE 
USING (
    EXISTS (SELECT 1 FROM tutor_requests WHERE id = request_id AND student_id = auth.uid())
);


-- 3. Modify validate_tutor_request_update trigger to allow student_id cancellation

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
            ELSIF OLD.status = 'PENDING' AND NEW.status = 'CANCELLED' AND (auth.uid() != OLD.parent_id AND auth.uid() != OLD.student_id) THEN
                RAISE EXCEPTION 'Only the parent or student can cancel a pending request';
            ELSIF OLD.status = 'ACCEPTED' AND NEW.status = 'COMPLETED' AND auth.uid() NOT IN (OLD.teacher_id, OLD.parent_id, OLD.student_id) THEN
                RAISE EXCEPTION 'Unauthorized to complete request';
            ELSIF OLD.status = 'ACCEPTED' AND NEW.status = 'CANCELLED' AND auth.uid() NOT IN (OLD.teacher_id, OLD.parent_id, OLD.student_id) THEN
                RAISE EXCEPTION 'Unauthorized to cancel accepted request';
            ELSIF NEW.status NOT IN ('ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED') THEN
                RAISE EXCEPTION 'Invalid status transition';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
