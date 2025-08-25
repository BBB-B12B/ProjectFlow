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

// Function to get a random animal name
function getRandomAnimal(): string {
  return animals[Math.floor(Math.random() * animals.length)];
}

// --- (1) UPDATED THE RETURN TYPE ---
export function getAnonymousUser(): { id: string; name: string; avatarUrl: string } {
  const sessionKey = 'anonymousUser';
  
  if (typeof window === 'undefined') {
    return { id: 'server-user', name: 'Anonymous User', avatarUrl: '' };
  }

  const storedUser = sessionStorage.getItem(sessionKey);
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  
  const animalName = `Anonymous ${getRandomAnimal()}`;
  // --- (2) GENERATE A CONSISTENT AVATAR URL USING THE NAME AS A SEED ---
  const avatarUrl = `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(animalName)}`;

  const newUser = {
    id: `user_${Date.now()}_${Math.random()}`,
    name: animalName,
    avatarUrl: avatarUrl
  };

  sessionStorage.setItem(sessionKey, JSON.stringify(newUser));

  return newUser;
}
