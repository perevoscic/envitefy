"use client";

import { CalendarDays, FileText, Hotel, MapPinned, Medal } from "lucide-react";
import { useId, useState } from "react";
import styles from "./GymnasticsMeetDemo.module.css";

const sections = [
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "venue", label: "Venue", icon: MapPinned },
  { id: "hotels", label: "Hotels", icon: Hotel },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

type Section = (typeof sections)[number]["id"];

export default function GymnasticsMeetDemo() {
  const [activeSection, setActiveSection] = useState<Section>("schedule");
  const panelId = useId();

  return (
    <article
      className={styles.demo}
      data-authored-preview
      data-appearance-scope="authored"
      data-testid="gymnastics-meet-demo"
      aria-label="Interactive sample meet page"
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.emblem} aria-hidden="true">
            <Medal />
          </span>
          <p className={styles.label}>Sample meet page</p>
        </div>
        <div className={styles.meetIdentity}>
          <div className={styles.meetName}>
            <h2 className={styles.title}>Summit Invitational</h2>
            <p className={styles.meta}>
              <span>April 18–20</span>
              <span>Aurora Convention Hall</span>
            </p>
          </div>
          <div className={styles.dateBadge} aria-hidden="true">
            <span>April</span>
            <strong>18–20</strong>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.controls} role="group" aria-label="Explore the sample meet page">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={styles.control}
              aria-pressed={activeSection === id}
              aria-controls={panelId}
              onClick={() => setActiveSection(id)}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div id={panelId} className={styles.panel} aria-live="polite" aria-atomic="true">
          {activeSection === "schedule" && (
            <>
              <div className={styles.panelHeading}>
                <p className={styles.kicker}>Saturday · Session 3</p>
                <h3>Level 7 &amp; Xcel Platinum</h3>
              </div>
              <dl className={styles.schedule}>
                {[
                  ["Coach check-in", "7:20 AM"],
                  ["Warm-up", "7:45 AM"],
                  ["Awards", "11:40 AM"],
                ].map(([label, time]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{time}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {activeSection === "venue" && (
            <>
              <div className={styles.panelHeading}>
                <p className={styles.kicker}>Location &amp; arrival</p>
                <h3>Aurora Convention Hall</h3>
              </div>
              <dl className={styles.details}>
                <div>
                  <dt>Entrance</dt>
                  <dd>Use the east entrance for athlete check-in and spectator access.</dd>
                </div>
                <div>
                  <dt>Parking</dt>
                  <dd>Lots B and C are closest to the competition hall.</dd>
                </div>
              </dl>
            </>
          )}
          {activeSection === "hotels" && (
            <>
              <div className={styles.panelHeading}>
                <p className={styles.kicker}>Hotel information</p>
                <h3>Stay near the meet</h3>
              </div>
              <dl className={styles.details}>
                <div>
                  <dt>Sample hotel block</dt>
                  <dd>Hotel details, room information and booking link.</dd>
                </div>
                <div>
                  <dt>Booking deadline</dt>
                  <dd>March 28</dd>
                </div>
              </dl>
            </>
          )}
          {activeSection === "documents" && (
            <>
              <div className={styles.panelHeading}>
                <p className={styles.kicker}>Meet resources</p>
                <h3>Meet documents</h3>
              </div>
              <dl className={`${styles.details} ${styles.documents}`}>
                <div>
                  <dt>
                    <FileText aria-hidden="true" />
                    Sample meet packet
                  </dt>
                  <dd>Competition guidance, session information and coach reminders.</dd>
                </div>
                <div>
                  <dt>
                    <FileText aria-hidden="true" />
                    Sample venue notes
                  </dt>
                  <dd>Arrival instructions, parking information and spectator guidance.</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>
      <footer className={styles.footer}>Illustrative meet</footer>
    </article>
  );
}
