"use client";

import styles from "./page.module.css";

const references = [
  "Noir product macro",
  "Glass reflection study",
  "Warm paper texture",
  "Late-night editorial",
];

const shotList = [
  { time: "09:00", title: "Bottle detail table-top", owner: "Ava" },
  { time: "11:30", title: "Founder portrait with product", owner: "Client" },
  { time: "15:00", title: "Social motion cutaways", owner: "Kamo" },
];

const deliverables = ["24 edited stills", "6 vertical reels", "Hero campaign gallery", "Usage-ready selects"];
const files = ["Creative brief.pdf", "Venue references.zip", "Lighting notes.md"];
const team = ["Ava Maseko", "Kamo Media", "Naledi Khumalo"];
const progressItems = [
  { label: "Brief", done: true },
  { label: "References", done: true },
  { label: "Shot list", done: true },
  { label: "Files", done: false },
  { label: "Sign-off", done: false },
];

export default function StudioPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Studio workspace</p>
          <h1>Plan the work before anyone arrives on set.</h1>
          <p>
            Moodboards, references, notes, shot lists, files, and deliverables live together
            so every project feels like a controlled creative production.
          </p>
        </div>
        <div className={styles.projectCard}>
          <span>Active project</span>
          <strong>Noir fragrance launch campaign</strong>
          <p>Brief aligned. Shot list in progress. References ready for client review.</p>
          <button type="button">Continue planning</button>
        </div>
      </section>

      <section className={styles.progress}>
        {progressItems.map((item) => (
          <div key={item.label} data-done={item.done}>
            <span>{item.done ? "Done" : "Next"}</span>
            <strong>{item.label}</strong>
          </div>
        ))}
      </section>

      <section className={styles.workspace}>
        <div className={styles.moodboard}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Moodboard</p>
              <h2>Visual direction</h2>
            </div>
            <button type="button">Add reference</button>
          </div>
          <div className={styles.pinGrid}>
            {references.map((reference, index) => (
              <article key={reference} className={styles.pin} data-size={index === 0 ? "large" : "normal"}>
                <div className={styles.pinImage} data-index={index} />
                <strong>{reference}</strong>
                <span>Reference {index + 1}</span>
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.notebook}>
          <p className={styles.kicker}>Notes</p>
          <h2>Creative brief</h2>
          <p>
            Keep the fragrance tactile, cinematic, and expensive. Prioritize reflection,
            condensation, label clarity, and a late-evening launch mood.
          </p>
          <div className={styles.noteLines}>
            <span>Client sign-off needed on hero crop.</span>
            <span>Confirm black acrylic surface by Tuesday.</span>
            <span>Capture BTS clips for launch week.</span>
          </div>
          <button type="button" className={styles.noteAction}>Add planning note</button>
        </aside>

        <section className={styles.board}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Shot list</p>
              <h2>Production schedule</h2>
            </div>
            <button type="button">Export</button>
          </div>
          <div className={styles.timeline}>
            {shotList.map((shot) => (
              <article key={shot.title}>
                <span>{shot.time}</span>
                <strong>{shot.title}</strong>
                <small>{shot.owner}</small>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.stackPanel}>
          <p className={styles.kicker}>Deliverables</p>
          {deliverables.map((item) => (
            <label key={item} className={styles.checkItem}>
              <input type="checkbox" defaultChecked={item.includes("gallery")} />
              {item}
            </label>
          ))}
        </section>

        <section className={styles.stackPanel}>
          <p className={styles.kicker}>Creative team</p>
          {team.map((member) => (
            <div key={member} className={styles.person}>
              <span>{member.slice(0, 2).toUpperCase()}</span>
              <strong>{member}</strong>
            </div>
          ))}
        </section>

        <section className={styles.stackPanel}>
          <p className={styles.kicker}>Files</p>
          {files.map((file) => (
            <div key={file} className={styles.file}>
              <span className="material-symbols-outlined">draft</span>
              {file}
            </div>
          ))}
          <div className={styles.dropZone}>
            <span className="material-symbols-outlined">upload_file</span>
            Drop final references here
          </div>
        </section>
      </section>
    </main>
  );
}
