"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type {
  Agency,
  Artist,
  ArtistProfileInput,
  OnboardingAgencyInput,
  OnboardingClientInput,
  User,
} from "@vendorapp/shared";
import {
  ApiError,
  createAgency,
  defaultAppPathForUser,
  fetchMe,
  fetchMyAgency,
  fetchMyArtistProfile,
  updateClientOnboarding,
  updateMyArtistProfile,
} from "@/lib/api";
import styles from "./page.module.css";

const artistSteps = [
  { title: "Basics", hint: "Set the public identity clients will see first." },
  { title: "Services", hint: "Show the kind of work you want to be booked for." },
  { title: "Availability", hint: "Add pricing, availability, and portfolio links." },
  { title: "Review", hint: "Check the profile before you publish it." },
];
const clientSteps = [
  { title: "Profile", hint: "Set the profile details tied to your bookings." },
  { title: "Preferences", hint: "Add event types and your budget range." },
  { title: "Done", hint: "Review the profile before finishing onboarding." },
];
const agencySteps = [
  { title: "Agency", hint: "Define the public identity for your agency." },
  { title: "Contact", hint: "Add the contact details clients and artists need." },
  { title: "Done", hint: "Review the agency profile before publishing it." },
];
const serviceOptions = ["Photography", "Videography", "Content Creation", "Graphic Design", "Event Coverage", "Creative Direction"];
const specialtyOptions = ["Weddings", "Editorial", "Portraits", "Commercial", "Lifestyle", "Brand Campaigns", "Music", "Corporate Events"];
const clientEventOptions = ["Wedding", "Private Celebration", "Corporate Event", "Brand Campaign", "Product Launch", "Portrait Session", "Music Event", "Content Shoot"];

type ClientForm = {
  fullName: string;
  avatarUrl: string;
  location: string;
  eventTypes: string[];
  budgetMin: string;
  budgetMax: string;
};

type AgencyForm = {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  website: string;
  contactName: string;
  contactEmail: string;
};

