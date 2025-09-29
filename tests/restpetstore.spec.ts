// tests/ex2.api.v3.spec.ts
import { test, expect, APIResponse } from '@playwright/test';

const base = 'https://petstore.swagger.io/v2';

// tiny data shape we use everywhere
type petShape = { id: number; name: string };

// tiny class they asked for
class PetNameCounter {
  private items: petShape[];
  constructor(items: petShape[]) {
    this.items = items;
  }
  countByName(): { [name: string]: number } {
    const counts: { [name: string]: number } = {};
    for (const row of this.items) {
      const name = row.name && row.name.trim() !== '' ? row.name : '(unnamed)';
      if (!(name in counts)) counts[name] = 0;
      counts[name] = counts[name] + 1;
    }
    return counts;
  }
}


export async function printReply(res: APIResponse, label = 'Reply') {
   console.log(`${label} → status:`, res.status(), res.statusText());
  const ct = res.headers()['content-type'] ?? '';
  if (ct.includes('application/json')) {
    const bodyJson = await res.json().catch(() => null);
    console.log(`${label}:`, JSON.stringify(bodyJson, null, 2));
  } else {
    const bodyText = await res.text();
    console.log(`${label}:`, bodyText);
  }
}

test.describe.serial('Petstore user flow', () => {
  let username: string;
  let newUser: any;

  test.beforeAll(() => {
    username = `maria_${Date.now()}`;
    newUser = {
      id: Date.now(),
      username,
      firstName: 'Maria',
      lastName: 'Mediavilla',
      email: 'mariamediavilla@example.com',
      password: 'pw',
      phone: '3456781234',
      userStatus: 1
    };
  });

  test('Create user', async ({ request }) => {
    const res = await request.post(`${base}/user`, { data: newUser });
    await printReply(res, 'Create user');

    expect(res.ok()).toBeTruthy();
  });

  test('Read user', async ({ request }) => {
    let res: APIResponse | undefined;

  await expect
    .poll(async () => {
      res = await request.get(`${base}/user/${username}`);
      return res.status();
    }, { timeout: 8000 })
    .toBe(200);

  // res is the response from the successful probe
  await printReply(res!, 'Get user');
});
});

test('Get sold pets', async ({ request }) => {
  // Get sold pets
  const petsRes = await request.get(`${base}/pet/findByStatus?status=sold`);


  expect(petsRes.ok()).toBeTruthy();
  const pets = await petsRes.json();

  // Map raw rows to {id,name}
  const nameIdArray: petShape[] = [];
  for (const p of pets) {{
      nameIdArray.push({
        id: p.id,
        name: typeof p.name === 'string' ? p.name : '(unnamed)'
    });
  } 
}

  // Use the class
  const sharedNames = new PetNameCounter(nameIdArray).countByName();

  // Print results
  console.log('Sold pets {id, name}:', JSON.stringify(nameIdArray, null, 2));
  console.log('Counts by name:', JSON.stringify(sharedNames, null, 2));
 });
