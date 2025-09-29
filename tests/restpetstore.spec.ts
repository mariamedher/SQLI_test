import { test, expect, APIResponse } from '@playwright/test';

// Base URL for the Petstore API -- v2 because v3 is not fully implemented and v1 is deprecated
const base = 'https://petstore.swagger.io/v2';

// tiny data shape we use everywhere to represent a pet
type pet = { id: number; name: string };

// tiny class to count pet names in an array of {id,name}
class PetNameCounter {
  // the list of pets we will analyze
  private petList: pet[];

  // initialize with the list
  constructor(petList: pet[]) {
    this.petList = petList;
  }

  // return an object with the counts of each name
  countByName(): { [name: string]: number } {
    // object to hold the counts by name
    const countsByName: { [name: string]: number } = {};

    // count them with a loop
    for (const petFromList of this.petList) {
      // get the name from the list and store in the variable
      const name = petFromList.name 

      //if the name is not yet object, initialize it to 0
      if (!(name in countsByName)) {
         countsByName[name] = 0;
       }
       //if it is already there, increment the count
     countsByName[name] += 1;
    }
    // return the object with counts
    return countsByName;
  }
}

// Utility function to print API responses nicely
export async function printReply(res: APIResponse, label = 'Reply') {
  // Print status
   console.log(`${label} Status:`, res.status(), res.statusText());
   // Print JSON body
    const bodyJson = await res.json().catch(() => null);
    console.log(`${label}:`, JSON.stringify(bodyJson, null, 2));
}

//tests that need to be run in order (serially) to create and read a user
test.describe.serial('Petstore user flow', () => {

  //variables to hold user data across tests
  let username: string;
  let newUser: any;

  // Before all tests, create a unique username and user object
  test.beforeAll(() => {
    username = `maria_${Date.now()}`; // unique username
    newUser = {
      id: Date.now(), // unique id
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
    // Request POST to create a new user
    const res = await request.post(`${base}/user`, { data: newUser });

    //Expect a 200 OK response
    expect(res.ok()).toBeTruthy();
  });

  test('Read user', async ({ request }) => {
    // Polling loop to wait until the user is available and can be read with GET

    // variable to hold the response outside the polling loop. Will either be an APIResponse or undefined.
    let res: APIResponse | undefined;;

  await expect
    .poll(async () => {
      res = await request.get(`${base}/user/${username}`);
      return res.status();
    }, { timeout: 8000 })
    .toBe(200);

  // Now res has the GET response
  // Assert we have a response (in case the polling loop failed)
  if (!res) throw new Error('No response captured');
  await printReply(res, 'Get user');
});
});

test('Get sold pets', async ({ request }) => {
  // Get sold pets
  const petsRes = await request.get(`${base}/pet/findByStatus?status=sold`);

// Assert that we have a good response
  expect(petsRes.ok()).toBeTruthy();

  // Parse the JSON body
  const pets = await petsRes.json();

  //Now we will use our tiny class to count the names of the sold pets we got from the API
  //initialize an empty array of our tiny pet type (defied above)
  const nameIdArray: pet[] = [];
  //fill the array with the id and name of each pet 
  for (const p of pets) {{
      nameIdArray.push({
        id: p.id,
        name: p.name
    });
  } 
}

  //Initialize the class to count the names (we pass the array we just created)
  const sharedNames = new PetNameCounter(nameIdArray).countByName();

  // Print results to console (json formatted for readability)
  console.log('Sold pets:', JSON.stringify(nameIdArray, null, 1));
  console.log('Counts by name:', JSON.stringify(sharedNames, null, 1));
 });
