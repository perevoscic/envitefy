import { schoolMemoEventBullets } from "@/lib/school-memo-content";
import styles from "./information-section-body.module.css";

export default function InformationSectionBody({ title, body }: { title: string; body: string }) {
  if (!/^(?:Important|Upcoming) Events(?: \(continued\))?$/i.test(title.trim())) return <p>{body}</p>;
  return (
    <ul className={styles.events} data-memo-event-bullets>
      {schoolMemoEventBullets(body).map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
}