const emptyArtistForm: ArtistProfileInput = {
  displayName: "",
  role: "",
  location: "",
  bio: "",
  services: [],
  specialties: [],
  pricingSummary: "",
  availabilitySummary: "",
  portfolioLinks: ["", "", ""],
};

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizePortfolioLinks(values: string[] | undefined): string[] {
  const links = uniqueValues(values ?? []);
  while (links.length < 3) links.push("");
  return links.slice(0, 4);
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 80);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function summaryValue(value: string | string[]): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not set";
  return value.trim() || "Not set";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
  const [artistForm, setArtistForm] = useState<ArtistProfileInput>(emptyArtistForm);
  const [clientForm, setClientForm] = useState<ClientForm>({
    fullName: "",
    avatarUrl: "",
    location: "",
    eventTypes: [],
    budgetMin: "",
    budgetMax: "",
  });
  const [agencyForm, setAgencyForm] = useState<AgencyForm>({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
    website: "",
    contactName: "",
    contactEmail: "",
  });
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [isAgencySlugEdited, setIsAgencySlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const currentUser = await fetchMe();
        if (cancelled) return;
        setUser(currentUser);
        if (currentUser.accountType === "CREATIVE") {
          const profile = await fetchMyArtistProfile();
          if (cancelled) return;
          setArtistProfile(profile);
          setArtistForm({
            displayName: profile?.name ?? currentUser.fullName,
            role: profile?.role ?? "",
            location: profile?.location ?? currentUser.location ?? "",
            bio: profile?.bio ?? "",
            services: profile?.services ?? [],
            specialties: profile?.specialties ?? [],
            pricingSummary: profile?.pricingSummary ?? "",
            availabilitySummary: profile?.availabilitySummary ?? "",
            portfolioLinks: normalizePortfolioLinks(profile?.portfolioLinks),
          });
          setSavedSlug(profile?.slug ?? null);
        } else if (currentUser.accountType === "AGENCY") {
          const agency = await fetchMyAgency();
          if (cancelled) return;
          setAgencyForm({
            name: agency?.name ?? "",
            slug: agency?.slug ?? "",
            description: agency?.description ?? "",
            logoUrl: agency?.logoUrl ?? "",
            website: agency?.website ?? "",
            contactName: agency?.contactName ?? currentUser.fullName,
            contactEmail: agency?.contactEmail ?? currentUser.email,
          });
          setIsAgencySlugEdited(Boolean(agency?.slug));
        } else {
          setClientForm({
            fullName: currentUser.fullName,
            avatarUrl: currentUser.avatarUrl ?? "",
            location: currentUser.location ?? "",
            eventTypes: uniqueValues(currentUser.clientEventTypes ?? []),
            budgetMin: currentUser.clientBudgetMin === null || currentUser.clientBudgetMin === undefined ? "" : String(currentUser.clientBudgetMin),
            budgetMax: currentUser.clientBudgetMax === null || currentUser.clientBudgetMax === undefined ? "" : String(currentUser.clientBudgetMax),
          });
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof ApiError ? loadError.message : "Unable to load onboarding right now.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flow = useMemo(() => {
    if (!user) return null;
    if (user.accountType === "CREATIVE") {
      return {
        kicker: "Artist application",
        title: "Submit your profile for review",
        subtitle:
          "There is no upfront onboarding payment in the current rollout. Complete your profile, enter the review queue, and move live when an admin approves your launch slot.",
        steps: artistSteps,
        totalRequired: 3,
      };
    }
    if (user.accountType === "AGENCY") return { kicker: "Agency onboarding", title: "Launch the agency profile your team will operate from", subtitle: "Set up the agency identity, contact details, and publish the account in one pass.", steps: agencySteps, totalRequired: 2 };
    return { kicker: "Client onboarding", title: "Set up the profile you will use to book artists", subtitle: "Add your booking preferences once so discovery and bookings start from the right context.", steps: clientSteps, totalRequired: 2 };
  }, [user]);

  const validateStep = (targetStep: number): string | null => {
    if (!user) return "Unable to load account context.";
    if (user.accountType === "CREATIVE") {
      if (targetStep === 0) {
        if (artistForm.displayName.trim().length < 2) return "Add the display name clients should see.";
        if (artistForm.role.trim().length < 2) return "Add your primary role.";
        if (artistForm.location.trim().length < 2) return "Add the city or region where you work.";
        if (artistForm.bio.trim().length < 20) return "Write a short bio so clients understand your style.";
      }
      if (targetStep === 1) {
        if (artistForm.services.length === 0) return "Choose at least one service.";
        if (artistForm.specialties.length === 0) return "Choose at least one specialty.";
      }
      if (targetStep === 2) {
        if (!artistForm.pricingSummary.trim()) return "Add a pricing summary.";
        if (!artistForm.availabilitySummary.trim()) return "Add an availability summary.";
        const links = uniqueValues(artistForm.portfolioLinks);
        if (links.length === 0) return "Add at least one portfolio link.";
        if (links.some((link) => !isValidUrl(link))) return "Portfolio links must be valid URLs.";
      }
      return null;
    }

    if (user.accountType === "CLIENT") {
      if (targetStep === 0) {
        if (clientForm.fullName.trim().length < 2) return "Add the full name for the client profile.";
        if (clientForm.location.trim().length < 2) return "Add the location you book from most often.";
        if (clientForm.avatarUrl.trim() && !isValidUrl(clientForm.avatarUrl.trim())) return "Avatar URL must be a valid http:// or https:// link.";
      }
      if (targetStep === 1) {
        if (clientForm.eventTypes.length === 0) return "Select at least one event type preference.";
        const budgetMin = clientForm.budgetMin.trim() ? Number(clientForm.budgetMin) : null;
        const budgetMax = clientForm.budgetMax.trim() ? Number(clientForm.budgetMax) : null;
        if ((budgetMin !== null && Number.isNaN(budgetMin)) || (budgetMax !== null && Number.isNaN(budgetMax))) return "Budget values must be valid numbers.";
        if ((budgetMin ?? 0) < 0 || (budgetMax ?? 0) < 0) return "Budget values cannot be negative.";
        if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) return "Minimum budget cannot be greater than maximum budget.";
      }
      return null;
    }

    if (targetStep === 0) {
      if (agencyForm.name.trim().length < 2) return "Add the agency name.";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(agencyForm.slug.trim())) return "Agency slug must use lowercase letters, numbers, and hyphens only.";
      if (agencyForm.description.trim().length < 10) return "Add a short agency description.";
      if (agencyForm.logoUrl.trim() && !isValidUrl(agencyForm.logoUrl.trim())) return "Logo URL must be a valid http:// or https:// link.";
    }
    if (targetStep === 1) {
      if (agencyForm.contactName.trim().length < 2) return "Add the primary contact name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyForm.contactEmail.trim())) return "Add a valid contact email address.";
      if (agencyForm.website.trim() && !isValidUrl(agencyForm.website.trim())) return "Website must be a valid http:// or https:// link.";
    }
    return null;
  };

  const completedCount = flow ? Array.from({ length: flow.totalRequired }, (_, index) => index).filter((index) => validateStep(index) === null).length : 0;

  const submit = async () => {
    if (!user) return;
    const totalRequired = user.accountType === "CREATIVE" ? 3 : 2;
    for (let index = 0; index < totalRequired; index += 1) {
      const validationError = validateStep(index);
      if (validationError) {
        setStep(index);
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (user.accountType === "CREATIVE") {
        const saved = await updateMyArtistProfile({
          ...artistForm,
          displayName: artistForm.displayName.trim(),
          role: artistForm.role.trim(),
          location: artistForm.location.trim(),
          bio: artistForm.bio.trim(),
          services: uniqueValues(artistForm.services),
          specialties: uniqueValues(artistForm.specialties),
          pricingSummary: artistForm.pricingSummary.trim(),
          availabilitySummary: artistForm.availabilitySummary.trim(),
          portfolioLinks: uniqueValues(artistForm.portfolioLinks),
        });
        setArtistProfile(saved);
        setSavedSlug(saved.slug);
      } else if (user.accountType === "CLIENT") {
        const updated = await updateClientOnboarding({
          fullName: clientForm.fullName.trim(),
          avatarUrl: clientForm.avatarUrl.trim() || null,
          location: clientForm.location.trim(),
          eventTypes: uniqueValues(clientForm.eventTypes),
          budgetMin: clientForm.budgetMin.trim() ? Number(clientForm.budgetMin) : null,
          budgetMax: clientForm.budgetMax.trim() ? Number(clientForm.budgetMax) : null,
        } satisfies OnboardingClientInput);
        setUser(updated);
      } else {
        const savedAgency = await createAgency({
          name: agencyForm.name.trim(),
          slug: agencyForm.slug.trim(),
          description: agencyForm.description.trim(),
          logoUrl: agencyForm.logoUrl.trim() || null,
          website: agencyForm.website.trim() || null,
          contactName: agencyForm.contactName.trim(),
          contactEmail: agencyForm.contactEmail.trim().toLowerCase(),
        } satisfies OnboardingAgencyInput);
        setSavedSlug(savedAgency.slug);
      }

      const nextUser = { ...user, onboardingCompleted: true };
      setUser(nextUser);
      setSuccessMessage(
        user.accountType === "CREATIVE"
          ? "Application saved. Redirecting to your dashboard."
          : "Onboarding saved. Redirecting to your workspace.",
      );
      router.push(defaultAppPathForUser(nextUser));
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : "Unable to save onboarding right now.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <main className={styles.page}><section className={styles.loadingCard}><p className={styles.kicker}>Onboarding</p><h1 className={styles.title}>Loading your setup</h1><p className={styles.subtitle}>Pulling your account and any saved onboarding data.</p></section></main>;
  }
  if (!user || !flow) {
    return <main className={styles.page}><section className={styles.loadingCard}><p className={styles.kicker}>Onboarding</p><h1 className={styles.title}>Unable to load onboarding</h1><p className={styles.subtitle}>Sign in again and reopen this page.</p></section></main>;
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.sidebar}>
          <p className={styles.kicker}>{flow.kicker}</p>
          <h1 className={styles.title}>{flow.title}</h1>
          <p className={styles.subtitle}>{flow.subtitle}</p>
          {user.accountType === "CREATIVE" ? (
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <strong>Application status</strong>
                <span className={styles.statusPill}>
                  {artistProfile?.applicationStatus
                    ? artistProfile.applicationStatus.toLowerCase().replace(/_/g, " ")
                    : "draft"}
                </span>
              </div>
              <p>{artistProfile?.applicationMessage ?? "Complete your profile to enter the review queue."}</p>
              <div className={styles.statusMeta}>
                <span>Sequence: {artistProfile?.applicationSequence ?? "Pending"}</span>
                <span>Submitted: {artistProfile?.applicationSubmittedAt ? new Date(artistProfile.applicationSubmittedAt).toLocaleDateString("en-ZA") : "Not yet"}</span>
                <span>Live: {artistProfile?.isLive ? "Yes" : "Not yet"}</span>
              </div>
            </div>
          ) : null}
          <div className={styles.progressCard}><div><span className={styles.progressLabel}>Completion</span><strong className={styles.progressValue}>{Math.round((completedCount / Math.max(flow.totalRequired, 1)) * 100)}%</strong></div><p className={styles.progressText}>{completedCount} of {flow.totalRequired} setup sections ready.</p></div>
          <div className={styles.stepList}>{flow.steps.map((item, index) => <button key={item.title} type="button" className={`${styles.stepCard} ${index === step ? styles.stepCardActive : ""}`} onClick={() => setStep(index)}><span className={styles.stepIndex}>{index + 1}</span><span className={styles.stepText}><strong>{item.title}</strong><small>{item.hint}</small></span><span className={styles.stepState}>{index < flow.totalRequired && validateStep(index) === null ? "Ready" : index === step ? "Current" : "Pending"}</span></button>)}</div>
        </aside>

        <section className={styles.content}>
          {error ? <div className={styles.errorBanner}>{error}</div> : null}
          {successMessage ? <div className={styles.successBanner}><div><strong>{successMessage}</strong><p>Your account is now using this onboarding data.</p></div>{savedSlug && user.accountType === "CREATIVE" ? <Link href={`/artists/${savedSlug}`} className={styles.successLink}>View profile</Link> : null}</div> : null}
          <div className={styles.formCard}>
            <div className={styles.sectionHeader}><div><p className={styles.sectionEyebrow}>Step {step + 1} of {flow.steps.length}</p><h2>{flow.steps[step].title}</h2><p>{flow.steps[step].hint}</p></div><span className={styles.accountBadge}>{user.accountType === "CREATIVE" ? "Creative account" : user.accountType === "AGENCY" ? "Agency account" : "Client account"}</span></div>
            {user.accountType === "CREATIVE" ? renderArtistStep(step, artistForm, setArtistForm) : user.accountType === "CLIENT" ? renderClientStep(step, clientForm, setClientForm) : renderAgencyStep(step, agencyForm, setAgencyForm, isAgencySlugEdited, setIsAgencySlugEdited)}
            <div className={styles.actions}><button type="button" className={styles.ghostBtn} onClick={() => { setError(null); setStep((current) => Math.max(current - 1, 0)); }} disabled={step === 0 || isSaving}>Previous</button><div className={styles.inlineActions}>{step < flow.steps.length - 1 ? <button type="button" className={styles.primaryBtn} onClick={() => { const validationError = validateStep(step); if (validationError) { setError(validationError); return; } setError(null); setStep((current) => Math.min(current + 1, flow.steps.length - 1)); }} disabled={isSaving}>Continue</button> : <button type="button" className={styles.primaryBtn} onClick={() => void submit()} disabled={isSaving}>{isSaving ? "Saving..." : user.accountType === "CREATIVE" ? "Submit application" : "Finish onboarding"}</button>}</div></div>
          </div>
        </section>
      </section>
    </main>
  );
}

