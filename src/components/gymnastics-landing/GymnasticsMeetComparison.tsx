"use client";

import { CalendarDays, ChevronsLeftRight, MapPinned } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./GymnasticsMeetTransformation.module.css";

export default function GymnasticsMeetComparison() {
  const [position, setPosition] = useState(50);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const moveDivider = (clientX: number) => {
    const bounds = viewportRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    setPosition(
      Math.round(Math.max(0, Math.min(100, ((clientX - bounds.left) / bounds.width) * 100))),
    );
  };

  return (
    <figure className={styles.comparison} data-testid="gymnastics-meet-comparison">
      <div className={styles.comparisonLabels}>
        <button
          type="button"
          aria-label="Show meet packet"
          aria-pressed={position === 100}
          onClick={() => setPosition(100)}
        >
          <span>Before</span>
          <strong>The meet packet</strong>
        </button>
        <button
          type="button"
          aria-label="Show event page"
          aria-pressed={position === 0}
          onClick={() => setPosition(0)}
        >
          <span>After</span>
          <strong>The event page</strong>
        </button>
      </div>
      <div ref={viewportRef} className={styles.viewport} data-comparison-viewport>
        <article
          className={styles.eventPage}
          data-appearance-scope="authored"
          data-testid="gymnastics-comparison-event"
          aria-label="Illustrative event page with the meet packet’s details"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: The meet page needs focus for native keyboard scrolling.
          tabIndex={0}
          inert={position === 100 ? true : undefined}
        >
          <div className={styles.eventContent}>
            <img
              className={styles.eventArtwork}
              src="/templates/hero-images/gymnastics-hero.jpeg"
              alt=""
              loading="lazy"
              width="1920"
              height="1080"
              draggable={false}
            />
            <div className={styles.eventBody}>
              <header>
                <p className={styles.eventEyebrow}>USA Gold Gymnastics · Florida</p>
                <h3>Xcel Bronze, Silver, Gold State Championships</h3>
                <p className={styles.eventHost}>Hosted by Team Twisters &amp; USA Competitions.</p>
              </header>
              <dl className={styles.eventDetails}>
                <div>
                  <CalendarDays aria-hidden="true" />
                  <div>
                    <dt>Meet weekend</dt>
                    <dd>April 10–12, 2027</dd>
                  </div>
                </div>
                <div>
                  <MapPinned aria-hidden="true" />
                  <div>
                    <dt>Venue &amp; directions</dt>
                    <dd>Alachua County Sports &amp; Events Center</dd>
                    <dd className={styles.eventAddress}>
                      4870 Celebration Pointe Ave., Gainesville
                    </dd>
                  </div>
                </div>
              </dl>
              <section className={styles.eventNotes} aria-label="Meet notes from the packet">
                <h4>A little good to know</h4>
                <p>Awards follow each session. Children under 5 attend free.</p>
              </section>
              <p className={styles.eventFooter}>Your meet. All together.</p>
            </div>
          </div>
          <div className={styles.eventMore} data-testid="gymnastics-comparison-event-details">
            <section>
              <h4>Sessions &amp; competition order</h4>
              <dl className={styles.eventFacts}>
                <div>
                  <dt>Xcel Bronze &amp; Silver</dt>
                  <dd>Compete youngest to oldest.</dd>
                </div>
                <div>
                  <dt>Xcel Gold</dt>
                  <dd>Competition order is by draw.</dd>
                </div>
                <div>
                  <dt>Your athlete’s session</dt>
                  <dd>Check the session assignment on your gym roster.</dd>
                </div>
              </dl>
            </section>
            <section>
              <h4>Spectator admission</h4>
              <dl className={`${styles.eventFacts} ${styles.admission}`}>
                {[
                  ["Adults (13+)", "$26"],
                  ["Children (5–12)", "$16"],
                  ["Children under 5", "Free"],
                ].map(([label, price]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{price}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.eventSmallNote}>Cash admission is $1 less.</p>
            </section>
            <section>
              <h4>Awards &amp; recognition</h4>
              <ul className={styles.eventList}>
                <li>Individual and all-around awards immediately follow each session.</li>
                <li>Each session has six award groups, divided equally by birth date.</li>
                <li>
                  Individual awards recognize 50% + 1; all gymnasts receive all-around awards.
                </li>
                <li>
                  Team awards follow the final session for each level. The top five teams in each
                  division receive banners.
                </li>
              </ul>
            </section>
            <section>
              <h4>Roster &amp; coach check-in</h4>
              <ul className={styles.eventList}>
                <li>
                  Verify athlete names, birth dates and session assignments on your gym roster and
                  in Meet Reservations.
                </li>
                <li>Send roster corrections as soon as possible.</li>
                <li>Coaches must sign the USA Gymnastics Coaching Sign In sheet.</li>
                <li>
                  If attendance was not registered in Meet Reservations, bring proof of professional
                  membership.
                </li>
                <li>
                  Only competing athletes and USA Pro members may enter the competition floor.
                </li>
              </ul>
            </section>
            <section>
              <h4>Coach attire</h4>
              <ul className={styles.eventList}>
                <li>Wear closed-toe athletic shoes.</li>
                <li>
                  Athletic or tailored shorts with a 7-inch inseam, or athletic or Docker-style
                  pants. No jeans.
                </li>
                <li>
                  Wear a collared shirt or business-casual shirt with a gym logo. No spaghetti
                  straps, low-cut tops or midriff-revealing shirts.
                </li>
                <li>No hats or visors.</li>
              </ul>
            </section>
            <section>
              <h4>Coach hospitality</h4>
              <p>
                Lunch and dinner are provided for coaches with back-to-back sessions during meal
                times.
              </p>
              <p>
                Bring a reusable water bottle. Outside food and beverages are not permitted in the
                venue.
              </p>
            </section>
          </div>
        </article>
        <div
          className={styles.before}
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          data-comparison-before
          role="region"
          aria-label="Meet packet PDF"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: The PDF needs focus for native keyboard scrolling.
          tabIndex={0}
          inert={position === 0 ? true : undefined}
        >
          <div className={styles.packetSheet}>
            <img
              src="/images/gymanstic-1-landing.png"
              alt="Sample PDF meet packet for the Xcel state championships"
              loading="lazy"
              width="692"
              height="794"
              draggable={false}
              data-appearance-scope="authored"
            />
            <span className={styles.packetDate} data-appearance-scope="authored">
              April 10-12, 2027
            </span>
          </div>
        </div>
        <div
          className={styles.divider}
          style={{ left: `${position}%` }}
          data-comparison-divider
          aria-hidden="true"
        />
        <span
          className={styles.handle}
          style={{ left: `clamp(1.5rem, ${position}%, calc(100% - 1.5rem))` }}
          aria-hidden="true"
        >
          <ChevronsLeftRight />
        </span>
        <input
          ref={sliderRef}
          className={styles.slider}
          style={{ left: `clamp(1.5rem, ${position}%, calc(100% - 1.5rem))` }}
          type="range"
          min="0"
          max="100"
          step="1"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Compare meet packet and event page"
          aria-valuetext={`${position}% meet packet, ${100 - position}% event page`}
        />
        <div
          className={styles.dragRail}
          style={{ left: `clamp(1.5rem, ${position}%, calc(100% - 1.5rem))` }}
          aria-hidden="true"
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            sliderRef.current?.focus({ preventScroll: true });
            event.currentTarget.setPointerCapture(event.pointerId);
            moveDivider(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) moveDivider(event.clientX);
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
        />
      </div>
    </figure>
  );
}
