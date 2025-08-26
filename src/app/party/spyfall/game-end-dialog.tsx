"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, UserX, Trophy } from "lucide-react";

interface GameEndDialogProps {
  open: boolean;
  // Removed gameId from props, as parent will manage it now
  result: {
    winner: 'spy' | 'players';
    votedPlayerName?: string;
    spyName: string;
    location: string;
    spyGuessedLocation?: string; // Add this if result from spy guessing is passed
    spyGuessedCorrectly?: boolean; // Add this if result from spy guessing is passed
  };
  onEndGame: () => void; // Modified callback prop, no longer receives gameId
}

export default function GameEndDialog({ open, result, onEndGame }: GameEndDialogProps) {
    const handleClickPlayAnotherGame = () => {
        console.log("GameEndDialog: 'Play Another Game' clicked. Calling onEndGame callback.");
        onEndGame(); // Call the callback from parent
    };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center text-center">
          {result.winner === 'players' ? (
             <PartyPopper className="h-16 w-16 text-green-500" />
          ) : (
             <Trophy className="h-16 w-16 text-amber-500" />
          )}
          <AlertDialogTitle className="text-3xl font-bold">
            {result.winner === 'players' ? "The Spy Has Been Found!" : "The Spy Escaped!"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg">
             {result.winner === 'players' 
                ? `${result.votedPlayerName} was the Spy!`
                : `The players incorrectly voted for ${result.votedPlayerName || 'nobody'}.`
             }
             {result.spyGuessedLocation !== undefined && (
               <p className="mt-2">Spy's guess: <span className="font-bold">{result.spyGuessedLocation}</span> {result.spyGuessedCorrectly ? '(Correct!)' : '(Incorrect.)'}</p>
             )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-muted rounded-lg text-center space-y-2">
            <p>The correct location was:</p>
            <p className="font-bold text-xl text-blue-600">{result.location}</p>
            <p className="pt-2">The Spy was:</p>
            <p className="font-bold text-xl text-red-600">{result.spyName}</p>
        </div>

        <AlertDialogFooter>
            <Button onClick={handleClickPlayAnotherGame} className="w-full">Play Another Game</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
