const animals = [
  'Aardvark', 'Alpaca', 'Anteater', 'Antelope', 'Armadillo', 'Axolotl',
  'Baboon', 'Badger', 'Barracuda', 'Bat', 'Beaver', 'Bison', 'Bobcat', 'Buffalo',
  'Capybara', 'Caribou', 'Cassowary', 'Cat', 'Caterpillar', 'Chameleon', 'Cheetah', 'Chinchilla',
  'Cobra', 'Cormorant', 'Coyote', 'Crab', 'Crane', 'Crocodile',
  'Dingo', 'Dolphin', 'Donkey', 'Dormouse', 'Dragonfly', 'Duck', 'Dugong',
  'Eagle', 'Echidna', 'Eel', 'Elephant', 'Emu',
  'Falcon', 'Ferret', 'Finch', 'Flamingo', 'Fox', 'Frog',
  'Gazelle', 'Gecko', 'Gerbil', 'Gibbon', 'Giraffe', 'Gnat', 'Gnu', 'Goat', 'Goose', 'Gorilla', 'Gull',
  'Hamster', 'Hare', 'Hawk', 'Hedgehog', 'Heron', 'Hippo', 'Hornet', 'Horse', 'Hummingbird', 'Hyena',
  'Ibex', 'Ibis', 'Iguana', 'Impala',
  'Jackal', 'Jaguar', 'Jellyfish',
  'Kangaroo', 'Kingfisher', 'Koala', 'Kookaburra', 'Komodo Dragon',
  'Lemur', 'Leopard', 'Lion', 'Llama', 'Lobster', 'Loris', 'Louse',
  'Magpie', 'Mallard', 'Manatee', 'Mandrill', 'Meerkat', 'Mink', 'Mole', 'Mongoose', 'Monkey', 'Moose', 'Mouse',
  'Narwhal', 'Newt',
  'Octopus', 'Okapi', 'Opossum', 'Orangutan', 'Oryx', 'Ostrich', 'Otter', 'Owl', 'Oyster',
  'Panther', 'Parrot', 'Partridge', 'Peacock', 'Pelican', 'Penguin', 'Pheasant', 'Pig', 'Pigeon', 'Platypus', 'Porcupine', 'Porpoise',
  'Quail', 'Quokka', 'Quoll',
  'Rabbit', 'Raccoon', 'Ram', 'Rat', 'Raven', 'Reindeer', 'Rhinoceros',
  'Salamander', 'Salmon', 'Sandpiper', 'Sardine', 'Scorpion', 'Seahorse', 'Seal', 'Shark', 'Sheep', 'Skunk', 'Sloth', 'Snail', 'Snake', 'Spider', 'Squirrel', 'Starling', 'Stingray', 'Swan',
  'Tapir', 'Tarsier', 'Termite', 'Tiger', 'Toad', 'Trout', 'Turkey', 'Turtle',
  'Viper', 'Vulture',
  'Wallaby', 'Walrus', 'Wasp', 'Weasel', 'Whale', 'Wildcat', 'Wolf', 'Wolverine', 'Wombat', 'Woodpecker',
  'Yak',
  'Zebra'
];

interface AnonymousUser {
  id: string;
  name: string;
  avatarUrl: string;
}

export function getAnonymousUser(): AnonymousUser {
  // Try to get user data from localStorage
  if (typeof window !== 'undefined') { // Ensure localStorage is available (client-side only)
    let userId = localStorage.getItem('anonymousUserId');
    let userName = localStorage.getItem('anonymousUserName');
    let userAvatar = localStorage.getItem('anonymousUserAvatar');

    if (userId && userName && userAvatar) {
      console.log("getAnonymousUser: Loading existing user from localStorage. ID:", userId);
      return { id: userId, name: userName, avatarUrl: userAvatar };
    }

    // If not found, generate new user data
    userId = crypto.randomUUID(); // Generate a unique ID
    userName = animals[Math.floor(Math.random() * animals.length)]; // Pick a random animal name
    userAvatar = `/api/avatars/${userName.toLowerCase().replace(/\s/g, '')}.png`; // Simple avatar URL (placeholder)

    // Store new user data in localStorage
    localStorage.setItem('anonymousUserId', userId);
    localStorage.setItem('anonymousUserName', userName);
    localStorage.setItem('anonymousUserAvatar', userAvatar);

    console.log("getAnonymousUser: Generated new user and stored in localStorage. ID:", userId);
    return { id: userId, name: userName, avatarUrl: userAvatar };
  }

  // Fallback for server-side rendering or environments without window
  console.log("getAnonymousUser: Running on server, returning server-user ID.");
  return {
    id: 'server-user',
    name: 'ServerBot',
    avatarUrl: '/api/avatars/serverbot.png',
  };
}
