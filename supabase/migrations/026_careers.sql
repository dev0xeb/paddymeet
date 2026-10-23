-- 026: careers system — job openings, per-role application fields, applications.
--
-- Three new tables. job_openings and job_application_fields are public-
-- readable (only published roles) so the anonymous /careers page can query
-- them directly via the normal session client, same as how the rest of the
-- public site reads already-public content. job_applications has no public
-- policy at all — the public apply route writes through the service-role
-- client, so an anonymous applicant never touches that table directly, and
-- only admin routes (also service-role) ever read it.

CREATE TABLE IF NOT EXISTS public.job_openings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    employment_type TEXT,
    pay TEXT,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_application_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_opening_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'textarea')),
    is_required BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- job_title_snapshot and a full {label, value} answers snapshot (rather
-- than live-joining job_application_fields) mean this row stays accurate
-- and readable even after the admin later edits or removes fields, or
-- deletes the opening entirely (hence ON DELETE SET NULL, not CASCADE —
-- an applicant's history shouldn't vanish just because the role closed).
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE SET NULL,
    job_title_snapshot TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    resume_path TEXT NOT NULL,
    resume_filename TEXT NOT NULL,
    extra_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'interview_requested', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_application_fields_opening ON public.job_application_fields(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_opening ON public.job_applications(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read a PUBLISHED opening and
-- its fields — admin writes go through the service-role client, which
-- isn't subject to RLS, so no write policy is needed here at all.
CREATE POLICY "Anyone can read published job openings"
ON public.job_openings FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Anyone can read fields for published job openings"
ON public.job_application_fields FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.job_openings
        WHERE job_openings.id = job_application_fields.job_opening_id
        AND job_openings.is_published = true
    )
);

-- job_applications: deliberately no policy of any kind. The public apply
-- route and every admin route both use the service-role client.
