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
import { useRouter } from "next/navigation";

interface GameEndDialogProps {
  open: boolean;
  result: {
    winner: 'spy' | 'players';
    votedPlayerName?: string;
    spyName: string;
    location: string;
  };
}

export default function GameEndDialog({ open, result }: GameEndDialogProps) {
    const router = useRouter();

    const handlePlayAgain = () => {
        // For simplicity, we'll just go back to the party page.
        // A more complex setup might reset the lobby.
        router.push('/party');
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
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-muted rounded-lg text-center space-y-2">
            <p>The correct location was:</p>
            <p className="font-bold text-xl text-blue-600">{result.location}</p>
            <p className="pt-2">The Spy was:</p>
            <p className="font-bold text-xl text-red-600">{result.spyName}</p>
        </div>

        <AlertDialogFooter>
            <Button onClick={handlePlayAgain} className="w-full">Play Another Game</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
