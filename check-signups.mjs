import { query } from "./src/lib/db";

async function checkSignups() {
  const eventId = "a3abf9de-6d3e-4171-a29c-4dafe4c3f8cd";

  try {
    // Try normalized table first
    const signupFormRes = await query(`SELECT form FROM signup_forms WHERE event_id = $1`, [
      eventId,
    ]);

    if (signupFormRes.rows.length > 0) {
      const form = signupFormRes.rows[0].form;
      const responses = form?.responses || [];

      console.log("\n=== Signup Form Stats ===");
      console.log(`Total signups: ${responses.length}`);
      console.log(
        `Confirmed: ${responses.filter((response) => response.status === "confirmed").length}`
      );
      console.log(
        `Waitlisted: ${responses.filter((response) => response.status === "waitlisted").length}`
      );
      console.log(
        `Cancelled: ${responses.filter((response) => response.status === "cancelled").length}`
      );

      if (responses.length > 0) {
        console.log("\n=== Signup Details ===");
        responses.forEach((response, index) => {
          console.log(`${index + 1}. ${response.name} (${response.status})`);
          if (response.email) console.log(`   Email: ${response.email}`);
          if (response.phone) console.log(`   Phone: ${response.phone}`);
          console.log(`   Created: ${response.createdAt}`);
        });
      }
    } else {
      // Fallback to event_history
      const eventRes = await query(`SELECT data FROM event_history WHERE id = $1`, [eventId]);

      if (eventRes.rows.length > 0) {
        const data = eventRes.rows[0].data;
        const form = data?.signupForm;
        const responses = form?.responses || [];

        console.log("\n=== Signup Form Stats (from event_history) ===");
        console.log(`Total signups: ${responses.length}`);
        console.log(
          `Confirmed: ${responses.filter((response) => response.status === "confirmed").length}`
        );
        console.log(
          `Waitlisted: ${responses.filter((response) => response.status === "waitlisted").length}`
        );
        console.log(
          `Cancelled: ${responses.filter((response) => response.status === "cancelled").length}`
        );
      } else {
        console.log("Event not found or no signup form exists for this event.");
      }
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }

  process.exit(0);
}

checkSignups();