function renderArtistStep(step: number, form: ArtistProfileInput, setForm: Dispatch<SetStateAction<ArtistProfileInput>>) {
  if (step === 0) return <div className={styles.fieldGrid}><label className={styles.field}>Display name<input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Studio Kuhle" /></label><label className={styles.field}>Primary role<input value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} placeholder="Wedding Photographer" /></label><label className={styles.field}>Location<input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Cape Town" /></label><label className={`${styles.field} ${styles.fieldFull}`}>Bio<textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Tell clients what you shoot, how you work, and what sets your style apart." /></label></div>;
  if (step === 1) return <div className={styles.sectionStack}><ChoiceGroup title="Services" lead="Select every service you actively want inquiries for." options={serviceOptions} values={form.services} onToggle={(value) => setForm((current) => ({ ...current, services: current.services.includes(value) ? current.services.filter((item) => item !== value) : [...current.services, value] }))} /><ChoiceGroup title="Specialties" lead="Add the work you want to become known for." options={specialtyOptions} values={form.specialties} onToggle={(value) => setForm((current) => ({ ...current, specialties: current.specialties.includes(value) ? current.specialties.filter((item) => item !== value) : [...current.specialties, value] }))} /></div>;
  if (step === 2) return <div className={styles.sectionStack}><div className={styles.fieldGrid}><label className={styles.field}>Pricing summary<input value={form.pricingSummary} onChange={(event) => setForm((current) => ({ ...current, pricingSummary: event.target.value }))} placeholder="Portraits from R3,500. Weddings from R12,000." /></label><label className={styles.field}>Availability summary<input value={form.availabilitySummary} onChange={(event) => setForm((current) => ({ ...current, availabilitySummary: event.target.value }))} placeholder="Available in Gauteng and Western Cape with 2 weeks notice." /></label></div><div className={styles.portfolioGrid}>{form.portfolioLinks.map((value, index) => <label key={index} className={styles.field}>Portfolio link {index + 1}<input value={value} onChange={(event) => setForm((current) => { const nextLinks = [...current.portfolioLinks]; nextLinks[index] = event.target.value; return { ...current, portfolioLinks: nextLinks }; })} placeholder="https://yourportfolio.com/project" /></label>)}</div><div className={styles.rolloutNote}><strong>Current rollout policy</strong><p>No upfront onboarding payment is collected right now. Profiles are reviewed manually, and approved artists go live in limited rollout slots.</p></div></div>;
  return <div className={styles.reviewGrid}><SummaryCard label="Public identity" title={summaryValue(form.displayName)} lines={[summaryValue(form.role), summaryValue(form.location)]} /><SummaryCard label="About" lines={[summaryValue(form.bio)]} /><SummaryCard label="Services" lines={[summaryValue(form.services)]} /><SummaryCard label="Specialties" lines={[summaryValue(form.specialties)]} /><SummaryCard label="Booking summary" lines={[summaryValue(form.pricingSummary), summaryValue(form.availabilitySummary)]} /><SummaryCard label="Rollout" lines={["Application review happens before launch approval.", "No upfront onboarding payment in the current rollout.", "If enabled, onboarding recovery is taken from the first completed booking only."]} /><SummaryCard label="Portfolio" lines={uniqueValues(form.portfolioLinks).length ? uniqueValues(form.portfolioLinks) : ["No links added yet."]} /></div>;
}

