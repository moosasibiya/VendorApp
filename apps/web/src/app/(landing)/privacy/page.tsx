import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Vendr Studios collects, uses, and protects your personal information in accordance with POPIA.",
  alternates: { canonical: "https://vendr.studio/privacy" },
};

const CONTACT_EMAIL = "hello@vendr.studio";
const LAST_UPDATED = "17 May 2026";

const SECTIONS = [
  {
    heading: "Who we are",
    body: `Vendr Studios (Pty) Ltd is a South African company building a verified marketplace for booking photographers and videographers. This policy explains how we handle personal information collected through our prelaunch and insider programme pages.`,
  },
  {
    heading: "What we collect",
    items: [
      "First name and last name",
      "Email address",
      "Phone number (with country code)",
      "Role selection (client or creative)",
      "Referral code and referral source (if you were referred by someone)",
      "Signup source and timestamp",
      "IP address and browser user-agent (for spam and abuse prevention only)",
    ],
  },
  {
    heading: "Why we collect it",
    items: [
      "To manage your place on the Vendr prelaunch access list",
      "To send launch updates, announcements, and insider programme communications",
      "To track referrals and apply referral rewards when you are verified",
      "To manage and verify your insider programme status",
      "To contact you before and after the 1 July 2026 launch with onboarding information",
      "To prevent duplicate or fraudulent signups",
    ],
  },
  {
    heading: "How we use your data",
    body: `Your details are used solely for the purposes above. We do not sell, rent, or share your personal information with third parties for marketing purposes. We may use a transactional email service to deliver communications — that provider processes your email address on our behalf and is bound by appropriate data processing agreements.`,
  },
  {
    heading: "How long we keep it",
    body: `We retain your information for as long as it is needed to fulfil the purposes described above, or as required to resolve disputes, enforce agreements, or comply with applicable law. If you request deletion, we will remove your data within 30 days, except where retention is required by law.`,
  },
  {
    heading: "Your rights under POPIA",
    body: `The Protection of Personal Information Act (POPIA) gives you the following rights regarding your personal information:`,
    items: [
      "Access — request a copy of the information we hold about you",
      "Correction — request that we correct inaccurate or incomplete information",
      "Deletion — request that we delete your information",
      "Objection — object to how we process your information",
      "Complaint — lodge a complaint with the Information Regulator (South Africa)",
    ],
  },
  {
    heading: "Cookies and tracking",
    body: `Our prelaunch pages do not use advertising cookies or third-party tracking pixels. We use only the technical cookies required to submit forms securely (CSRF protection).`,
  },
  {
    heading: "Contact us",
    body: `To exercise any of your rights, or if you have any questions about how we handle your information, contact us at:`,
    contact: CONTACT_EMAIL,
  },
];

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #000005 0%, #00001e 100%)",
        color: "#cfe9ff",
        fontFamily: '"Aileron", "Manrope", system-ui, sans-serif',
        overflowX: "hidden",
      }}
    >
      {/* Minimal nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "clamp(14px, 2vw, 20px) clamp(20px, 5vw, 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,15,.7)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(207,233,255,.08)",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 600,
            fontSize: "clamp(13px, 2.5vw, 18px)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#cfe9ff",
            textDecoration: "none",
          }}
        >
          VENDR<span style={{ color: "#652263" }}>.</span>STUDIO
        </Link>

        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 400,
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(207,233,255,.65)",
            textDecoration: "none",
            padding: "10px 18px",
            border: "1px solid rgba(207,233,255,.2)",
            borderRadius: 999,
            transition: "color 0.3s, border-color 0.3s",
          }}
        >
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
            <path d="M11 5H1M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
      </nav>

      {/* Page content */}
      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "clamp(48px, 8vw, 96px) clamp(20px, 5vw, 36px) clamp(64px, 10vw, 120px)",
        }}
      >
        {/* Kicker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 36,
              height: 1,
              background: "rgba(207,233,255,.35)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "rgba(207,233,255,.5)",
              fontWeight: 400,
            }}
          >
            Privacy Policy
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontWeight: 300,
            fontSize: "clamp(32px, 6vw, 72px)",
            lineHeight: 0.96,
            letterSpacing: "-0.025em",
            textTransform: "uppercase",
            color: "#cfe9ff",
            marginBottom: 20,
          }}
        >
          Your data,<br />
          <em
            style={{
              fontStyle: "normal",
              fontWeight: 500,
              background: "linear-gradient(110deg, #cfe9ff 0%, #b58bd6 50%, #cfe9ff 100%)",
              backgroundSize: "280% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            your rights.
          </em>
        </h1>

        <p
          style={{
            fontSize: 13,
            letterSpacing: "0.12em",
            color: "rgba(207,233,255,.4)",
            textTransform: "uppercase",
            marginBottom: 60,
            fontWeight: 400,
          }}
        >
          Last updated {LAST_UPDATED}
        </p>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, rgba(207,233,255,.15), transparent)",
            marginBottom: 60,
          }}
        />

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2
                style={{
                  fontWeight: 400,
                  fontSize: "clamp(11px, 1.5vw, 13px)",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "#652263",
                  marginBottom: 16,
                }}
              >
                {section.heading}
              </h2>

              {"body" in section && section.body && (
                <p
                  style={{
                    fontSize: "clamp(15px, 2vw, 17px)",
                    lineHeight: 1.75,
                    color: "rgba(207,233,255,.75)",
                    fontWeight: 300,
                    marginBottom: "items" in section && section.items ? 20 : 0,
                  }}
                >
                  {section.body}
                </p>
              )}

              {"items" in section && section.items && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {section.items.map((item) => (
                    <li
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "10px 0",
                        borderBottom: "1px solid rgba(207,233,255,.05)",
                        fontSize: "clamp(14px, 1.8vw, 16px)",
                        lineHeight: 1.65,
                        color: "rgba(207,233,255,.72)",
                        fontWeight: 300,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          marginTop: 8,
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #652263, #b58bd6)",
                        }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {"contact" in section && section.contact && (
                <a
                  href={`mailto:${section.contact}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 16,
                    fontSize: 15,
                    fontWeight: 400,
                    letterSpacing: "0.05em",
                    color: "#cfe9ff",
                    borderBottom: "1px solid rgba(207,233,255,.3)",
                    paddingBottom: 2,
                    textDecoration: "none",
                  }}
                >
                  {section.contact}
                </a>
              )}
            </section>
          ))}
        </div>

        {/* Footer rule */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, rgba(207,233,255,.1), transparent)",
            margin: "72px 0 36px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(207,233,255,.28)",
              fontWeight: 400,
            }}
          >
            © 2026 VendrStudio (Pty) Ltd · South Africa
          </p>

          <Link
            href="/#signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(207,233,255,.45)",
              textDecoration: "none",
              fontWeight: 400,
            }}
          >
            Join the Insider Programme
            <svg width="12" height="8" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path d="M1 5H13M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
