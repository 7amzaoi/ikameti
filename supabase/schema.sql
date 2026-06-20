-- =====================================================================
-- IKAMETI — Supabase Database Schema
-- =====================================================================
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- It is idempotent: you can run it again safely (it uses IF NOT EXISTS
-- and CREATE OR REPLACE / DROP POLICY IF EXISTS guards).
--
-- It builds everything the website + admin dashboard need:
--   1. categories            -> blog categories
--   2. blogs                 -> blog articles (the cards on /blog/ + each
--                               article page)
--   3. residency_submissions -> "Get Your Residency in Turkey in Minutes"
--                               wizard submissions
--   4. reminder_submissions  -> "Remind Me" floating-button submissions
--
-- Security model (Row Level Security):
--   * Anonymous website visitors  -> can READ published blogs + categories,
--                                    and can INSERT into the two form tables.
--   * Logged-in admins (any user  -> full access (read/write everything,
--     in Supabase Auth)              including draft blogs + every submission).
--
-- To create your admin login:  Supabase Dashboard
--   -> Authentication -> Users -> "Add user" -> set email + password.
--   Then log in with those credentials at /admin/login.html
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Helper: keep updated_at fresh on every UPDATE
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;


-- ---------------------------------------------------------------------
-- 1. CATEGORIES
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  slug        text        not null unique,
  name        text        not null,
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.categories is 'Blog categories used to filter articles on the blog page.';


