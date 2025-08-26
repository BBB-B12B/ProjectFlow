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
    if (players.length < 3) throw new Error("Not enough players.");

    const locationsCol = collection(db, 'spyfall_locations');
    const locationsSnapshot = await getDocs(locationsCol);
    if (locationsSnapshot.empty) throw new Error("No locations found in the database.");
    
    const allLocations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    const selectedLocation = allLocations[Math.floor(Math.random() * allLocations.length)];
    const shuffledPlayers = shuffleArray([...players]);
    const spyIndex = Math.floor(Math.random() * shuffledPlayers.length);
    const spy = shuffledPlayers[spyIndex];
    const roles = shuffleArray([...selectedLocation.roles_th]);
    
    const playerAssignments = shuffledPlayers.map((player, index) => ({
        playerId: player.id,
        name: player.name,
        role: index === spyIndex ? "Spy" : (roles.pop() || "Civilian"),
        location: index === spyIndex ? "???" : selectedLocation.name_th,
    }));
    
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
        }
    });

    return { success: true, gameId };
}

export async function requestVote(gameId: string, playerId: string) {
    if (!gameId || !playerId) return { success: false, message: "Invalid game or player ID." };

    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'spyfall_games', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");

            const gameData = gameDoc.data();
            if (gameData.status !== 'in-progress') return; // Can't vote if game is not in progress

            const players = gameData.players;
            const vote = gameData.vote || { requesters: [] };
            if (vote.requesters.includes(playerId)) return;

            transaction.update(gameRef, { "vote.requesters": arrayUnion(playerId) });
            
            const newRequesters = [...vote.requesters, playerId];
            const requiredVotes = Math.ceil(players.length * 0.7);

            if (newRequesters.length >= requiredVotes) {
                transaction.update(gameRef, { 
                    status: 'voting',
                    "vote.status": 'active',
                    "vote.timerEndsAt": Timestamp.fromMillis(Date.now() + 20 * 1000)
                });
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
            if (gameData.status !== 'voting') return; // Only tally votes if in voting state

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
            const spyPlayer = gameData.players.find((p:any) => p.playerId === spyId);

            transaction.update(gameRef, {
                status: 'finished',
                "vote.status": 'finished',
                "result": {
                    winner,
                    votedPlayerName: votedPlayer?.name || 'Nobody',
                    spyName: spyPlayer?.name || 'Unknown',
                    location: gameData.location,
                }
            });
        });
        return { success: true };
    } catch (error) { console.error("Error tallying votes:", error); return { success: false, message: "Failed to tally votes." }; }
}
