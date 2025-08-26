"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, Timestamp, runTransaction, arrayUnion, updateDoc } from "firebase/firestore";

interface Player {
  id: string;
  name: string;
}

interface Location {
    id: string;
    name_en: string;
    name_th: string;
    roles_en: string[];
    roles_th: string[];
}

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function createSpyfallGame(players: Player[]) {
    try {
        if (players.length < 3) return { success: false, message: "Not enough players. Requires at least 3 players." };

        const locationsCol = collection(db, 'spyfall_locations');
        const locationsSnapshot = await getDocs(locationsCol);
        if (locationsSnapshot.empty) return { success: false, message: "No locations found in the database." };
        
        const allLocations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
        const selectedLocation = allLocations[Math.floor(Math.random() * allLocations.length)];
        const shuffledPlayers = shuffleArray([...players]);
        const spyIndex = Math.floor(Math.random() * shuffledPlayers.length);
        const spy = shuffledPlayers[spyIndex];
        
        const availableRoles = shuffleArray([...selectedLocation.roles_th]);
        const playerAssignments = shuffledPlayers.map((player, index) => {
            if (index === spyIndex) {
                return {
                    playerId: player.id,
                    name: player.name,
                    role: "Spy",
                    location: "???",
                };
            } else {
                const role = availableRoles.pop();
                return {
                    playerId: player.id,
                    name: player.name,
                    role: role || "Civilian", 
                    location: selectedLocation.name_th,
                };
            }
        });
        
        const gameId = `spyfall_${crypto.randomUUID()}`;
        const gameRef = doc(db, 'spyfall_games', gameId);

        await setDoc(gameRef, {
            createdAt: Timestamp.now(),
            players: playerAssignments,
            location: selectedLocation.name_th,
            allLocations: allLocations.map(l => l.name_th),
            spyId: spy.id,
            status: 'in-progress',
            timerEndsAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
            vote: {
                requesters: [],
                votes: {},
                status: 'none',
            },
            endGameVote: { // New field for end game vote
                requesters: [],
                votes: [],
                status: 'none',
            }
        });

        return { success: true, gameId };
    } catch (error) {
        console.error("Error creating Spyfall game:", error);
        return { success: false, message: "Failed to create game. Please try again." };
    }
}

export async function requestVote(gameId: string, playerId: string) {
    if (!gameId || !playerId) return { success: false, message: "Invalid game or player ID." };

    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'spyfall_games', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");

            const gameData = gameDoc.data();
            if (gameData.status !== 'in-progress') {
                console.log("RequestVote: Game not in in-progress state. Current status:", gameData.status);
                return;
            } 

            const players = gameData.players;
            const vote = gameData.vote || { requesters: [] };
            if (vote.requesters.includes(playerId)) {
                console.log("RequestVote: Player already requested vote.", playerId);
                return;
            }

            transaction.update(gameRef, { "vote.requesters": arrayUnion(playerId) });
            
            const newRequesters = [...vote.requesters, playerId];
            const requiredVotes = Math.ceil(players.length * 0.7);

            console.log(`RequestVote: Total players: ${players.length}, New requesters: ${newRequesters.length}, Required votes: ${requiredVotes}`);

            if (newRequesters.length >= requiredVotes) {
                console.log("RequestVote: Required votes met, changing status to voting.");
                transaction.update(gameRef, { 
                    status: 'voting',
                    "vote.status": 'active',
                    "vote.timerEndsAt": Timestamp.fromMillis(Date.now() + 20 * 1000)
                });
            } else {
                console.log("RequestVote: Required votes NOT met yet.");
            }
        });
        return { success: true };
    } catch (error) { console.error("Error requesting vote:", error); return { success: false, message: "Failed to request vote." }; }
}

export async function castVote(gameId: string, voterId: string, targetId: string) {
    if (!gameId || !voterId || !targetId) return { success: false, message: "Invalid IDs provided." };

    try {
        const gameRef = doc(db, 'spyfall_games', gameId);
        await updateDoc(gameRef, { [`vote.votes.${voterId}`]: targetId });
        return { success: true };
    } catch (error) { console.error("Error casting vote:", error); return { success: false, message: "Failed to cast vote." }; }
}

