// Made-up information for the app's checks. Piezas writes this file from the
// data your description lists; edit it freely. Deterministic (fixed names,
// dates and amounts) so a check gives the same result today and next year.
//
// It runs ONLY against the TEST copy of the app (PIEZAS_TEST_API_KEY, made by
// `piezas test --setup`), never the live app, and it is safe to run again:
// each record is created only if it is not there yet. Names and emails are
// invented (example.test addresses never receive mail).
//
// `piezas test` runs it before every check:  npx tsx scripts/seed.ts
import { Piezas } from '@piezas/sdk';

const apiKey = process.env.PIEZAS_TEST_API_KEY;
if (!apiKey) {
  console.error('No test copy of the app yet (PIEZAS_TEST_API_KEY is missing). Run: piezas test --setup');
  process.exit(1);
}
const piezas = new Piezas({ apiKey, apiBaseUrl: process.env.PIEZAS_API_URL });

// upsert creates a record by title only when it does not exist yet. The record
// kinds must be defined by the app (piezas.defineEntities) before this runs.
async function upsert(accessor: string, title: string, data: Record<string, unknown>) {
  const records = (piezas as unknown as Record<string, any>)[accessor];
  if (!records?.list || !records?.create) {
    console.warn(`${accessor}: not defined yet; run the app once (it defines its records), then seed again`);
    return;
  }
  const found = await records.list({ search: title, limit: 10 });
  const items: any[] = Array.isArray(found) ? found : found?.data ?? found?.items ?? found?.records ?? [];
  if (items.some((r) => r?.title === title)) return;
  await records.create({ title, data });
}

// The test sign-in person: created and switched on directly with the test
// copy's key, so sign-up and sign-in checks never wait for an email.
async function testSignInUser() {
  const email = process.env.PIEZAS_TEST_USER_EMAIL;
  const password = process.env.PIEZAS_TEST_USER_PASSWORD;
  if (!email || !password) return;
  let user: any;
  try {
    ({ user } = await piezas.users.signUp({ email, password }));
  } catch {
    const listed: any = await piezas.users.listUsers({ email });
    user = (listed?.users ?? listed?.data ?? [])[0];
  }
  if (user?.id && user.status !== 'active') await piezas.users.updateUser(user.id, { status: 'active' });
}

export async function seed() {
  await testSignInUser();
  // Hospital: id, name, town, coordinates, resources, sample contact
  await upsert("hospitals", "Avery Example", {"id":"Sample id 1","name":"Avery Example","town":"Exampleton","coordinates":"Sample coordinates 1","resources":"Sample resources 1","sampleContact":"Avery Example"});
  await upsert("hospitals", "Jordan Sample", {"id":"Sample id 2","name":"Jordan Sample","town":"Exampleton","coordinates":"Sample coordinates 2","resources":"Sample resources 2","sampleContact":"Jordan Sample"});
  await upsert("hospitals", "Riley Placeholder", {"id":"Sample id 3","name":"Riley Placeholder","town":"Exampleton","coordinates":"Sample coordinates 3","resources":"Sample resources 3","sampleContact":"Riley Placeholder"});

  // Request: id, hospitalId, resource, urgency, radiusKm, note, createdAt, status, acceptedHospitalId
  await upsert("requests", "Sample id 1", {"id":"Sample id 1","hospitalid":"Sample hospitalId 1","resource":"Sample resource 1","urgency":"Sample urgency 1","radiuskm":"Sample radiusKm 1","note":"Made-up note 1 for testing.","createdat":"Sample createdAt 1","status":"active","acceptedhospitalid":"Sample acceptedHospitalId 1"});
  await upsert("requests", "Sample id 2", {"id":"Sample id 2","hospitalid":"Sample hospitalId 2","resource":"Sample resource 2","urgency":"Sample urgency 2","radiuskm":"Sample radiusKm 2","note":"Made-up note 2 for testing.","createdat":"Sample createdAt 2","status":"active","acceptedhospitalid":"Sample acceptedHospitalId 2"});
  await upsert("requests", "Sample id 3", {"id":"Sample id 3","hospitalid":"Sample hospitalId 3","resource":"Sample resource 3","urgency":"Sample urgency 3","radiuskm":"Sample radiusKm 3","note":"Made-up note 3 for testing.","createdat":"Sample createdAt 3","status":"active","acceptedhospitalid":"Sample acceptedHospitalId 3"});

  // Response: requestId, hospitalId, availabilityMinutes
  await upsert("responses", "Sample requestId 1", {"requestid":"Sample requestId 1","hospitalid":"Sample hospitalId 1","availabilityminutes":"Sample availabilityMinutes 1"});
  await upsert("responses", "Sample requestId 2", {"requestid":"Sample requestId 2","hospitalid":"Sample hospitalId 2","availabilityminutes":"Sample availabilityMinutes 2"});
  await upsert("responses", "Sample requestId 3", {"requestid":"Sample requestId 3","hospitalid":"Sample hospitalId 3","availabilityminutes":"Sample availabilityMinutes 3"});
}

seed().then(
  () => console.log('test information ready'),
  (error) => {
    console.error(error?.message ?? error);
    process.exit(1);
  },
);
