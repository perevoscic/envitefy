import { query } from './src/lib/db';

async function checkSignups() {
  const eventId = 'a3abf9de-6d3e-4171-a29c-4dafe4c3f8cd';
  
  try {
    // Try normalized table first
    const signupFormRes = await query(
      `SELECT form FROM signup_forms WHERE event_id = $1`,
      [eventId]
    );
    
    if (signupFormRes.rows.length > 0) {
      const form = signupFormRes.rows[0].form;
      const responses = form?.responses || [];
      
      console.log('\n=== Signup Form Stats ===');
      console.log(`Total signups: ${responses.length}`);
      console.log(`Confirmed: ${responses.filter((r: any) => r.status === 'confirmed').length}`);
      console.log(`Waitlisted: ${responses.filter((r: any) => r.status === 'waitlisted').length}`);
      console.log(`Cancelled: ${responses.filter((r: any) => r.status === 'cancelled').length}`);
      
      if (responses.length > 0) {
        console.log('\n=== Signup Details ===');
        responses.forEach((r: any, i: number) => {
          console.log(`${i + 1}. ${r.name} (${r.status})`);
          if (r.email) console.log(`   Email: ${r.email}`);
          if (r.phone) console.log(`   Phone: ${r.phone}`);
          console.log(`   Created: ${r.createdAt}`);
        });
      }
    } else {
      // Fallback to event_history
      const eventRes = await query(
        `SELECT data FROM event_history WHERE id = $1`,
        [eventId]
      );
      
      if (eventRes.rows.length > 0) {
        const data = eventRes.rows[0].data;
        const form = data?.signupForm;
        const responses = form?.responses || [];
        
        console.log('\n=== Signup Form Stats (from event_history) ===');
        console.log(`Total signups: ${responses.length}`);
        console.log(`Confirmed: ${responses.filter((r: any) => r.status === 'confirmed').length}`);
        console.log(`Waitlisted: ${responses.filter((r: any) => r.status === 'waitlisted').length}`);
        console.log(`Cancelled: ${responses.filter((r: any) => r.status === 'cancelled').length}`);
      } else {
        console.log('Event not found or no signup form exists for this event.');
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
  
  process.exit(0);
}

checkSignups();

