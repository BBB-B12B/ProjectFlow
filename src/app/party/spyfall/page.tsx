"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, Users, Eye, Loader2, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { createSpyfallGame } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

const MAX_PLAYERS = 8;
const MIN_PLAYERS = 3; // Added minimum players constant
const LOBBY_ID = "global_lobby";

interface Player {
  id: string;
  name: string;
}

export default function SpyfallLobby() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [nickname, setNickname] = useState("");
  const [user, setUser] = useState<Player | null>(null);
  const [userRole, setUserRole] = useState<"player" | "observer" | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [observers, setObservers] = useState<Player[]>([]);

  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Effect to load user from localStorage on initial mount
  useEffect(() => {
    const savedUser = localStorage.getItem('spyfallUser');
    if (savedUser) {
        const parsedUser: Player = JSON.parse(savedUser);
        setUser(parsedUser);
        setNickname(parsedUser.name);
        console.log("Lobby: User loaded from localStorage on mount:", parsedUser);
    }
  }, []);

  // Effect to listen for lobby changes and redirect to game
  useEffect(() => {
    const lobbyRef = doc(db, "spyfall_lobbies", LOBBY_ID);
    const unsubscribe = onSnapshot(lobbyRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lobbyPlayers = data.players || [];
        const lobbyObservers = data.observers || [];
        setPlayers(lobbyPlayers);
        setObservers(lobbyObservers);
        
        // The user state might not be immediately available here on the first render
        // after a redirect or refresh, leading to incorrect userRole detection.
        // We should derive userRole directly from the lobby data and user ID from localStorage/state.
        const currentUserFromStorage = localStorage.getItem('spyfallUser');
        let currentUserId: string | null = null;
        if (currentUserFromStorage) {
            currentUserId = JSON.parse(currentUserFromStorage).id;
        }

        if(currentUserId) {
            if(lobbyPlayers.some((p: Player) => p.id === currentUserId)) setUserRole("player");
            else if(lobbyObservers.some((p: Player) => p.id === currentUserId)) setUserRole("observer");
            else setUserRole(null);
        } else {
            setUserRole(null);
        }

        // Safely check data.status before calling startsWith
        if(typeof data.status === 'string' && data.status.startsWith('game_')) {
            const fullGameIdFromLobby = data.status; // Use the full status string for redirection
            console.log("Lobby: Detected game start, redirecting to game ID:", fullGameIdFromLobby, "with current user state:", user);
            router.push(`/party/spyfall/${fullGameIdFromLobby}`); // Push the full game ID
        } else {
            console.log("Lobby: Lobby status is not game_X, current status:", data.status);
        }
      } else {
        setDoc(lobbyRef, { players: [], observers: [], status: 'waiting' });
        console.log("Lobby: Initializing new lobby.");
      }
    });
    return () => {
        console.log("Lobby: Cleaning up onSnapshot.");
        unsubscribe();
    };
  }, [router]); // Removed 'user' from dependencies

  const handleJoin = async (role: "player" | "observer") => {
    if (!nickname.trim()) {
      toast({ title: "Please enter a nickname.", variant: "destructive" });
      return;
    }
    const newUser = { id: user?.id || crypto.randomUUID(), name: nickname };
    setUser(newUser);
    setUserRole(role);
    localStorage.setItem('spyfallUser', JSON.stringify(newUser));
    console.log("Lobby: User saved to localStorage in handleJoin:", newUser);

    const lobbyRef = doc(db, "spyfall_lobbies", LOBBY_ID);
    try {
        if (role === "player") {
            if(players.length >= MAX_PLAYERS) {
                toast({ title: "The player lobby is full.", variant: "default" });
                return;
            }
            await updateDoc(lobbyRef, { players: arrayUnion(newUser), observers: arrayRemove(newUser) });
            console.log("Lobby: User joined as player in Firebase:", newUser.name);
        } else {
            await updateDoc(lobbyRef, { observers: arrayUnion(newUser), players: arrayRemove(newUser) });
            console.log("Lobby: User joined as observer in Firebase:", newUser.name);
        }
    } catch (e) {
        console.error("Lobby: Error joining lobby: ", e);
        toast({ title: "Could not join lobby.", variant: "destructive" });
    }
  };
  
  const handleLeave = async () => {
    if (!user || !userRole) return;
    
    const lobbyRef = doc(db, "spyfall_lobbies", LOBBY_ID);
     try {
        if (userRole === "player") await updateDoc(lobbyRef, { players: arrayRemove(user) });
        else await updateDoc(lobbyRef, { observers: arrayRemove(user) });
        
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('spyfallUser');
        console.log("Lobby: User left lobby and localStorage cleared.");
    } catch (e) {
        console.error("Lobby: Error leaving lobby: ", e);
        toast({ title: "Could not leave lobby.", variant: "destructive" });
    }
  };

  const handleStartGame = async () => {
    if (players.length < MIN_PLAYERS) { // Changed minimum players condition
      toast({ title: `Requires at least ${MIN_PLAYERS} players to start.`, variant: "destructive" });
      return;
    }
    setIsStarting(true);
    let timer = 3;
    setCountdown(timer);

    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(interval);
        initiateGameCreation();
      }
    }, 1000);
    setCountdownInterval(interval);
    console.log("Lobby: Game start countdown initiated.");
  };
  
  const initiateGameCreation = async () => {
    setIsLoading(true);
    console.log("Lobby: Initiating game creation...");
    try {
        const lobbyRef = doc(db, "spyfall_lobbies", LOBBY_ID);
        const currentLobby = await getDoc(lobbyRef);

        if (currentLobby.exists()) {
            const lobbyData = currentLobby.data();
            const currentStatus = lobbyData.status;
            console.log("Lobby: Current lobby data from initiateGameCreation:", lobbyData);

            // Safely check currentStatus before calling startsWith
            if (typeof currentStatus === 'string') {
                if (currentStatus !== 'waiting' && !currentStatus.startsWith('game_')) {
                    console.warn("Lobby: Detected invalid or stale lobby status (", currentStatus, "), resetting to 'waiting'.");
                    await updateDoc(lobbyRef, { status: 'waiting' });
                    toast({ title: "Lobby reset", description: "The lobby status was invalid and has been reset. Please try starting again.", variant: "default" });
                    setIsLoading(false);
                    setIsStarting(false);
                    return;
                } else if (currentStatus.startsWith('game_')) {
                    console.warn("Lobby: Game already started by another client. Current status: ", currentStatus);
                    setIsLoading(false);
                    setIsStarting(false);
                    return;
                }
            } else { // currentStatus is not a string (e.g., undefined)
                console.warn("Lobby: Detected non-string lobby status (", currentStatus, "), resetting to 'waiting'.");
                await updateDoc(lobbyRef, { status: 'waiting' });
                toast({ title: "Lobby reset", description: "The lobby status was invalid and has been reset. Please try starting again.", variant: "default" });
                setIsLoading(false);
                setIsStarting(false);
                return;
            }
            // If currentStatus is 'waiting', proceed to create game
        } else {
            // If lobby document doesn't exist, create it with 'waiting' status
            console.log("Lobby: Lobby document does not exist, creating with status 'waiting'.");
            await setDoc(lobbyRef, { players: [], observers: [], status: 'waiting' });
        }

        console.log("Lobby: Calling createSpyfallGame with players:", players);
        const result = await createSpyfallGame(players);
        console.log("Lobby: createSpyfallGame result:", result);
        if (result.success && result.gameId) {
            toast({ title: "Game created!", description: "Redirecting all players..." });
            console.log("Lobby: Updating lobby status to game_", result.gameId);
            await updateDoc(lobbyRef, { status: `game_${result.gameId}` });
            console.log("Lobby: Lobby status updated successfully.");
        } else if (result.message) {
            // Use toast to display the error message from the server action
            toast({ title: "Error creating game", description: result.message, variant: "destructive" });
        } else {
            toast({ title: "Error", description: "An unknown error occurred during game creation.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Lobby: Failed to create game:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
        setIsLoading(false);
        setIsStarting(false);
    }
  };

  const handleCancelStart = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    setIsStarting(false);
    setCountdown(3);
    console.log("Lobby: Game start cancelled.");
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Spyfall Lobby</CardTitle>
          <CardDescription>Join the game and wait for the host to start.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          {!userRole ? (
             <div className="flex flex-col items-center gap-3 max-w-sm mx-auto p-6 bg-muted/50 rounded-lg">
                <Input placeholder="Enter your nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="text-center" maxLength={20} />
                <div className="flex gap-4">
                    <Button onClick={() => handleJoin("player")} disabled={players.length >= MAX_PLAYERS}>
                        <Users className="mr-2 h-4 w-4" /> Join as Player
                    </Button>
                    <Button onClick={() => handleJoin("observer")} variant="secondary">
                        <Eye className="mr-2 h-4 w-4" /> Observe
                    </Button>
                </div>
            </div>
          ) : (
            <div className="text-center p-4 flex flex-col items-center gap-3">
              <p className="text-xl">
                Welcome, <span className="font-bold text-primary">{nickname}</span>! You have joined as a {userRole}.
              </p>
              <Button onClick={handleLeave} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4"/> Leave Lobby
              </Button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow">
              <h3 className="font-semibold text-lg mb-3">Players ({players.length}/{MAX_PLAYERS})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
                    const player = players[i];
                    return (
                         <div key={i} className="flex items-center justify-center gap-2 p-2 border rounded-lg h-16 bg-background">
                            {player ? (<div className="flex flex-col items-center text-center"><User className="h-6 w-6 text-primary mb-1" /><span className="font-medium text-sm truncate">{player.name}</span></div>) 
                            : (<span className="text-muted-foreground text-xs">Waiting...</span>)}
                        </div>
                    );
                })}
              </div>
            </div>
            <div className="lg:w-1/3 xl:w-1/4">
              <h3 className="font-semibold text-lg mb-3">Observers ({observers.length})</h3>
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg min-h-[6rem]">
                {observers.map((obs) => (<div key={obs.id} className="flex items-center gap-3 p-2 bg-background rounded"><Eye className="h-5 w-5 text-muted-foreground" /><span className="font-medium text-sm">{obs.name}</span></div>))}
                {observers.length === 0 && <p className="text-sm text-muted-foreground text-center pt-4">No observers yet.</p>}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center pt-4">
            <Button onClick={handleStartGame} disabled={players.length < MIN_PLAYERS || userRole !== 'player' || isLoading} size="lg" className="w-full max-w-xs">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Start Game
            </Button>
             {userRole === 'player' && players.length < MIN_PLAYERS && <p className="text-xs text-muted-foreground mt-2">Requires at least {MIN_PLAYERS} players to start.</p>}
            {userRole !== 'player' && <p className="text-xs text-muted-foreground mt-2">Only players can start the game.</p>}
        </CardFooter>
      </Card>
      <AlertDialog open={isStarting}>
         <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Game is Starting!</AlertDialogTitle>
            <AlertDialogDescription className="min-h-[120px] flex items-center justify-center">
              {isLoading ? (<span className="flex flex-col items-center justify-center p-4 text-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="mt-4 text-muted-foreground">Creating game, please wait...</span></span>) 
              : (<span className="text-center">The game will begin in...<span className="text-7xl font-bold p-4">{countdown}</span></span>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!isLoading && <AlertDialogFooter><AlertDialogCancel onClick={handleCancelStart}>Cancel</AlertDialogCancel></AlertDialogFooter>}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