export async function tallyVotes(gameId: string) {
    if (!gameId) return { success: false, message: "Invalid game ID." };
    
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'spyfall_games', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");

            const gameData = gameDoc.data();
            if (gameData.status !== 'voting') {
                console.log("TallyVotes: Game not in voting state. Current status:", gameData.status);
                return; // Only tally votes if in voting state
            }

            const votes = gameData.vote.votes || {};
            const voteCounts: { [targetId: string]: number } = {};
            
            for (const voterId in votes) {
                const targetId = votes[voterId];
                voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
            }

            let maxVotes = 0;
            let votedPlayerId = null;
            for (const targetId in voteCounts) {
                if (voteCounts[targetId] > maxVotes) {
                    maxVotes = voteCounts[targetId];
                    votedPlayerId = targetId;
                }
            }
            
            const spyId = gameData.spyId;
            const winner = votedPlayerId === spyId ? 'players' : 'spy';
            const votedPlayer = gameData.players.find((p:any) => p.playerId === votedPlayerId);

            console.log("TallyVotes: Voted player ID:", votedPlayerId, "Spy ID:", spyId, "Winner:", winner);

            if (winner === 'players') {
                // If players correctly identify the spy, transition to spy-guessing phase
                transaction.update(gameRef, {
                    status: 'spy-guessing',
                    "vote.status": 'finished',
                    spyGuessing: {
                        spyId: spyId,
                        votedByPlayers: true,
                        locationOptions: gameData.allLocations, // Give all locations for spy to guess
                    },
                    result: { // Pre-fill some result data, winner is still undecided at this point
                        winner: 'spy', // Temporarily set as spy wins until spy guesses
                        votedPlayerName: votedPlayer?.name || 'Unknown',
                        spyName: gameData.players.find((p:any) => p.playerId === spyId)?.name || 'Unknown',
                        location: gameData.location, // Correct location
                    }
                });
                console.log("TallyVotes: Players identified spy, transitioning to spy-guessing.");
            } else {
                // If players incorrectly vote, the spy wins immediately
                transaction.update(gameRef, {
                    status: 'finished',
                    "vote.status": 'finished',
                    result: {
                        winner: 'spy',
                        votedPlayerName: votedPlayer?.name || 'Nobody',
                        spyName: gameData.players.find((p:any) => p.playerId === spyId)?.name || 'Unknown',
                        location: gameData.location,
                    }
                });
                console.log("TallyVotes: Players voted incorrectly, spy wins immediately.");
            }
        });
        return { success: true };
    } catch (error) { console.error("Error tallying votes:", error); return { success: false, message: "Failed to tally votes." }; }
}

export async function spyGuessLocation(gameId: string, spyId: string, guessedLocation: string) {
    if (!gameId || !spyId || !guessedLocation) return { success: false, message: "Invalid input for spyGuessLocation." };

    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'spyfall_games', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");

            const gameData = gameDoc.data();
            if (gameData.status !== 'spy-guessing' || gameData.spyGuessing?.spyId !== spyId) {
                console.log("SpyGuessLocation: Not in spy guessing phase or not the designated spy. Current status:", gameData.status, "Spy ID:", spyId);
                return { success: false, message: "Not in spy guessing phase or not the designated spy." };
            }
            
            const correctLocation = gameData.location;
            const spyGuessedCorrectly = guessedLocation === correctLocation;

            console.log(`SpyGuessLocation: Guessed location: ${guessedLocation}, Correct location: ${correctLocation}, Guessed correctly: ${spyGuessedCorrectly}`);

            transaction.update(gameRef, {
                status: 'finished',
                "spyGuessing.status": 'finished',
                result: {
                    winner: spyGuessedCorrectly ? 'spy' : 'players',
                    votedPlayerName: gameData.result?.votedPlayerName || 'Unknown',
                    spyName: gameData.players.find((p:any) => p.playerId === spyId)?.name || 'Unknown',
                    location: correctLocation,
                    spyGuessedLocation: guessedLocation, // Store the spy's guess
                    spyGuessedCorrectly: spyGuessedCorrectly,
                }
            });
        });
        return { success: true };
    } catch (error) {
        console.error("Error in spyGuessLocation:", error);
        return { success: false, message: "Failed to record spy's guess." };
    }
}