function renderClientStep(step: number, form: ClientForm, setForm: Dispatch<SetStateAction<ClientForm>>) {
  if (step === 0) return <div className={styles.fieldGrid}><label className={styles.field}>Full name<input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Sarah Daniels" /></label><label className={styles.field}>Avatar URL<input value={form.avatarUrl} onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="https://cdn.example.com/avatar.webp" /></label><label className={`${styles.field} ${styles.fieldFull}`}>Location<input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Johannesburg" /></label></div>;
  if (step === 1) return <div className={styles.sectionStack}><ChoiceGroup title="Event types you usually book" lead="These preferences shape discovery and booking suggestions later." options={clientEventOptions} values={form.eventTypes} onToggle={(value) => setForm((current) => ({ ...current, eventTypes: current.eventTypes.includes(value) ? current.eventTypes.filter((item) => item !== value) : [...current.eventTypes, value] }))} /><div className={styles.fieldGrid}><label className={styles.field}>Budget minimum<input type="number" min="0" value={form.budgetMin} onChange={(event) => setForm((current) => ({ ...current, budgetMin: event.target.value }))} placeholder="5000" /></label><label className={styles.field}>Budget maximum<input type="number" min="0" value={form.budgetMax} onChange={(event) => setForm((current) => ({ ...current, budgetMax: event.target.value }))} placeholder="25000" /></label></div></div>;
  return <div className={styles.reviewGrid}><SummaryCard label="Profile" title={summaryValue(form.fullName)} lines={[summaryValue(form.location), summaryValue(form.avatarUrl)]} /><SummaryCard label="Preferences" lines={[summaryValue(form.eventTypes), form.budgetMin.trim() || form.budgetMax.trim() ? `Budget: ${form.budgetMin.trim() || "0"} to ${form.budgetMax.trim() || "Not set"}` : "Budget: Not set"]} /></div>;
}

