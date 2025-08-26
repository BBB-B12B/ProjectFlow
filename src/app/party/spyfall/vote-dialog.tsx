"use client";

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { User, Check, Loader2 } from 'lucide-react';
import { castVote } from './actions';

interface Player {
  playerId: string;
  name: string;
}

interface VoteState {
  status: string;
  timerEndsAt?: any; // Marked as optional
  votes: { [voterId: string]: string };
}

interface VoteDialogProps {
  open: boolean;
  gameId: string;
  currentUser: Player;
  players: Player[];
  voteState: VoteState;
}

export default function VoteDialog({ open, gameId, currentUser, players, voteState }: VoteDialogProps) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (voteState?.timerEndsAt) {
      const updateTimer = () => {
        const now = Date.now();
        const endTime = voteState.timerEndsAt.toMillis();
        const secondsLeft = Math.round(Math.max(0, (endTime - now) / 1000));
        setTimeLeft(secondsLeft);
      };
      
      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [voteState]);
  
  const handleVote = async () => {
      if (!selectedTarget) {
          alert("Please select a player to vote for.");
          return;
      }
      setIsSubmitting(true);
      const result = await castVote(gameId, currentUser.playerId, selectedTarget);
      if(result.success) {
          setHasVoted(true);
      } else {
          alert(result.message);
      }
      setIsSubmitting(false);
  }
  
  // Players list should not include the current user
  const otherPlayers = players.filter(p => p.playerId !== currentUser.playerId);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl">Vote for the Spy!</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You have <span className="font-bold text-lg">{timeLeft}</span> seconds to cast your vote.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3">
          {otherPlayers.map(player => (
            <Button
              key={player.playerId}
              variant={selectedTarget === player.playerId ? "default" : "outline"}
              className="w-full justify-start gap-3 h-12 text-lg"
              onClick={() => setSelectedTarget(player.playerId)}
              disabled={hasVoted}
            >
              <User className="h-5 w-5" />
              {player.name}
              {selectedTarget === player.playerId && <Check className="ml-auto h-6 w-6" />}
            </Button>
          ))}
        </div>

        <div className="flex flex-col items-center">
            {hasVoted ? (
                <p className="text-green-600 font-semibold">Your vote has been cast! Waiting for others...</p>
            ) : (
                <Button onClick={handleVote} size="lg" className="w-full" disabled={!selectedTarget || isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Confirm Vote
                </Button>
            )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
