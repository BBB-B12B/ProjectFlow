"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, Clock, HelpCircle, Loader2, Vote, ShieldCheck, DoorOpen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { requestVote, tallyVotes, requestEndGameVote, castEndGameVote, endSpyfallGame, spyGuessLocation } from '../actions';
import VoteDialog from '../vote-dialog';
import GameEndDialog from '../game-end-dialog';

// Define interfaces
interface Player {
  id: string;
  name: string;
}
interface PlayerAssignment {
  playerId: string;
  name: string;
  role: string;
  location: string;
}
interface GameState {
  players: PlayerAssignment[];
  location: string;
  spyId: string;
  status: 'in-progress' | 'voting' | 'finished' | 'spy-guessing'; // Added 'spy-guessing'
  timerEndsAt: Timestamp;
  allLocations: string[]; 
  vote?: {
    requesters: string[];
    votes: { [voterId: string]: string };
    status: 'none' | 'requested' | 'active' | 'finished';
    timerEndsAt?: Timestamp;
  };
  result?: {
    winner: 'spy' | 'players';
    votedPlayerName?: string;
    spyName: string;
    location: string;
    spyGuessedLocation?: string; // New field for spy's guess
    spyGuessedCorrectly?: boolean; // New field for spy's guess result
  };
  endGameVote?: { // New field for end game vote
    requesters: string[];
    votes: string[];
    status: 'none' | 'active' | 'finished';
  };
  spyGuessing?: { // New field for spy guessing phase
    spyId: string;
    votedByPlayers: boolean; // True if spy was correctly identified by players
    locationOptions: string[]; // Options for spy to guess
  };
}