-- ---------------------------------------------------------------------
-- 2. BLOGS (articles)
-- ---------------------------------------------------------------------
create table if not exists public.blogs (
  id             bigint generated always as identity primary key,
  slug           text        not null unique,
  title          text        not null,
  description    text,                       -- short summary shown on the card
  content        text,                       -- full article body (HTML)
  translations   jsonb       not null default '{}'::jsonb,  -- per-language overrides: {"ar":{"title","description","content"}, ...}
  image          text,                       -- cover image URL
  category       text        references public.categories(slug)
                              on update cascade on delete set null,
  author         text        not null default 'IKAMETI Team',
  read_time      text,                       -- e.g. "5 min read" (optional)
  published_date date        not null default current_date,
  status         text        not null default 'published'
                              check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.blogs is 'Blog articles. status=published are shown publicly; draft are admin-only.';

-- For databases created before the translations column existed:
alter table public.blogs add column if not exists translations jsonb not null default '{}'::jsonb;

create index if not exists blogs_category_idx        on public.blogs (category);
create index if not exists blogs_status_idx          on public.blogs (status);
create index if not exists blogs_published_date_idx  on public.blogs (published_date desc);

drop trigger if exists blogs_set_updated_at on public.blogs;
create trigger blogs_set_updated_at
  before update on public.blogs
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 3. RESIDENCY SUBMISSIONS
--    Source: "Get Your Residency in Turkey in Minutes" multi-step wizard
-- ---------------------------------------------------------------------
create table if not exists public.residency_submissions (
  id              bigint generated always as identity primary key,
  full_name       text,
  phone           text        not null,
  residency_type  text,                      -- tourist | student | real-estate | family
  has_residency   text,                      -- yes | no
  duration        text,                      -- 1-year | 2-year
  rental_contract text,                      -- yes | no
  family_members  text,                      -- 1 | 2 | 3 | 4 | 5+
  expiry_date     date,                      -- optional, if provided
  language        text,                      -- site language at submit time
  status          text        not null default 'new'
                              check (status in ('new', 'contacted', 'in_progress', 'closed')),
  notes           text,                      -- internal notes by customer service
  created_at      timestamptz not null default now()
);

comment on table public.residency_submissions is 'Leads from the homepage residency wizard form.';

create index if not exists residency_submissions_created_idx on public.residency_submissions (created_at desc);
create index if not exists residency_submissions_status_idx  on public.residency_submissions (status);


-- ---------------------------------------------------------------------
-- 4. REMINDER SUBMISSIONS
--    Source: floating "Remind Me" button modal
-- ---------------------------------------------------------------------
create table if not exists public.reminder_submissions (
  id             bigint generated always as identity primary key,
  full_name      text,
  phone          text        not null,
  residency_type text,                       -- Tourist | Student | Family | Real Estate
  expiry_date    date        not null,       -- when their permit expires
  language       text,
  status         text        not null default 'new'
                              check (status in ('new', 'contacted', 'in_progress', 'closed')),
  notes          text,
  created_at     timestamptz not null default now()
);

comment on table public.reminder_submissions is 'Renewal reminder requests from the Remind Me modal.';

create index if not exists reminder_submissions_created_idx on public.reminder_submissions (created_at desc);
create index if not exists reminder_submissions_expiry_idx  on public.reminder_submissions (expiry_date);
create index if not exists reminder_submissions_status_idx  on public.reminder_submissions (status);


-- =====================================================================
-- ADMIN IDENTITY
-- =====================================================================
-- Only this email may manage blogs and read submissions. Change it here
-- (or via supabase/restrict-admin.sql) and re-run to hand over access.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $func$
  select coalesce(auth.jwt() ->> 'email', '') = 'hmzaaslan77@gmail.com'
$func$;


-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.categories            enable row level security;
alter table public.blogs                 enable row level security;
alter table public.residency_submissions enable row level security;
alter table public.reminder_submissions  enable row level security;

-- ---- CATEGORIES ----------------------------------------------------
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- BLOGS ---------------------------------------------------------
-- Public visitors can only read PUBLISHED articles.
drop policy if exists "blogs_public_read_published" on public.blogs;
create policy "blogs_public_read_published"
  on public.blogs for select
  to anon
  using (status = 'published');

-- Admins can read everything (including drafts).
drop policy if exists "blogs_admin_read_all" on public.blogs;
create policy "blogs_admin_read_all"
  on public.blogs for select
  to authenticated
  using (public.is_admin());

-- Admins can create / edit / delete.
drop policy if exists "blogs_admin_write" on public.blogs;
create policy "blogs_admin_write"
  on public.blogs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- RESIDENCY SUBMISSIONS -----------------------------------------
-- Anyone (anonymous visitor) can submit the form.
drop policy if exists "residency_public_insert" on public.residency_submissions;
create policy "residency_public_insert"
  on public.residency_submissions for insert
  to anon, authenticated
  with check (true);

-- Only admins can read / update / delete leads.
drop policy if exists "residency_admin_read" on public.residency_submissions;
create policy "residency_admin_read"
  on public.residency_submissions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "residency_admin_update" on public.residency_submissions;
create policy "residency_admin_update"
  on public.residency_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "residency_admin_delete" on public.residency_submissions;
create policy "residency_admin_delete"
  on public.residency_submissions for delete
  to authenticated
  using (public.is_admin());

-- ---- REMINDER SUBMISSIONS ------------------------------------------
drop policy if exists "reminder_public_insert" on public.reminder_submissions;
create policy "reminder_public_insert"
  on public.reminder_submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "reminder_admin_read" on public.reminder_submissions;
create policy "reminder_admin_read"
  on public.reminder_submissions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "reminder_admin_update" on public.reminder_submissions;
create policy "reminder_admin_update"
  on public.reminder_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reminder_admin_delete" on public.reminder_submissions;
create policy "reminder_admin_delete"
  on public.reminder_submissions for delete
  to authenticated
  using (public.is_admin());


-- =====================================================================
-- SEED DATA — categories
-- =====================================================================
insert into public.categories (slug, name, description) values
  ('immigration', 'Immigration', 'Residency permits, visas, and immigration guidance.'),
  ('housing',     'Housing',     'Finding and renting property in Turkey.'),
  ('legal',       'Legal',       'Turkish law, contracts, and worker rights.'),
  ('business',    'Business',    'Investment and business setup in Turkey.'),
  ('lifestyle',   'Lifestyle',   'Healthcare, daily life, and living in Turkey.'),
  ('general',     'General',     'General articles and announcements.')
on conflict (slug) do nothing;


-- =====================================================================
-- SEED DATA — blogs (generated from blog/data/articles.json)
-- Re-running is safe: existing slugs are skipped (ON CONFLICT DO NOTHING).
-- =====================================================================

insert into public.blogs (slug, title, description, content, image, category, author, published_date, status) values
  ($x$turkish-residency-permit$x$, $x$Turkish Residency Permit Guide$x$, $x$Complete guide to obtaining Turkish residency permits with step-by-step instructions.$x$, $x$<h2>Introduction</h2><p>Turkish residency permits are highly sought after by international professionals and investors. This comprehensive guide will walk you through the entire process, requirements, and timeline.</p><h2>Types of Turkish Residency Permits</h2><p>Turkey offers several types of residence permits designed for different purposes.</p><h3>Short-Term Residence Permit (IKY)</h3><p>Valid for 1 year and can be renewed. This is the most common type for expats starting their Turkish residency journey. It requires:</p><ul><li>Valid passport</li><li>Health insurance</li><li>Certificate of residence</li><li>Clear criminal record</li></ul><h3>Long-Term Residence Permit (LKY)</h3><p>Valid for 2 years and requires at least 1 year of continuous residence with a Short-Term permit. Requirements include the same documentation as above.</p><h2>Application Process</h2><p>The application process is straightforward and can be completed at your local Migration Office (Göç İdaresi). Prepare your documents, schedule an appointment, and submit your application.</p><h2>Timeline</h2><p>The typical processing time is 1-3 months, depending on your location and the volume of applications. You can extend your permit before it expires.</p><h2>Cost</h2><p>The cost varies by currency and exchange rate, typically ranging from 50-150 USD equivalent in Turkish Lira.</p>$x$, $x$https://images.unsplash.com/photo-1554224311-beee415c15c7?w=800&h=400&fit=crop$x$, $x$immigration$x$, $x$Ahmed Al-Mansouri$x$, $x$2026-04-01$x$, $x$published$x$),
  ($x$perfect-apartment-istanbul$x$, $x$Finding Your Perfect Apartment in Istanbul$x$, $x$Expert tips and strategies for finding the ideal apartment in Istanbul's competitive housing market.$x$, $x$<h2>Introduction</h2><p>Finding an apartment in Istanbul can be challenging but rewarding. With millions of residents and constant growth, the market is dynamic and competitive. This guide will help you navigate the process efficiently.</p><h2>Best Neighborhoods for Expats</h2><p>Istanbul offers diverse neighborhoods, each with unique characteristics. Here are top neighborhoods favored by expats:</p><h3>Beyoğlu</h3><p>The heart of modern Istanbul, known for its vibrant nightlife, restaurants, and cultural venues. Perfect for young professionals and those seeking an active lifestyle.</p><h3>Beşiktaş</h3><p>A more residential area with excellent transportation, upscale amenities, and strong expat community. Ideal for families and established professionals.</p><h3>Kadıköy</h3><p>Located on the Asian side, it's trendy, affordable, and very popular among expats. Great for those seeking a younger, artistic vibe.</p><h2>Where to Search</h2><p>Use multiple platforms for comprehensive search results: Sahibinden.com, Airbnb (for temporary rentals), Expatica forums, and local real estate agencies. Each has advantages.</p><h2>What to Expect</h2><p>Most landlords require first month, last month, and deposit. Apartments are typically unfurnished. Prices vary from 1,500 TL to 10,000+ TL depending on location and size.</p><h2>Negotiation Tips</h2><p>Don't accept the first offer. Landlords often expect negotiation. A 10-20% reduction from the asking price is common, especially for longer-term leases.</p>$x$, $x$https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=400&fit=crop$x$, $x$housing$x$, $x$Fatima Hassan$x$, $x$2026-03-28$x$, $x$published$x$),
  ($x$turkish-labor-law$x$, $x$Understanding Turkish Labor Law$x$, $x$Essential information about employment contracts and worker rights in Turkey.$x$, $x$<h2>Introduction</h2><p>Understanding Turkish labor law is crucial for both employers and employees. Turkey has comprehensive labor regulations that protect workers' rights while allowing business flexibility.</p><h2>Employment Contract Requirements</h2><p>Every employment relationship in Turkey must be documented with a written contract. The contract must include:</p><ul><li>Job title and responsibilities</li><li>Salary and payment terms (monthly minimum)</li><li>Working hours (maximum 45 hours/week)</li><li>Annual leave entitlement (minimum 2-2.5 days/month)</li><li>Probation period (maximum 2 months)</li><li>Termination conditions</li></ul><h2>Worker Rights</h2><p>Turkish law guarantees fundamental rights to all employees regardless of contract type or status.</p><h3>Minimum Wage</h3><p>The monthly minimum wage is set annually by the government and applies to all workers. Employers cannot pay below this amount.</p><h3>Working Hours</h3><p>The standard working week is 45 hours distributed over 5 days. Overtime must be compensated at 1.5x the regular wage.</p><h3>Leave and Holidays</h3><p>Employees are entitled to paid annual leave. Public holidays are also paid days off.</p><h2>Common Issues</h2><p>If you face issues like non-payment of wages, wrongful termination, or unsafe working conditions, contact your local labor office (İş Gücü İدareliği).</p>$x$, $x$https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop$x$, $x$legal$x$, $x$Mehmet Kaya$x$, $x$2026-03-20$x$, $x$published$x$),
  ($x$investment-opportunities$x$, $x$Investment Opportunities in Turkey$x$, $x$Explore business and investment opportunities available for foreign investors in Turkey.$x$, $x$<h2>Introduction</h2><p>Turkey presents compelling investment opportunities due to its growing economy, strategic location, and business-friendly policies. The government actively encourages foreign investment.</p><h2>Key Investment Sectors</h2><p>Turkey's economy offers diverse investment opportunities across multiple sectors.</p><h3>Real Estate</h3><p>The Turkish real estate market remains strong with consistent growth. Commercial and residential properties offer good returns, especially in Istanbul and Ankara.</p><h3>Tourism</h3><p>Turkey is a top tourist destination. Hotels, tour operators, and hospitality businesses show strong potential returns.</p><h3>Technology</h3><p>Istanbul's tech scene is booming with startups and innovation hubs. Tech investments are attracting venture capital globally.</p><h3>Manufacturing</h3><p>Strategic location between Europe and Asia makes Turkey attractive for manufacturing and export operations.</p><h2>Investor Visa Requirements</h2><p>Foreign investors can obtain residency permits by investing a minimum amount (typically $250,000 USD). Investment options include real estate purchase or business establishment.</p><h2>Tax Benefits</h2><p>Turkey offers tax incentives for foreign investors in designated sectors and regions. Consult with local tax advisors for specific benefits.</p><h2>Registration Process</h2><p>Establish your business through the Chamber of Commerce, obtain a tax ID, and register with social insurance. Most processes can be completed in 1-2 weeks.</p>$x$, $x$https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop$x$, $x$business$x$, $x$Sarah Thompson$x$, $x$2026-03-15$x$, $x$published$x$),
  ($x$turkish-visa-types$x$, $x$Visa Types: Which One Do You Need?$x$, $x$Comprehensive overview of different Turkish visa types and how to choose the right one.$x$, $x$<h2>Introduction</h2><p>Turkey offers various visa options depending on your purpose of visit. Understanding the differences is crucial for a smooth entry into the country.</p><h2>Tourist Visa (e-Visa)</h2><p>The most common visa type for short-term tourism. Turkish e-Visas are valid for 90 days and can be obtained online in minutes.</p><h3>Requirements</h3><ul><li>Valid passport (6+ months validity)</li><li>Credit/debit card for payment</li><li>Email address</li></ul><h3>Cost and Validity</h3><p>The cost is approximately $20 USD. The visa is valid for single entry and covers stays of up to 90 days within a 180-day period.</p><h2>Business Visa</h2><p>For entrepreneurs and business professionals looking to establish business in Turkey.</p><h3>Requirements</h3><ul><li>Invitation letter from Turkish company or organization</li><li>Proof of business registration in home country</li><li>Bank statements showing financial stability</li><li>Valid passport</li></ul><h2>Student Visa</h2><p>For students enrolled in Turkish educational institutions. Duration matches your study program.</p><h3>Requirements</h3><ul><li>Admission letter from Turkish university</li><li>Proof of financial support</li><li>Health insurance</li><li>Valid passport</li></ul><h2>Work Visa</h2><p>Required if you're employed by a Turkish company. Your employer must provide sponsorship documentation.</p><h3>Requirements</h3><ul><li>Work permit (obtained by employer)</li><li>Employment contract</li><li>Proof of qualifications</li><li>Valid passport</li></ul><h2>Long-Term Residency Visa</h2><p>For those planning to stay long-term. Leads to residence permit eligibility.</p>$x$, $x$https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop$x$, $x$immigration$x$, $x$Elena Rodriguez$x$, $x$2026-03-10$x$, $x$published$x$),
  ($x$healthcare-turkey$x$, $x$Healthcare System in Turkey: What Expats Need to Know$x$, $x$Guide to Turkish healthcare system, insurance requirements, and medical facilities for expats.$x$, $x$<h2>Introduction</h2><p>Turkey has a well-developed healthcare system with excellent medical facilities, especially in major cities. Expats have access to both public and private healthcare options.</p><h2>Public Healthcare</h2><p>The Turkish public healthcare system (SSK - Social Insurance Institution) covers Turkish citizens and legal residents.</p><h3>Eligibility for Expats</h3><p>Expats with residency permits can register for public healthcare. Registration is free but requires proper documentation and proof of residence.</p><h3>Coverage</h3><p>Public healthcare covers doctor visits, hospital care, and medications. Patients pay co-payments, typically 10-30% of costs.</p><h2>Private Healthcare</h2><p>Private hospitals and clinics are modern, well-staffed, and often preferred by expats for shorter wait times.</p><h3>Insurance</h3><p>Most expats obtain private health insurance through international providers. Premiums vary based on age and coverage level.</p><h3>Major Providers</h3><p>Turkey has excellent private hospitals in Istanbul, Ankara, and Izmir. Many doctors speak English and have international experience.</p><h2>Insurance Requirements</h2><p>Health insurance is mandatory for residence permit holders. You can choose public SSK coverage or private insurance, but coverage is required.</p><h2>Prescription Medications</h2><p>Turkish pharmacies require prescriptions for most medications. Medications are generally affordable and available without appointment.</p><h2>Emergency Care</h2><p>Emergency services (112) are free and well-equipped. Private hospital emergency departments also operate 24/7.</p>$x$, $x$https://images.unsplash.com/photo-1576091160550-112173f31146?w=800&h=400&fit=crop$x$, $x$lifestyle$x$, $x$Dr. Ayşe Yılmaz$x$, $x$2026-03-05$x$, $x$published$x$),
  ($x$real-estate-residency-turkey-2026$x$, $x$Real Estate Residency in Turkey 2026: Complete Guide to Conditions, Steps, and Key Benefits$x$, $x$Complete comprehensive guide to real estate residency (TKY) in Turkey 2026 with updated financial requirements, application steps, and major advantages for property owners.$x$, $x$<h2>Introduction</h2><p>Real estate residency is considered one of the most stable methods for those wishing to live long-term in Turkey. It grants the owner a legal residency permit that is renewed continuously as long as the property remains registered in their name. In this article, we will explore the new criteria recently established by the Turkish government, providing you with all the essential information you need to understand this valuable residency option.</p><h2>What is Real Estate Residency?</h2><p>Real estate residency, officially known as <strong>TKY (Taşınmaz Mülkiyetine Dayalı İkamet İzni)</strong>, is one of the types of <strong>Turkish residence permits</strong> that is granted to foreign nationals who own residential real estate in Turkey. This type of residency is directly linked to property ownership, making it one of the strongest and most reliable forms of residency available to international investors and property owners.</p><p>Unlike other residence permits that require regular renewal and continuous documentation updates, real estate residency provides a more straightforward path to legal residence as long as you maintain ownership of the property. The Turkish government recognizes property ownership as a stable indicator of long-term commitment to residing in the country.</p><h2>Who Can Apply for Real Estate Residency?</h2><p>Real estate residency is available to foreign nationals of any age or nationality, provided they meet the financial and legal requirements. This includes:</p><ul><li>International investors seeking long-term residence</li><li>Retirees planning to spend their golden years in Turkey</li><li>Families looking for stability and security</li><li>Business professionals and entrepreneurs</li><li>Anyone meeting the financial qualification criteria</li></ul><h2>New Financial Requirements for 2026</h2><p><strong>2026 represents a significant year for real estate residency requirements in Turkey.</strong> The Turkish government has established clear financial thresholds to ensure that property owners have sufficient investment in the country.</p><h3>Minimum Property Value</h3><p>The most critical requirement for 2026 is that <strong>the property must have a minimum value of 200,000 USD (American dollars)</strong> as recorded in the official deed (Tapu). This valuation must be reflected in the property registration document and serves as the basis for your residency eligibility.</p><h3>Property Classification</h3><p>The property must be classified as <strong>"residential" (Mesken)</strong> according to Turkish real estate regulations. This means:</p><ul><li>The property must be suitable for residential living</li><li>It cannot be purely commercial or agricultural land</li><li>Apartments, villas, houses, and townhouses all qualify</li><li>Mixed-use properties must have a residential component</li></ul><h3>Geographic Considerations</h3><p>While the 200,000 USD minimum applies broadly, some of Turkey's major metropolitan areas (Istanbul, Ankara, Izmir) may have higher unofficial market values. Always verify current property valuations with local real estate professionals to ensure compliance with latest standards.</p><h2>Key Advantages of Real Estate Residency</h2><p>Real estate residency offers numerous compelling benefits that make it attractive to foreign nationals:</p><h3>Easy Annual Renewal</h3><p>Once you obtain real estate residency, renewal becomes remarkably simple. As long as you continue to own the property and maintain proper documentation, the permit can be renewed without the extensive paperwork required for other residency types. Annual renewal is typically a straightforward administrative process.</p><h3>Family Coverage</h3><p>A major advantage is that your real estate residency automatically extends to your family members:</p><ul><li>Your spouse (married or in a legally recognized partnership)</li><li>Your children under the age of 18 years old</li><li>Dependents who live with you in the property</li></ul><p>This means your entire family receives the protection and benefits of residency status without each member needing separate applications.</p><h3>Path to Permanent Residency</h3><p>Real estate residency serves as a reliable stepping stone to <strong>permanent residency</strong>. After maintaining continuous legal residence for <strong>8 years</strong> through any combination of residence permits, you become eligible for permanent residency, which grants rights equivalent to Turkish citizenship (except political rights).</p><h3>Security and Stability</h3><p>Because your residency is directly tied to property ownership, you have a secure and stable legal status. Unlike work-dependent residencies that may end if you lose employment, or tourist residencies that require regular documentation updates, your real estate residency remains valid as long as you own the property.</p><h3>Gateway to Turkish Citizenship</h3><p>After 8 years of continuous legal residence (which can include real estate residency), you become eligible to apply for Turkish citizenship. This option appeals to many long-term international residents seeking full integration into Turkish society.</p><h2>Detailed Application Steps</h2><h3>Step 1: Property Acquisition</h3><p>The first step is to purchase a residential property valued at minimum 200,000 USD. Work with a reputable real estate agent or lawyer to:</p><ul><li>Identify properties meeting the criteria</li><li>Conduct property inspections and valuations</li><li>Negotiate terms and finalize the purchase</li><li>Ensure the deed is properly registered in your name</li></ul><h3>Step 2: Obtain Necessary Documentation</h3><p>Gather the following essential documents (detailed below in the required documents section):</p><ul><li>Property deed (Tapu)</li><li>Professional property appraisal report</li><li>Earthquake insurance certificate (DASK)</li><li>Valid passport and translation</li><li>Tax ID number (if not already obtained)</li></ul><h3>Step 3: Secure Health Insurance</h3><p>Obtain comprehensive health insurance that covers your entire stay in Turkey. This can be:</p><ul><li>Private international health insurance</li><li>Turkish public health insurance (SGK)</li><li>Any recognized insurance provider operating in Turkey</li></ul><h3>Step 4: Submit Your Application</h3><p>Apply through one of two methods:</p><ul><li><strong>Online:</strong> Use the e-Ikamet system (https://e-ikamet.goc.gov.tr)</li><li><strong>In-Person:</strong> Visit your local Migration Office (Göç İdareliği)</li></ul><h3>Step 5: Application Processing</h3><p>The typical processing time ranges from <strong>2 weeks to 3 months</strong>, depending on:</p><ul><li>Your specific province and local office workload</li><li>Completeness of your documentation</li><li>Current migration office capacity</li><li>Any additional verification requirements</li></ul><h2>Required Documents and Papers</h2><p>Ensure you have all required documentation prepared before applying:</p><h3>Property Documentation</h3><ul><li><strong>Tapu (Property Deed):</strong> Official property ownership document showing the property is registered in your name with a minimum value of 200,000 USD</li><li><strong>Expertise Report (Expertise):</strong> Professional property valuation confirming the property's market value</li><li><strong>Property Tax Declaration:</strong> Recent property tax payment or declaration</li></ul><h3>Insurance Documentation</h3><ul><li><strong>DASK (Earthquake Insurance):</strong> Turkish government-mandated earthquake insurance certificate</li><li><strong>Health Insurance:</strong> Valid health insurance policy covering your residency period</li></ul><h3>Personal Documentation</h3><ul><li><strong>Passport:</strong> Valid international passport with minimum 6 months validity</li><li><strong>Passport Copy:</strong> Certified translation of your passport (Turkish language)</li><li><strong>Biometric Photos:</strong> Recent photos (4x6 cm, white background)</li><li><strong>Tax ID:</strong> Turkish tax identification number (obtained from tax office or during application)</li></ul><h3>Financial Documentation</h3><ul><li><strong>Bank Statement:</strong> Recent bank statements showing financial capacity</li><li><strong>Proof of Funds:</strong> Evidence of legitimate sources of funds used for property purchase</li></ul><h2>Financial Requirements and Costs</h2><h3>Property Investment</h3><p>The primary financial requirement is the 200,000 USD minimum property value. This represents your main investment and is the basis for your residency eligibility.</p><h3>Application Fees</h3><p>Turkish migration application fees are nominal and typically range from <strong>150-350 Turkish Lira</strong> (approximately 5-12 USD). Fees vary slightly by province and may increase annually.</p><h3>Additional Costs</h3><p>Additional expenses may include:</p><ul><li>Property valuation/appraisal: 500-2,000 TL</li><li>Health insurance: 2,000-8,000 TL annually (depending on coverage)</li><li>Earthquake insurance (DASK): 300-1,000 TL annually</li><li>Professional assistance (optional): 2,000-5,000 TL</li></ul><h2>Frequently Asked Questions</h2><h3>Can I Get Real Estate Residency Without Living in the Property?</h3><p>Yes. You can own the property and obtain residency without personally residing there. However, you must maintain legal ownership and keep all documentation current. Some regions may require periodic property inspections or proof of ownership continuation.</p><h3>What Happens to My Residency If I Sell the Property?</h3><p>If you sell the property, your real estate residency will terminate. However, you may be eligible to apply for other types of residency (such as short-term or long-term tourism residency) if you meet those criteria.</p><h3>Can I Rent Out My Property While Holding Real Estate Residency?</h3><p>Yes. You can rent out your property to generate income while maintaining real estate residency. This is one of the attractive features for property investors. You'll need to declare rental income for tax purposes.</p><h3>How Long Can I Stay in Turkey with Real Estate Residency?</h3><p>Real estate residency is valid for 2 years initially and can be renewed indefinitely as long as you maintain ownership and meet documentation requirements. There is no limit to the total duration of your residency.</p><h3>Can My Family Get Residency Through My Property?</h3><p>Yes. Your spouse and children under 18 automatically qualify for family residency linked to your real estate ownership. They don't need to own property themselves.</p><h3>Is Real Estate Residency a Path to Citizenship?</h3><p>Indirectly, yes. Real estate residency counts toward the 8-year continuous legal residence requirement for permanent residency, which can lead to citizenship eligibility after an additional waiting period.</p><h2>Important Tips and Recommendations</h2><h3>Work with Professionals</h3><p>Consider hiring a qualified immigration lawyer and real estate agent to guide you through the process. Their expertise can prevent costly mistakes and ensure compliance with all requirements.</p><h3>Verify Property Details Carefully</h3><p>Before purchasing, thoroughly verify:</p><ul><li>Exact property boundaries and square footage</li><li>Clear ownership history and any liens or encumbrances</li><li>Proper zoning classification as residential</li><li>Compliance with all Turkish real estate laws</li></ul><h3>Keep Documentation Updated</h3><p>Maintain organized records of all documents including property deeds, insurance policies, tax declarations, and residency permits. Keep copies in secure locations (both physical and digital).</p><h3>Understand Currency Fluctuations</h3><p>The 200,000 USD requirement is fixed. If exchange rates fluctuate, ensure your property valuation remains above this threshold. Monitor property assessments regularly.</p><h3>Plan for Renewal</h3><p>Begin the renewal process 2-3 months before your current residency expires. This ensures no gaps in your legal status and avoids potential complications.</p><h2>Conclusion</h2><p>Real estate residency in Turkey 2026 represents a stable, straightforward, and advantageous pathway for foreign nationals seeking long-term residence in this beautiful country. With a minimum 200,000 USD property investment, you gain not only a valuable asset but also secure legal residence for you and your immediate family. The simplicity of annual renewals, combined with the potential path to permanent residency and citizenship, makes real estate residency an excellent choice for serious long-term residents and investors.</p><p>Whether you're seeking a retirement haven, an investment opportunity, or a new home base, Turkey's real estate residency program offers the security and stability you need. Take the first step today by consulting with professionals and exploring the Turkish property market. Your future in Turkey awaits.</p><p><strong>Need personalized guidance?</strong> The IKAMETI team is ready to assist you with every aspect of your real estate residency journey. <a href="../contact.html">Contact us today</a> for a free consultation tailored to your specific situation.</p>$x$, $x$https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop$x$, $x$immigration$x$, $x$IKAMETI Team$x$, $x$2026-04-28$x$, $x$published$x$)
on conflict (slug) do nothing;
