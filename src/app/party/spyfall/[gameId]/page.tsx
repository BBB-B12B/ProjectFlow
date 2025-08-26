"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, Clock, HelpCircle, Loader2, Vote, ShieldCheck } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { requestVote, tallyVotes } from '../actions';
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
  status: 'in-progress' | 'voting' | 'finished';
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
  };
}

export default function SpyfallGamePage() {
  const pathname = usePathname();
  const gameId = pathname.split('/').pop() || '';
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoized derived state
  const userAssignment = gameState?.players.find(p => p.playerId === currentUser?.id);
  const isSpy = userAssignment?.role === 'Spy';
  const voteRequesters = gameState?.vote?.requesters || [];
  const requiredVotes = Math.ceil((gameState?.players?.length || 0) * 0.7);

  // Main game state listener
  useEffect(() => {
    const savedUser = localStorage.getItem('spyfallUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    
    if (!gameId) { setIsLoading(false); return; }
    
    const gameRef = doc(db, 'spyfall_games', gameId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data() as GameState);
        if(isLoading) setIsLoading(false);
      } else {
        console.error("Game not found!");
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [gameId, isLoading]);

  // Timer effect
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

  // Effect to automatically trigger vote tallying
  useEffect(() => {
    if (gameState?.status === 'voting' && gameState.vote?.timerEndsAt) {
      const voteEndTime = gameState.vote.timerEndsAt.toMillis();
      const now = Date.now();
      
      if (now > voteEndTime) {
        if (currentUser?.id === gameState.players[0].playerId) {
          tallyVotes(gameId);
        }
      } else {
        const timeout = setTimeout(() => {
          if (currentUser?.id === gameState.players[0].playerId) {
            tallyVotes(gameId);
          }
        }, voteEndTime - now);
        return () => clearTimeout(timeout);
      }
    }
  }, [gameState, currentUser, gameId]);
  
  const handleRequestVote = async () => {
      if (!currentUser) return;
      const result = await requestVote(gameId, currentUser.id);
      if (result.success) {
          toast({ title: "Vote Requested!", icon: <ShieldCheck className="h-5 w-5 text-green-500" /> });
      } else {
          toast({ title: "Error", description: result.message, variant: 'destructive' });
      }
  }

  if (isLoading || !gameState || !userAssignment || !currentUser) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-lg">Revealing your roles...</p>
      </div>
    );
  }
  
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
              <Button className="w-full" size="lg" onClick={handleRequestVote} disabled={voteRequesters.includes(currentUser.id)}>
                {voteRequesters.includes(currentUser.id) ? "Waiting for other players..." : "Start Vote"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {gameState.status === 'voting' && gameState.vote && gameState.vote.status === 'active' &&
        <VoteDialog open={true} gameId={gameId} currentUser={{ playerId: currentUser.id, name: currentUser.name }} players={gameState.players} voteState={gameState.vote} />
      }
      {gameState.status === 'finished' && gameState.result &&
        <GameEndDialog open={true} result={gameState.result} />
      }
    </TooltipProvider>
  );
}
