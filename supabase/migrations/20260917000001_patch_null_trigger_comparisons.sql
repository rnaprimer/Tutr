-- 20260917000001_patch_null_trigger_comparisons.sql
-- Security patch to fix PostgreSQL three-valued logic vulnerabilities in trigger authorization checks
-- when dealing with NULL parent_id, student_id, or teacher_id.

CREATE OR REPLACE FUNCTION validate_tutor_request_update() RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_support_admin() THEN
        -- Freeze ownership unconditionally for non-admins
        NEW.student_id = OLD.student_id;
        NEW.parent_id = OLD.parent_id;
        NEW.teacher_id = OLD.teacher_id;
        
        -- State transition validation
        IF NEW.status != OLD.status THEN
            IF OLD.status = 'PENDING' AND NEW.status IN ('ACCEPTED', 'DECLINED') AND auth.uid() IS DISTINCT FROM OLD.teacher_id THEN
                RAISE EXCEPTION 'Only the teacher can accept or decline this request';
            ELSIF OLD.status = 'PENDING' AND NEW.status = 'CANCELLED' AND (auth.uid() IS DISTINCT FROM OLD.parent_id AND auth.uid() IS DISTINCT FROM OLD.student_id) THEN
                RAISE EXCEPTION 'Only the parent or student can cancel a pending request';
            ELSIF OLD.status = 'ACCEPTED' AND NEW.status = 'COMPLETED' AND auth.uid() IS DISTINCT FROM OLD.teacher_id AND auth.uid() IS DISTINCT FROM OLD.parent_id AND auth.uid() IS DISTINCT FROM OLD.student_id THEN
                RAISE EXCEPTION 'Unauthorized to complete request';
            ELSIF OLD.status = 'ACCEPTED' AND NEW.status = 'CANCELLED' AND auth.uid() IS DISTINCT FROM OLD.teacher_id AND auth.uid() IS DISTINCT FROM OLD.parent_id AND auth.uid() IS DISTINCT FROM OLD.student_id THEN
                RAISE EXCEPTION 'Unauthorized to cancel accepted request';
            ELSIF NEW.status NOT IN ('ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED') THEN
                RAISE EXCEPTION 'Invalid status transition';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