export async function endSpyfallGame(gameId: string) {
    const LOBBY_ID = "global_lobby";
    const gameRef = doc(db, 'spyfall_games', gameId);
    const lobbyRef = doc(db, "spyfall_lobbies", LOBBY_ID);

    try {
        console.log("EndSpyfallGame: Attempting to end game with ID:", gameId);
        // Set game status to finished
        await updateDoc(gameRef, { status: 'finished' });

        // Reset lobby status and clear players/observers
        await setDoc(lobbyRef, { players: [], observers: [], status: 'waiting' });
        console.log("EndSpyfallGame: Lobby reset to waiting.");

        return { success: true };
    } catch (error) {
        console.error("Error ending Spyfall game:", error);
        return { success: false, message: "Failed to end game. Please try again." };
    }
}

export async function requestEndGameVote(gameId: string, playerId: string) {
    if (!gameId || !playerId) return { success: false, message: "Invalid game or player ID." };

    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'spyfall_games', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");

            const gameData = gameDoc.data();
            if (gameData.status !== 'in-progress') {
                console.log("RequestEndGameVote: Game not in in-progress state. Current status:", gameData.status);
                return;
            } 

            const endGameVote = gameData.endGameVote || { requesters: [], votes: [], status: 'none' };
            if (endGameVote.requesters.includes(playerId)) {
                console.log("RequestEndGameVote: Player already requested end game vote.", playerId);
                return { success: false, message: "You have already requested to end the game." };
            }

            transaction.update(gameRef, { 
                "endGameVote.requesters": arrayUnion(playerId),
                "endGameVote.status": 'active',
            });
            console.log("RequestEndGameVote: Player requested end game vote.", playerId);
        });
        return { success: true };
    } catch (error) {
        console.error("Error requesting end game vote:", error);
        return { success: false, message: "Failed to request end game vote." };
    }
}

export async function castEndGameVote(gameId: string, voterId: string) {
    if (!gameId || !voterId) return { success: false, message: "Invalid game or voter ID." };

    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'spyfall_games', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");

            const gameData = gameDoc.data();
            if (gameData.status !== 'in-progress' || gameData.endGameVote?.status !== 'active') {
                console.log("CastEndGameVote: Game not in correct state for end game vote. Status:", gameData.status, "EndGameVote status:", gameData.endGameVote?.status);
                return; // Can only vote if game is in progress and end game vote is active
            }

            // Filter out the spy from the count of players who can vote for ending the game.
            // This is because the spy's goal is different.
            const playersEligibleForEndVote = gameData.players.filter((p:any) => p.playerId !== gameData.spyId); 
            const endGameVote = gameData.endGameVote || { requesters: [], votes: [] };

            if (endGameVote.votes.includes(voterId)) {
                console.log("CastEndGameVote: Player already voted to end game.", voterId);
                return { success: false, message: "You have already voted to end the game." };
            }

            transaction.update(gameRef, { "endGameVote.votes": arrayUnion(voterId) });
            
            const newVotes = [...endGameVote.votes, voterId];
            const requiredVotes = Math.ceil(playersEligibleForEndVote.length * 0.7); // 70% of eligible players

            console.log(`CastEndGameVote: Eligible players: ${playersEligibleForEndVote.length}, New votes: ${newVotes.length}, Required votes: ${requiredVotes}`);

            if (newVotes.length >= requiredVotes) {
                console.log("CastEndGameVote: 70% of eligible players voted to end game. Setting game status to finished and creating result.");
                // Get current spy's name and location for result display
                const spyPlayer = gameData.players.find((p:any) => p.playerId === gameData.spyId);

                transaction.update(gameRef, {
                    status: 'finished',
                    "endGameVote.status": 'finished',
                    result: {
                        winner: 'players', // Players successfully voted to end the game
                        votedPlayerName: 'Game Ended by Vote', // No specific voted player in this context
                        spyName: spyPlayer?.name || 'Unknown',
                        location: gameData.location, // The correct location is revealed
                    }
                });
            } else {
                console.log("CastEndGameVote: Required end game votes NOT met yet.");
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error casting end game vote:", error);
        return { success: false, message: "Failed to cast end game vote." };
    }
}