function renderAgencyStep(step: number, form: AgencyForm, setForm: Dispatch<SetStateAction<AgencyForm>>, isAgencySlugEdited: boolean, setIsAgencySlugEdited: Dispatch<SetStateAction<boolean>>) {
  if (step === 0) return <div className={styles.fieldGrid}><label className={styles.field}>Agency name<input value={form.name} onChange={(event) => { const value = event.target.value; setForm((current) => ({ ...current, name: value, slug: isAgencySlugEdited ? current.slug : slugify(value) })); }} placeholder="Frame House Collective" /></label><label className={styles.field}>Slug<input value={form.slug} onChange={(event) => { setIsAgencySlugEdited(true); setForm((current) => ({ ...current, slug: slugify(event.target.value) })); }} placeholder="frame-house-collective" /></label><label className={`${styles.field} ${styles.fieldFull}`}>Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the kind of talent your agency represents." /></label><label className={`${styles.field} ${styles.fieldFull}`}>Logo URL<input value={form.logoUrl} onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="https://cdn.example.com/agency-logo.webp" /></label></div>;
  if (step === 1) return <div className={styles.fieldGrid}><label className={styles.field}>Contact name<input value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} placeholder="Lebo Mthembu" /></label><label className={styles.field}>Contact email<input type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} placeholder="team@agency.com" /></label><label className={`${styles.field} ${styles.fieldFull}`}>Website<input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="https://agency.com" /></label></div>;
  return <div className={styles.reviewGrid}><SummaryCard label="Agency" title={summaryValue(form.name)} lines={[summaryValue(form.slug), summaryValue(form.description)]} /><SummaryCard label="Contact" lines={[summaryValue(form.contactName), summaryValue(form.contactEmail), summaryValue(form.website)]} /></div>;
}

function ChoiceGroup(props: { title: string; lead: string; options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return <div><h3 className={styles.blockTitle}>{props.title}</h3><p className={styles.blockLead}>{props.lead}</p><div className={styles.choiceGrid}>{props.options.map((option) => <button key={option} type="button" className={`${styles.choiceCard} ${props.values.includes(option) ? styles.choiceCardSelected : ""}`} onClick={() => props.onToggle(option)}>{option}</button>)}</div></div>;
}

function SummaryCard(props: { label: string; title?: string; lines: string[] }) {
  return <article className={styles.reviewCard}><span className={styles.reviewLabel}>{props.label}</span>{props.title ? <h3>{props.title}</h3> : null}{props.lines.map((line) => <p key={line}>{line}</p>)}</article>;
}