export default function SpyfallGamePage() {
  const pathname = usePathname();
  const router = useRouter();

  console.log("DEBUG: Raw pathname:", pathname);

  let gameIdFromUrl = pathname.split('/').pop() || '';
  console.log("DEBUG: gameIdFromUrl after pop():", gameIdFromUrl);

  if (gameIdFromUrl.startsWith('game_')) {
    gameIdFromUrl = gameIdFromUrl.substring(5);
    console.log("DEBUG: gameIdFromUrl after removing 'game_':", gameIdFromUrl);
  }
  const gameId = gameIdFromUrl; // This is the cleaned game ID to use for Firestore
  console.log("DEBUG: Final gameId for Firestore:", gameId);

  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false); // State to control redirection
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null); // Ref to store unsubscribe function
  const [selectedGuessLocation, setSelectedGuessLocation] = useState<string>('');

  // Memoized derived state
  const userAssignment = gameState?.players.find(p => p.playerId === currentUser?.id);
  const isSpy = userAssignment?.role === 'Spy';
  const voteRequesters = gameState?.vote?.requesters || [];
  const requiredVotes = Math.ceil((gameState?.players?.length || 0) * 0.7);

  // End Game Vote related derived state
  const endGameVoteRequesters = gameState?.endGameVote?.requesters || [];
  const endGameVotes = gameState?.endGameVote?.votes || [];
  const playersInGameForEndVote = gameState?.players.filter(p => p.playerId !== gameState?.spyId) || [];
  const requiredEndGameVotes = Math.ceil((playersInGameForEndVote.length) * 0.7); // 70% of non-spy players
  const hasRequestedEndGame = currentUser ? endGameVoteRequesters.includes(currentUser.id) : false;
  const hasVotedToEndGame = currentUser ? endGameVotes.includes(currentUser.id) : false;
  const isEndGameVoteActive = gameState?.endGameVote?.status === 'active';

  // Spy Guessing related derived state
  const isCurrentUserSpyAndGuessing = (gameState?.status === 'spy-guessing' && currentUser?.id === gameState.spyGuessing?.spyId);

  console.log("Component Rendered. gameId:", gameId, "currentUser:", currentUser?.name, "isLoading:", isLoading, "hasRedirected:", hasRedirected);

  if (hasRedirected) {
    console.log("hasRedirected is true, returning null from render.");
    return null;
  }

  // Effect to load currentUser from localStorage once
  useEffect(() => {
    console.log("useEffect [load currentUser] triggered.");
    if (hasRedirected) return;

    const savedUser = localStorage.getItem('spyfallUser');
    console.log("LoadUserEffect: savedUser from localStorage:", savedUser); // New debug log
    if (savedUser) {
        const parsedUser: Player = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        console.log("LoadUserEffect: parsedUser:", parsedUser); // New debug log
        console.log("currentUser loaded from localStorage:", parsedUser.name);
    } else {
        console.error("No spyfallUser found in localStorage. Redirecting.");
        toast({ title: "Error", description: "You are not logged in. Redirecting to lobby.", variant: "destructive" });
        setHasRedirected(true);
        router.replace('/party/spyfall');
    }
  }, [toast, router, hasRedirected]); // Depend on hasRedirected to re-evaluate if needed

  // Main game state listener
  useEffect(() => {
    console.log("useEffect [gameState listener] triggered. gameId:", gameId, "currentUser:", currentUser?.name, "isLoading:", isLoading, "hasRedirected:", hasRedirected);

    if (hasRedirected) return; // Important: Stop if redirect already set

    if (!gameId) {
        console.error("gameId is missing. Setting isLoading(false) and redirecting.");
        setIsLoading(false);
        toast({ title: "Error", description: "Invalid game ID. Redirecting to lobby.", variant: "destructive" });
        setHasRedirected(true);
        router.replace('/party/spyfall');
        return;
    }
    if (!currentUser) {
        console.log("currentUser is null, waiting for it to load.");
        return; // Wait for currentUser to be loaded by the other effect
    }

    const gameRef = doc(db, 'spyfall_games', gameId);
    console.log("Starting onSnapshot for gameRef:", gameId);

    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      console.log("onSnapshot callback triggered for gameId:", gameId, "docSnap.exists:", docSnap.exists(), "isLoading:", isLoading, "hasRedirected:", hasRedirected);
      if (hasRedirected) {
        console.log("onSnapshot: hasRedirected is true, ignoring update.");
        return;
      }

      // Clear any pending redirect timeout if data is found
      if (docSnap.exists()) {
        if (redirectTimeoutRef.current) {
          console.log("onSnapshot: Game data found, clearing pending redirect timeout.");
          clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = null;
        }

        const data = docSnap.data() as GameState;
        setGameState(data);
        console.log("GameStateListener: docSnap.data():", data); // New debug log

        const assignment = data.players.find(p => p.playerId === currentUser.id);
        console.log("GameStateListener: currentUser.id:", currentUser?.id, "Players in game:", data.players); // New debug log
        console.log("GameStateListener: userAssignment result:", assignment); // New debug log

        if (!assignment) {
            console.error("onSnapshot: User not found in game players. Redirecting.");
            toast({ title: "Error", description: "You are not a player in this game. Redirecting to lobby.", variant: "destructive" });
            setHasRedirected(true);
            router.replace('/party/spyfall');
            return;
        }
        console.log("onSnapshot: User assignment found:", assignment);
        console.log("onSnapshot: Setting isLoading to false (game data and assignment ready).");
        setIsLoading(false);
      } else {
        console.warn("onSnapshot: Game not found in Firestore. Waiting for 2 seconds before redirecting.");
        
        if (!redirectTimeoutRef.current) { 
          redirectTimeoutRef.current = setTimeout(() => {
            if (!hasRedirected) { 
              console.error("onSnapshot: Game data still not found after delay. Redirecting.");
              toast({ title: "Error", description: "Game not found. Redirecting to lobby.", variant: "destructive" });
              setHasRedirected(true);
              router.replace('/party/spyfall');
            }
          }, 2000);
        }
      }
    }, (error) => {
        console.error("onSnapshot: Error fetching game state from Firestore:", error);
        toast({ title: "Error", description: "Failed to load game. Redirecting to lobby.", variant: "destructive" });
        setIsLoading(false);
        setHasRedirected(true);
        router.replace('/party/spyfall');
    });
    
    unsubscribeRef.current = unsubscribe; // Store the unsubscribe function

    return () => {
        console.log("Cleaning up onSnapshot for gameRef:", gameId);
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = null;
        }
        if (unsubscribeRef.current) {
          unsubscribeRef.current(); // Unsubscribe when component unmounts or dependencies change
          unsubscribeRef.current = null; // Clear the ref
        }
    };
  }, [gameId, currentUser, toast, router, hasRedirected, isLoading]); // Depend on hasRedirected, isLoading

  const [timeLeft, setTimeLeft] = useState(300);
  useEffect(() => {
    if (gameState?.timerEndsAt) {
      const interval = setInterval(() => {
        const endTime = gameState.timerEndsAt.toMillis();
        setTimeLeft(Math.round(Math.max(0, (endTime - Date.now()) / 1000)));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState?.timerEndsAt]);

  useEffect(() => {
    if (gameState?.status === 'voting' && gameState.vote?.timerEndsAt) {
      const voteEndTime = gameState.vote.timerEndsAt.toMillis();
      const now = Date.now();
      
      if (now > voteEndTime) {
        if (currentUser?.id === gameState.players[0].playerId) {
          console.log("Vote timer ended, tallying votes.");
          tallyVotes(gameId);
        }
      } else {
        const timeout = setTimeout(() => {
          if (currentUser?.id === gameState.players[0].playerId) {
            console.log("Vote timer ended via timeout, tallying votes.");
            tallyVotes(gameId);
          }
        }, voteEndTime - now);
        return () => clearTimeout(timeout);
      }
    }
  }, [gameState, currentUser, gameId]);
  
  const handleRequestVote = async () => {
      if (!currentUser) {
        console.warn("handleRequestVote called with no currentUser.");
        return;
      }
      const result = await requestVote(gameId, currentUser.id);
      if (result.success) {
          toast({ title: "Vote Requested!", icon: <ShieldCheck className="h-5 w-5 text-green-500" /> });
          console.log("Vote requested successfully.");
      } else {
          toast({ title: "Error", description: result.message, variant: 'destructive' });
          console.error("Failed to request vote:", result.message);
      }
  }

  const handleRequestEndGameVote = async () => {
    if (!currentUser) {
      console.warn("handleRequestEndGameVote called with no currentUser.");
      return;
    }
    const result = await requestEndGameVote(gameId, currentUser.id);
    if (result.success) {
      toast({ title: "End Game Vote Proposed!", description: "Waiting for other players to vote.", icon: <DoorOpen className="h-5 w-5 text-blue-500" /> });
      console.log("End game vote requested successfully.");
    } else {
      toast({ title: "Error", description: result.message, variant: 'destructive' });
      console.error("Failed to request end game vote:", result.message);
    }
  };

  const handleCastEndGameVote = async () => {
    if (!currentUser) {
      console.warn("handleCastEndGameVote called with no currentUser.");
      return;
    }
    const result = await castEndGameVote(gameId, currentUser.id);
    if (result.success) {
      toast({ title: "Voted to End Game!", description: "Waiting for other players...", icon: <Vote className="h-5 w-5 text-green-500" /> });
      console.log("Cast end game vote successfully.");
    } else {
      toast({ title: "Error", description: result.message, variant: 'destructive' });
      console.error("Failed to cast end game vote:", result.message);
    }
  };

  const handleSpyGuess = async () => {
    if (!currentUser || !gameState?.spyGuessing || !selectedGuessLocation) {
      console.warn("handleSpyGuess called with insufficient data.");
      toast({ title: "Error", description: "Please select a location to guess.", variant: 'destructive' });
      return;
    }
    const result = await spyGuessLocation(gameId, currentUser.id, selectedGuessLocation);
    if (result.success) {
      toast({ title: "Guess Submitted!", description: "Waiting for results..." });
      console.log("Spy guess submitted successfully.");
    } else {
      toast({ title: "Error", description: result.message, variant: 'destructive' });
      console.error("Failed to submit spy guess:", result.message);
    }
  };

  const handleGameEnded = async () => { // No longer receives gameId as prop
    console.log("SpyfallGamePage: handleGameEnded triggered.");
    if (unsubscribeRef.current) {
      console.log("SpyfallGamePage: Unsubscribing from gameState listener.");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    const actionResult = await endSpyfallGame(gameId); // Use gameId from component scope
    if (actionResult.success) {
      console.log("SpyfallGamePage: Game ended successfully by action, clearing local storage and redirecting.");
      localStorage.removeItem('spyfallUser');
      setHasRedirected(true);
      router.replace('/party/spyfall');
    } else {
      console.error("SpyfallGamePage: Failed to end game via action:", actionResult.message);
      // Even if the action failed, we should still try to redirect to prevent being stuck
      localStorage.removeItem('spyfallUser');
      setHasRedirected(true);
      router.replace('/party/spyfall');
    }
  };

  // Display loading screen until all necessary data is available
  if (isLoading || !gameState || !currentUser || !userAssignment) {
    console.log("Displaying loading screen. isLoading:", isLoading, "gameState:", !!gameState, "currentUser:", !!currentUser, "userAssignment:", !!userAssignment, "hasRedirected:", hasRedirected);
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-lg">Revealing your roles...</p>
      </div>
    );
  }
  
  console.log("All data loaded. Displaying game page.");
  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 flex flex-col md:flex-row gap-6">
        {/* Left Column */}
        <div className="md:w-1/3 space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock /> Time Left</CardTitle></CardHeader>
            <CardContent><div className="text-5xl font-bold text-center tracking-tighter">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Players</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                  {gameState.players.map(p => (
                      <li key={p.playerId} className="flex items-center gap-3">
                          <User className="text-muted-foreground" /> 
                          <span className="font-medium">{p.name}</span>
                          {voteRequesters.includes(p.playerId) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Vote className="text-blue-500 ml-auto" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{p.name} wants to vote</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                      </li>
                  ))}
              </ul>
              {voteRequesters.length > 0 && <div className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">({voteRequesters.length}/{requiredVotes}) players have requested to vote.</div>}
            </CardContent>
          </Card>
        </div>
        {/* Right Column */}
        <div className="md:w-2/3">
          <Card className="h-full shadow-lg">
            <CardHeader><CardTitle className="text-2xl">Your Secret Identity</CardTitle><CardDescription>Keep it secret!</CardDescription></CardHeader>
            <CardContent className="text-center space-y-6 p-8">
              <div className="p-6 bg-muted rounded-xl shadow-inner"><p className="text-lg font-semibold text-muted-foreground">Location:</p><p className={`text-4xl font-bold tracking-tight ${isSpy ? 'text-red-600' : 'text-blue-600'}`}>{userAssignment.location}</p></div>
              <div className="p-6 bg-muted rounded-xl shadow-inner"><p className="text-lg font-semibold text-muted-foreground">Role:</p><p className={`text-4xl font-bold tracking-tight ${isSpy ? 'text-red-600' : 'text-blue-600'}`}>{userAssignment.role}</p></div>

              {/* Spy Guessing UI */}
              {gameState.status === 'spy-guessing' && ( // Only show if game is in spy-guessing phase
                isCurrentUserSpyAndGuessing ? (
                  <div className="flex flex-col items-center gap-4 p-4 bg-yellow-100/20 border border-yellow-200 rounded-xl">
                    <p className="text-lg font-semibold text-yellow-800">You were caught! Now guess the location:</p>
                    <Select value={selectedGuessLocation} onValueChange={setSelectedGuessLocation}>
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {gameState.spyGuessing?.locationOptions.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="w-[240px]" onClick={handleSpyGuess} disabled={!selectedGuessLocation || isLoading}>
                      Guess Location
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 bg-blue-100/20 border border-blue-200 rounded-xl">
                    <p className="text-lg font-semibold text-blue-800">The Spy has been caught! Waiting for their guess...</p>
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                )
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-6">
              <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="w-full"><HelpCircle className="mr-2 h-4 w-4"/> {isSpy ? "All Possible Locations" : "Game Rules"}</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{isSpy ? "Possible Locations" : "How to Play"}</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogDescription>
                        {isSpy ? (<ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm max-h-60 overflow-y-auto">{gameState.allLocations.map(loc => <li key={loc}>{loc}</li>)}</ul>) 
                        : (<div><p><strong>Goal:</strong> Find the Spy! Ask subtle questions to find who doesn't know the location. The Spy wins if they guess the location or if the players vote out an innocent person.</p></div>)}
                    </AlertDialogDescription>
                    <AlertDialogFooter><AlertDialogAction>Got it!</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {gameState.status === 'in-progress' && ( // Only show regular vote button if game is in progress
                <Button className="w-full" size="lg" onClick={handleRequestVote} disabled={voteRequesters.includes(currentUser.id)}>
                  {voteRequesters.includes(currentUser.id) ? "Waiting for other players..." : "Start Vote"}
                </Button>
              )}

              {/* New End Game Buttons */}
              {gameState.status === 'in-progress' && currentUser && ( // Only show if game is in progress and user is present
                !isEndGameVoteActive ? ( // If no end game vote is active
                  <Button className="w-full" size="lg" variant="outline" onClick={handleRequestEndGameVote} disabled={hasRequestedEndGame}> 
                    <DoorOpen className="mr-2 h-4 w-4" /> {hasRequestedEndGame ? "End Game Vote Proposed" : "Propose End Game"}
                  </Button>
                ) : ( // If an end game vote is active
                  <div className="flex flex-col items-center w-full gap-2">
                    <p className="text-sm text-muted-foreground mt-2">({endGameVotes.length}/{requiredEndGameVotes}) players want to end the game.</p>
                    <Button className="w-full" size="lg" variant="destructive" onClick={handleCastEndGameVote} disabled={hasVotedToEndGame}>
                      {hasVotedToEndGame ? "Voted to End Game" : "Vote to End Game"}
                    </Button>
                  </div>
                )
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {gameState.status === 'voting' && gameState.vote && gameState.vote.status === 'active' &&
        <VoteDialog open={true} gameId={gameId} currentUser={{ playerId: currentUser.id, name: currentUser.name }} players={gameState.players} voteState={gameState.vote} />
      }
      {gameState.status === 'finished' && gameState.result &&
        <GameEndDialog open={true} result={gameState.result} onEndGame={handleGameEnded} />
      }
    </TooltipProvider>
  );
}
